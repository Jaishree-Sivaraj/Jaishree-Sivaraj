import multer from 'multer'
import XLSX from 'xlsx'
import _ from 'lodash'
import nodemailer from 'nodemailer'
import { success, notFound } from '../../services/response/'
import { User } from '.'
import { sign } from '../../services/jwt'
import { Role } from '../role'
import { Employees } from '../employees'
import { ClientRepresentatives } from '../client-representatives'
import { CompanyRepresentatives } from '../company-representatives'
import fileType from 'file-type'
import * as fs from 'fs'
import path from 'path'
import { compareSync } from 'bcrypt'

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  User.count(query)
    .then(count => User.find(query).sort({ createdAt: -1 })
      .populate('roleId').populate({
        path: 'roleDetails.roles'
      }).populate({
        path: 'roleDetails.primaryRole'
      })
      .then(users => ({
        rows: users.map((user) => user.view()),
        count
      }))
    )
    .then(success(res))
    .catch(next)

export const getUsersApprovals = ({ params, querymen: { query, select, cursor }, res, next }) => {
  query.isUserApproved = params.isUserApproved;
  User.count(query)
    .then(count => User.find(query, select, cursor)
      .populate('roleId')
      .then(users => ({
        count,
        rows: users.map((user) => user.view())
      }))
    )
    .then(success(res))
    .catch(next)
}

export const show = ({ params }, res, next) => {
  User.findById(params.id).populate('roleId').then(notFound(res)).then(function (userDetails) {
    var userType = '';
    userDetails = userDetails.toObject();
    delete userDetails.password;
    if (userDetails.userType) {
      userType = userDetails.userType;
    } else {
      if (userDetails.role) {
        userType = userDetails.role;
      }
    }
    if (userType === 'Employee') {
      Employees.findOne({ userId: userDetails._id }).then(function (employee) {
        var employeeDocuments = {
          pancardUrl: employee && employee.pancardUrl ? employee.pancardUrl : '',
          aadhaarUrl: employee && employee.aadhaarUrl ? employee.aadhaarUrl : '',
          cancelledChequeUrl: employee && employee.cancelledChequeUrl ? employee.cancelledChequeUrl : ''
        }
        userDetails.documents = employeeDocuments;
        userDetails.firstName = employee.firstName;
        userDetails.middleName = employee.middleName;
        userDetails.lastName = employee.lastName;
        userDetails.panNumber = employee.panNumber;
        userDetails.aadhaarNumber = employee.aadhaarNumber;
        userDetails.bankAccountNumber = employee.bankAccountNumber;
        userDetails.bankIFSCCode = employee.bankIFSCCode;
        return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
      }).catch(err => {
        return res.status(500).json({ message: "Failed to get user" })
      })
    } else if (userType === 'Company Representative') {
      CompanyRepresentatives.findOne({ userId: userDetails._id }).populate('companiesList').then(function (company) {
        var companyDocuments = {
          authenticationLetterForCompanyUrl: company && company.authenticationLetterForCompanyUrl ? company.authenticationLetterForCompanyUrl : '',
          companyIdForCompany: company && company.companyIdForCompany ? company.companyIdForCompany : ''
        }
        userDetails.documents = companyDocuments;
        userDetails.companies = company.companiesList.map((rec) => {
          return { label: rec.companyName, value: 'companyName' }
        });
        return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
      }).catch(err => {
        return res.status(500).json({ message: "Failed to get user" })
      })
    } else if (userType === 'Client Representative') {
      ClientRepresentatives.findOne({ userId: userDetails._id }).populate('CompanyName').then(function (client) {
        var clientDocuments = {
          authenticationLetterForClientUrl: client && client.authenticationLetterForClientUrl ? client.authenticationLetterForClientUrl : '',
          companyIdForClient: client && client.companyIdForClient ? client.companyIdForClient : '',
        }
        userDetails.documents = clientDocuments;
        userDetails.companyName = client.CompanyName ? { label: client.CompanyName.companyName, value: 'companyName' } : null;
        return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
      }).catch(err => {
        return res.status(500).json({ message: "Failed to get user" })
      })
    } else {
      return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
    }
  }).catch(err => {
    return res.status(500).json({ message: "Failed to get user" })
  })
}

export const showMe = ({ user }, res) =>
  res.json(user.view(true))

export const create = ({ bodymen: { body } }, res, next) =>
  User.create(body)
    .then(user => {
      sign(user.id)
        .then((token) => ({ token, user: user.view(true) }))
        .then(success(res, 201))
    })
    .catch((err) => {
      /* istanbul ignore else */
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).json({
          valid: false,
          param: 'email',
          message: 'email already registered'
        })
      } else {
        next(err)
      }
    })

export const onBoardNewUser = async ({ bodymen: { body }, params, user }, res, next) => {
  let bodyData = Buffer.from(body.onBoardingDetails, 'base64');
  let onBoardingDetails = JSON.parse(bodyData);
  let roleDetails = await Role.find({ roleName: { $in: ["Employee", "Client Representative", "Company Representative"] } });
  let userObject;
  if (onBoardingDetails.email) {
    await User.findOne({ email: onBoardingDetails.email }).then(async (userFound) => {
      if (userFound) {
        if (userFound.isUserRejected && !userFound.isUserApproved) {
          if (onBoardingDetails.roleName == "Employee") {
            var roleObject = roleDetails.find((rec) => rec.roleName === 'Employee')
            userObject = {
              name: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
              userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
              phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
              isUserApproved: false,
              status: true,
              isUserRejected: false
            };
            await User.updateOne({ _id: userFound.id }, { $set: userObject }).then(async () => {
              await Employees.updateOne({ userId: userFound.id }, {
                $set: {
                  userId: userFound.id,
                  firstName: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
                  middleName: onBoardingDetails.middleName ? onBoardingDetails.middleName : '',
                  lastName: onBoardingDetails.lastName ? onBoardingDetails.lastName : '',
                  panNumber: onBoardingDetails.panNumber ? onBoardingDetails.panNumber : '',
                  aadhaarNumber: onBoardingDetails.aadhaarNumber ? onBoardingDetails.aadhaarNumber : '',
                  bankAccountNumber: onBoardingDetails.bankAccountNumber ? onBoardingDetails.bankAccountNumber : '',
                  bankIFSCCode: onBoardingDetails.bankIFSCCode ? onBoardingDetails.bankIFSCCode : '',
                  accountHolderName: onBoardingDetails.accountHolderName ? onBoardingDetails.accountHolderName : '',
                  pancardUrl: onBoardingDetails.pancardUrl,
                  aadhaarUrl: onBoardingDetails.aadhaarUrl,
                  cancelledChequeUrl: onBoardingDetails.cancelledChequeUrl,
                  status: true
                }
              }).then(async () => {
                var userDetails = await Employees.findOne({ userId: userFound.id }).populate('userId');
                return res.status(200).json({ status: '200', message: "Your details has been updated successfully", data: userDetails ? userDetails : {} });
              });
            }).catch((err) => {
              if (err.name === 'MongoError' && err.code === 11000) {
                res.status(409).json({
                  valid: false,
                  param: 'email',
                  message: 'email already registered'
                })
              } else {
                next(err)
              }
            })
          } else if (onBoardingDetails.roleName == "Client Representative") {
            var roleObject = roleDetails.find((rec) => rec.roleName === 'Client Representative');
            userObject = {
              name: onBoardingDetails.name ? onBoardingDetails.name : '',
              userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
              phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
              isUserApproved: false,
              status: true,
              isUserRejected: false
            }
            await User.updateOne({ _id: userFound.id }, { $set: userObject }).then(async (response) => {
              await ClientRepresentatives.updateOne({ userId: userFound.id }, {
                $set: {
                  userId: userFound.id,
                  CompanyName: onBoardingDetails.companyName ? onBoardingDetails.companyName : "",
                  authenticationLetterForClientUrl: onBoardingDetails.authenticationLetterForClientUrl,
                  companyIdForClient: onBoardingDetails.companyIdForClient,
                  status: true
                }
              }).then(async () => {
                var userDetails = await ClientRepresentatives.findOne({ userId: userFound.id }).populate('userId');
                return res.status(200).json({ status: '200', message: "Your details has been updated successfully", data: userDetails ? userDetails : {} });
              })
            }).catch((err) => {
              /* istanbul ignore else */
              if (err.name === 'MongoError' && err.code === 11000) {
                res.status(409).json({
                  valid: false,
                  param: 'email',
                  message: 'email already registered'
                })
              } else {
                next(err)
              }
            })
          } else if (onBoardingDetails.roleName == "Company Representative") {
            var roleObject = roleDetails.find((rec) => rec.roleName === 'Company Representative');
            userObject = {
              name: onBoardingDetails.name ? onBoardingDetails.name : '',
              userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
              phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
              isUserApproved: false,
              status: true,
              isUserRejected: false
            }
            var companiesList = onBoardingDetails.companiesList.map((rec) => { return rec.value });
            await User.updateOne({ _id: userFound.id }, { $set: userObject })
              .then(async () => {
                await CompanyRepresentatives.updateOne({ userId: userFound.id }, {
                  $set: {
                    userId: userFound.id,
                    companiesList: companiesList ? companiesList : "",
                    authenticationLetterForCompanyUrl: onBoardingDetails.authenticationLetterForCompanyUrl,
                    companyIdForCompany: onBoardingDetails.companyIdForCompany,
                    status: true
                  }
                }).then(async () => {
                  var userDetails = await CompanyRepresentatives.findOne({ userId: userFound.id }).populate('userId');
                  return res.status(200).json({ status: '200', message: "Your details has been updated successfully", data: userDetails ? userDetails : {} });
                })
              })
              .catch((err) => {
                if (err.name === 'MongoError' && err.code === 11000) {
                  res.status(409).json({
                    valid: false,
                    param: 'email',
                    message: 'email already registered'
                  })
                } else {
                  next(err)
                }
              })

          } else if (onBoardingDetails.roleName == "Analyst") {
            //TODO
          } else if (onBoardingDetails.roleName == "QA") {
            //TODO
          } else {
            return res.status(500).json({ message: "Failed to onboard, invalid value for role or roleName" });
          }
        } else {
          res.status(409).json({
            valid: false,
            param: 'email',
            message: 'email already registered'
          })
        }
      } else {
        if (onBoardingDetails.roleName == "Employee") {
          var roleObject = roleDetails.find((rec) => rec.roleName === 'Employee')
          userObject = {
            email: onBoardingDetails.email ? onBoardingDetails.email : '',
            name: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
            userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
            password: onBoardingDetails.password ? onBoardingDetails.password : '',
            phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
            isUserApproved: false,
            status: true
          }
          User.create(userObject)
            .then(async (response) => {
              if (response) {
                let userId = response.id;
                Employees.create({
                  userId: userId,
                  firstName: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
                  middleName: onBoardingDetails.middleName ? onBoardingDetails.middleName : '',
                  lastName: onBoardingDetails.lastName ? onBoardingDetails.lastName : '',
                  panNumber: onBoardingDetails.panNumber ? onBoardingDetails.panNumber : '',
                  aadhaarNumber: onBoardingDetails.aadhaarNumber ? onBoardingDetails.aadhaarNumber : '',
                  bankAccountNumber: onBoardingDetails.bankAccountNumber ? onBoardingDetails.bankAccountNumber : '',
                  bankIFSCCode: onBoardingDetails.bankIFSCCode ? onBoardingDetails.bankIFSCCode : '',
                  accountHolderName: onBoardingDetails.accountHolderName ? onBoardingDetails.accountHolderName : '',
                  pancardUrl: onBoardingDetails.pancardUrl,
                  aadhaarUrl: onBoardingDetails.aadhaarUrl,
                  cancelledChequeUrl: onBoardingDetails.cancelledChequeUrl,
                  status: true
                }).then((resp) => {
                  if (resp) {
                    return res.status(200).json({ message: "Your details has been saved successfully. will get back to you shortly through mail", _id: response.id, name: response.name, email: response.email });
                  } else {
                    return res.status(500).json({ message: "Failed to onboard employee" });
                  }
                });
              } else {
                return res.status(500).json({ message: "Failed to onboard employee" });
              }
            })
            .catch((err) => {
              if (err.name === 'MongoError' && err.code === 11000) {
                res.status(409).json({
                  valid: false,
                  param: 'email',
                  message: 'email already registered'
                })
              } else {
                next(err)
              }
            })
        } else if (onBoardingDetails.roleName == "Client Representative") {
          var roleObject = roleDetails.find((rec) => rec.roleName === 'Client Representative');
          userObject = {
            email: onBoardingDetails.email ? onBoardingDetails.email : '',
            name: onBoardingDetails.name ? onBoardingDetails.name : '',
            userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
            roleDetails: { primaryRole: roleObject.id, roles: [] },
            password: onBoardingDetails.password ? onBoardingDetails.password : '',
            phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
            isUserApproved: false,
            status: true
          }
          User.create(userObject)
            .then(async (response) => {
              if (response) {
                let userId = response.id;
                ClientRepresentatives.create({
                  userId: userId,
                  name: onBoardingDetails.name ? onBoardingDetails.name : '',
                  email: onBoardingDetails.email ? onBoardingDetails.email : '',
                  password: onBoardingDetails.password ? onBoardingDetails.password : '',
                  phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : "",
                  CompanyName: onBoardingDetails.companyName ? onBoardingDetails.companyName : "",
                  authenticationLetterForClientUrl: onBoardingDetails.authenticationLetterForClientUrl,
                  companyIdForClient: onBoardingDetails.companyIdForClient,
                  status: true
                });
                return res.status(200).json({ message: "Your details has been saved successfully. will get back to you shortly through mail", _id: response.id, name: response.name, email: response.email });
              } else {
                return res.status(500).json({ message: "Failed to onboard client representative" });
              }
            })
            .catch((err) => {
              /* istanbul ignore else */
              if (err.name === 'MongoError' && err.code === 11000) {
                res.status(409).json({
                  valid: false,
                  param: 'email',
                  message: 'email already registered'
                })
              } else {
                next(err)
              }
            })
        } else if (onBoardingDetails.roleName == "Company Representative") {
          var roleObject = roleDetails.find((rec) => rec.roleName === 'Company Representative');
          userObject = {
            email: onBoardingDetails.email ? onBoardingDetails.email : '',
            name: onBoardingDetails.name ? onBoardingDetails.name : '',
            userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
            roleDetails: { primaryRole: roleObject.id, roles: [] },
            password: onBoardingDetails.password ? onBoardingDetails.password : '',
            phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
            isUserApproved: false,
            status: true
          }
          var companiesList = onBoardingDetails.companiesList.map((rec) => { return rec.value });
          User.create(userObject)
            .then(async (response) => {
              if (response) {
                let userId = response.id;
                CompanyRepresentatives.create({
                  userId: userId,
                  name: onBoardingDetails.name ? onBoardingDetails.name : '',
                  email: onBoardingDetails.email ? onBoardingDetails.email : '',
                  password: onBoardingDetails.password ? onBoardingDetails.password : '',
                  phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : "",
                  companiesList: companiesList ? companiesList : "",
                  authenticationLetterForCompanyUrl: onBoardingDetails.authenticationLetterForCompanyUrl,
                  companyIdForCompany: onBoardingDetails.companyIdForCompany,
                  status: true
                });
                return res.status(200).json({ message: "Your details has been saved successfully. will get back to you shortly through mail", _id: response.id, name: response.name, email: response.email });
              } else {
                return res.status(500).json({ message: "Failed to onboard company representative" });
              }
            })
            .catch((err) => {
              if (err.name === 'MongoError' && err.code === 11000) {
                res.status(409).json({
                  valid: false,
                  param: 'email',
                  message: 'email already registered'
                })
              } else {
                next(err)
              }
            })

        } else if (onBoardingDetails.roleName == "Analyst") {
          //TODO
        } else if (onBoardingDetails.roleName == "QA") {
          //TODO
        } else {
          return res.status(500).json({ message: "Failed to onboard, invalid value for role or roleName" });
        }
      }
    })
  }
}

async function storeOnBoardingImagesInLocalStorage(onboardingBase64Image, folderName) {
  return new Promise(function (resolve, reject) {
    let base64Image = onboardingBase64Image.split(';base64,').pop();
    fileType.fromBuffer((Buffer.from(base64Image, 'base64'))).then(function (res) {
      let fileName = folderName + '_' + Date.now() + '.' + res.ext;
      var filePath = path.join(__dirname, '../../../uploads/') + folderName + '/' + fileName;
      fs.writeFile(filePath, base64Image, { encoding: 'base64' }, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(fileName);
        }
      });
    }).catch(function (err) {
      reject(err);
    })
  })
}

export const updateUserStatus = ({ bodymen: { body }, user }, res, next) => {
  User.findById(body.userId)
    .populate('roleId')
    .then((result) => {
      if (result) {
        User.updateOne({ _id: body.userId }, { $set: { isUserApproved: body.isUserApproved ? body.isUserApproved : false, comments: body.comments ? body.comments : '' } })
          .then((updatedObject) => {
            if (updatedObject) {
              return res.status(200).json({ message: "User status updated" });
            } else {
              return res.status(500).json({ message: "Failed to update user status!" });
            }
          })
      } else {
        return res.status(400).json({ message: "Invalid UserId" });
      }
    })

}

export const assignRole = ({ bodymen: { body }, user }, res, next) => {
  var roles = body.roleDetails.role.map((rec) => rec.value);
  var primaryRole = body.roleDetails.primaryRole.value;
  var roleDetails = {
    roles,
    primaryRole
  }
  User.updateOne({ _id: body.userDetails.value }, { $set: { roleDetails, isRoleAssigned: true } }).then((updatedObject) => {
    if (updatedObject) {
      User.findById(body.userDetails.value).populate({
        path: 'roleDetails.roles'
      }).populate({
        path: 'roleDetails.primaryRole'
      }).then((userById) => {
        var resObject = {
          "userDetails": {
            "value": userById._id,
            "label": userById.name
          },
          "roleDetails": {
            "role": userById.roleDetails.roles.map((rec) => {
              return { value: rec.id, label: rec.roleName }
            }),
            "primaryRole": { value: userById.roleDetails.primaryRole.id, label: userById.roleDetails.primaryRole.roleName }
          }
        }
        return res.status(200).send({ status: '200', message: 'Roles Updated Successfully', resObject });
      }).catch((err) => {
        next(err);
      })
    } else {
      return res.status(500).json({ message: "Failed to update Role details" });
    }
  }).catch((err) => {
    //next(err);
    return res.status(500).json({ message: "Failed to update Role details" });
  })
}

export const genericFilterUser = async ({ bodymen: { body }, user }, res, next) => {
  let filterQuery = { "status": true, "userType": { $ne: "SuperAdmin" } };
  if (body.filters.length > 0) {
    for (let index = 0; index < body.filters.length; index++) {
      let filterWith = body.filters[index].filterWith;
      let value = body.filters[index].value;
      if (filterWith === 'role') {
        let roleDetails = await Role.findOne({ roleName: value }).catch((err) => { return res.json({ status: '500', message: err.message }) });
        if (roleDetails && Object.keys(roleDetails).length > 0) {
          filterQuery["$or"] = [{ "roleDetails.roles": { "$in": roleDetails._id } }, { "roleDetails.primaryRole": roleDetails._id }]
        }
      } else {
        filterQuery[filterWith] = value;
      }
    }
  }
  var userDetailsInRoles = await User.find(filterQuery)
  .populate({ path: 'roleDetails.roles' })
  .populate({ path: 'roleDetails.primaryRole' }).sort({ 'createdAt': -1, 'updatedAt': -1 }).catch((err) => { return res.json({ status: '500', message: err.message }) });
  var resArray = userDetailsInRoles.map((rec) => {
    return {
      "userDetails": {
        "value": rec._id,
        "label": rec.name,
      },
      "roleDetails": {
        "role": rec.roleDetails.roles.map((rec1) => {
          return { value: rec1.id, label: rec1.roleName }
        }),
        "primaryRole": { value: rec.roleDetails.primaryRole ? rec.roleDetails.primaryRole.id : null, label: rec.roleDetails.primaryRole ? rec.roleDetails.primaryRole.roleName : null }
      },
      "role": rec.role,
      "userType": rec.userType,
      "email": rec.email,
      "phoneNumber": rec.phoneNumber,
      "isUserApproved": rec.isUserApproved,
      "isRoleAssigned": rec.isRoleAssigned,
      "isAssignedToGroup": rec.isAssignedToGroup,
      "createdAt": rec.createdAt,
      "status": rec.status,
      "isUserRejected": rec.isUserRejected,
      "isUserActive": rec.isUserActive
    }
  })
  return res.status(200).json({ status: '200', count: resArray.length, message: 'Users Fetched Successfully', data: resArray });
}

export const getAllUsersToAssignRoles = (req, res, next) => {
  User.find({ isUserApproved: true }).populate({
    path: 'roleDetails.roles'
  }).populate({
    path: 'roleDetails.primaryRole'
  }).then((userById) => {
    var resArray = userById.map((rec) => {
      return {
        "userDetails": {
          "value": rec._id,
          "label": rec.name
        },
        "roleDetails": {
          "role": rec.roleDetails.roles.map((rec1) => {
            return { value: rec1.id, label: rec1.roleName }
          }),
          "primaryRole": { value: rec.roleDetails.primaryRole ? rec.roleDetails.primaryRole.id : null, label: rec.roleDetails.primaryRole ? rec.roleDetails.primaryRole.roleName : null }
        }
      }
    })
    return res.status(200).send({ status: '200', message: 'users fetched successfully', count: resArray.length, rows: resArray });
  }).catch((err) => {
    next(err);
  })
}

export const updateUserRoles = ({ bodymen: { body }, user }, res, next) => {
  //User.find({ isUserApproved: true, isRoleAssigned: true });//Separate New API to return only approved and role assigned users
  var roles = body.roleDetails.map(rec => rec.value);
  User.updateOne({ _id: body.id }, { $set: { isRoleAssigned: true, roleId: roles } })
    .then((updatedObject) => {
      if (updatedObject) {
        return res.status(200).json({ message: "Role details added to user" });
      } else {
        return res.status(500).json({ message: "Failed to update Role details" });
      }
    })
}

// export const getApprovedAndAssignedRoleUser = (req, res, next => {
//   User.find({ isUserApproved: true, isRoleAssigned: true }).then((approvedUsers) => {
//     res.send(approvedUsers);
//   })
// })


export const update = ({ bodymen: { body }, params, user }, res, next) => {
  if (body.userDetails && body.userDetails.hasOwnProperty('isUserApproved') && !body.userDetails.isUserApproved) {
    body.userDetails.isUserRejected = true;
  }
  User.updateOne({ _id: body.userId }, { $set: body.userDetails }).then(function (userUpdates) {
    if (body.userDetails && body.userDetails.hasOwnProperty('isUserApproved') && !body.userDetails.isUserApproved) {
      User.findById(body.userId).then(function (userDetails) {
        var link = `${process.env.FRONTEND_URL}/onboard/new-user?`;
        link = link + `role=${userDetails.userType || userDetails.role}&email=${userDetails.email}&id=${userDetails.id}`;
        userDetails = userDetails.toObject();
        const content = `
                  Hai,<br/>
                  Please use the following link to submit your ${userDetails.userType} onboarding details:<br/>
                  URL: ${link}<br/><br/>
                  &mdash; ESG Team `;
        var transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'testmailer09876@gmail.com',
            pass: 'ijsfupqcuttlpcez'
          }
        });
        transporter.sendMail({
          from: 'testmailer09876@gmail.com',
          to: userDetails['email'],
          subject: 'ESG - Onboarding',
          html: content
        });
      })
      return res.status(200).json({
        message: 'User details updated successfully',
      });
    } else {
      return res.status(200).json({
        message: 'User details updated successfully',
      });
    }
  }).catch(err => {
    return res.status(500).json({
      message: err.message ? err.message : 'Failed to update userDetails',
    });
  })
}


// export const update = ({ bodymen: { body }, params, user }, res, next) =>
//   User.findById(params.id === 'me' ? user.id : params.id)
//     .populate('roleId')
//     .then(notFound(res))
//     .then((result) => {
//       if (!result) return null
//       const isAdmin = user.role === 'admin'
//       const isSelfUpdate = user.id === result.id
//       if (!isSelfUpdate && !isAdmin) {
//         res.status(401).json({
//           valid: false,
//           message: 'You can\'t change other user\'s data'
//         })
//         return null
//       }
//       return result
//     })
//     .then((user) => user ? Object.assign(user, body).save() : null)
//     .then((user) => user ? user.view(true) : null)
//     .then(success(res))
//     .catch(next)

export const updatePassword = ({ bodymen: { body }, params, user }, res, next) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate) {
        res.status(401).json({
          valid: false,
          param: 'password',
          message: 'You can\'t change other user\'s password'
        })
        return null
      }
      return result
    })
    .then((user) => user ? user.set({ password: body.password }).save() : null)
    .then((user) => user ? user.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  User.findById(params.id)
    .then(notFound(res))
    .then((user) => user ? user.remove() : null)
    .then(success(res, 204))
    .catch(next)


export const onBoardingEmpolyee = ({ bodymen: { body }, params, user }, res, next) => {


  var details = Buffer.from(body.onboardingdetails, 'base64');

  let onboardDetails = details.toString('ascii');

  let parse = JSON.parse(onboardDetails);

  User.findOne({ email: parse.email, password: parse.password }).then(data => {
    if (!data) {
      new User({
        firstName: parse.firstName,
        middleName: parse.middleName,
        lastName: parse.lastName,
        email: parse.email,
        phoneNumber: parse.phoneNumber,
        PANCard: parse.PANCard,
        adharCard: parse.adharCard,
        bankAccountNumber: parse.bankAccountNumber,
        bankIFSCCode: parse.bankIFSCCode,
        nameOfTheAccountHolder: parse.nameOfTheAccountHolder,
        password: parse.password,
        pancardUpload: body.pancard,
        aadharUpload: body.aadhar,
        cancelledchequeUpload: body.cancelledcheque,
        roleId: '60a2440d356d366605b04524'
      }).save()
    } else { res.json({ status: 200, message: 'Employee Already Exist' }) }
  }).then(res.json({
    status: 200,
    message: "employee Added Successfully"
  })).catch(next)

}

export const onBoardingClientRep = ({ bodymen: { body }, params, user }, res, next) => {
  var details = Buffer.from(body.onboardingdetails, 'base64');

  let onboardDetails = details.toString('ascii');

  let parse = JSON.parse(onboardDetails);

  User.findOne({ email: parse.email, password: parse.password }).then(data => {
    if (!data) {
      new User({
        name: parse.name,
        email: parse.email,
        phoneNumber: parse.phoneNumber,
        companyName: parse.companyName,
        password: parse.password,
        roleId: '60a243f0356d366605b04522',
        authendicationLetter: parse.authenticationletterforclient,
        companyIdCard: parse.companyidforclient,
      }).save()

    } else {
      res.json({
        status: 200,
        message: "Client Rep Already Exist"
      })
    }
  }).then(res.json({
    status: 200,
    message: "Client Rep Added Successfully"
  })).catch(next)

}


export const onBoardingCompanyRep = ({ bodymen: { body }, params, user }, res, next) => {
  var details = Buffer.from(body.onboardingdetails, 'base64');

  let onboardDetails = details.toString('ascii');

  let parse = JSON.parse(onboardDetails);

  User.findOne({ email: parse.email, password: parse.password }).then(data => {
    if (!data) {
      new User({
        name: parse.name,
        email: parse.email,
        phoneNumber: parse.phoneNumber,
        companyName: parse.companyName,
        password: parse.password,
        roleId: '60a243e1356d366605b04521',
        authendicationLetter: body.authenticationletterforcompany,
        companyIdCard: body.companyidforcompany
      }).save()

    } else {
      res.json({
        status: 200,
        message: 'Company Rep Already Exist'
      })
    }
  }).then(res.json({
    status: 200,
    message: "Company Rep Added Successfully"
  })).catch(next)

}

export const uploadEmailsFile = async (req, res, next) => {

  try {
    let convertedWorkbook;
    convertedWorkbook = XLSX.read(req.body.emailFile.replace(/^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/, ""));
    if (convertedWorkbook.SheetNames.length > 0) {
      var worksheet = convertedWorkbook.Sheets[convertedWorkbook.SheetNames[0]];
      try {
        var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: " " });
        //code for sending onboarding links to emails
        let existingUserEmailsList = await User.find({ "status": true });
        let rolesList = await Role.find({ "status": true });
        if (sheetAsJson.length > 0) {
          let existingEmails = [], hasInvalidData = false;
          for (let index1 = 0; index1 < sheetAsJson.length; index1++) {
            const rowObject = sheetAsJson[index1];
            let checkEmail = existingUserEmailsList.find(object => rowObject['email'] == object.email);
            if (checkEmail) {
              existingEmails.push(rowObject['email']);
            }
            if (rowObject['email'] == ' ' || !rowObject['email']) {
              hasInvalidData = true;
              return res.status(400).json({ status: "400", message: "Email Id is not Present in the Column Please check input file" });
            } else if (rowObject['onboardingtype'] != 'Employee' && rowObject['onboardingtype'] != 'Company Representative' && rowObject['onboardingtype'] != 'Client Representative') {
              hasInvalidData = true;
              return res.status(400).json({ status: "400", message: "Invalid input for onboardingtype, Please check!" });
            }
          }
          if (!hasInvalidData) {
            for (let index = 0; index < sheetAsJson.length; index++) {
              const rowObject = sheetAsJson[index];
              let isEmailExisting = existingUserEmailsList.find(object => rowObject['email'] == object.email);
              let rolesDetails = rolesList.find(object => (object.roleName == rowObject['onboardingtype']));
              let link;
              if (rolesDetails) {
                if (rolesDetails.roleName == "Employee") {
                  link = `/onboard/new-user?role=Employee&email=${rowObject['email']}`
                } else if ((rolesDetails.roleName == "Company Representative") || (rolesDetails.roleName == "CompanyRepresentative")) {
                  link = `/onboard/new-user?role=CompanyRepresentative&email=${rowObject['email']}`
                } else {
                  link = `/onboard/new-user?role=ClientRepresentative&email=${rowObject['email']}`
                }
                //nodemail code will come here to send OTP  
                if (!isEmailExisting) {
                  const content = `
                    Hai,<br/>
                    Please use the following link to submit your ${rolesDetails.roleName} onboarding details:<br/>
                    URL: ${process.env.FRONTEND_URL}${link}?email=${rowObject['email']}<br/><br/>
                    &mdash; ESG Team `;
                  var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                      user: 'testmailer09876@gmail.com',
                      pass: 'ijsfupqcuttlpcez'
                    }
                  });

                  transporter.sendMail({
                    from: 'testmailer09876@gmail.com',
                    to: rowObject['email'],
                    subject: 'ESG - Onboarding',
                    html: content
                  });
                } else {
                  return res.status(409).json({ status: "409", message: "Duplicate emails present in file please check!", duplicateEmailsList: existingEmails.length > 0 ? existingEmails : "Nil" })
                }
              } else {
                return res.status(400).json({ status: "400", message: "File has some invalid onboarding type, please check!" });
              }
            }
            return res.status(200).json({ status: "200", message: "List uploaded and emails sent sucessfully", UsersAlreadyOnboarded: existingEmails.length > 0 ? existingEmails : "Nil" });
          } else {
            return res.status(400).json({ status: "400", message: "File has some invalid data please check!" });
          }
        } else {
          return res.status(400).json({ status: "400", message: "No values present in the uploaded file, please check!" })
        }
      } catch (error) {
        return res.status(400).json({ message: error.message })
      }
    } else {
      return res.status(400).json({ status: "400", message: "Invalid excel file please check!" })
    }
  } catch (error) {
    if (error) {
      return res.status(403).json({
        message: error.message ? error.message : 'Failed to upload onboarding emails',
        status: 403
      });
    }
  }
}

export const sendMultipleOnBoardingLinks = async ({ bodymen: { body } }, res, next) => {
  const emailList = body.emailList;
  let existingUserEmailsList = await User.find({ "status": true });
  let rolesList = await Role.find({ "status": true });
  if (emailList.length > 0) {
    let existingEmails = [];
    for (let index = 0; index < emailList.length; index++) {
      const rowObject = emailList[index];
      let isEmailExisting = existingUserEmailsList.find(object => rowObject['email'] == object.email);
      if (isEmailExisting) {
        existingEmails.push(isEmailExisting.email);
      }
    }

    for (let index = 0; index < emailList.length; index++) {
      const rowObject = emailList[index];
      let isEmailExisting = existingUserEmailsList.find(object => rowObject['email'] == object.email);
      let rolesDetails = rolesList.find(object => object._id == rowObject['onboardingtype']);
      let link;
      if (rolesDetails && rolesDetails.roleName == "Employee") {
        link = `/onboard/new-user?role=Employee`
      } else if (rolesDetails && ((rolesDetails.roleName == "Company Representative") || (rolesDetails.roleName == "CompanyRepresentative"))) {
        link = `/onboard/new-user?role=CompanyRepresentative`
      } else {
        link = `/onboard/new-user?role=ClientRepresentative`
      }
      if (!isEmailExisting) {
        //nodemail code will come here to send OTP
        const content = `
          Hai,<br/>
          Please use the following link to submit your ${rolesDetails.roleName} onboarding details:<br/>
          URL: ${process.env.FRONTEND_URL}${link}&email=${rowObject['email']}<br/><br/>
          &mdash; ESG Team `;
        var transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'testmailer09876@gmail.com',
            pass: 'ijsfupqcuttlpcez'
          }
        });

        transporter.sendMail({
          from: 'testmailer09876@gmail.com',
          to: rowObject['email'],
          subject: 'ESG - Onboarding',
          html: content
        });
      }
    }
    if (existingEmails.length > 0) {
      return res.status(409).json({ status: "409", message: `User with same email id: ${existingEmails}, already exits` });
    } else {
      return res.status(200).json({ status: "200", message: "Emails Sent Sucessfully", UsersAlreadyOnboarded: existingEmails.length > 0 ? existingEmails : "Nil" });
    }
  } else {
    return res.status(400).json({ status: "400", message: "No Emails Present in the EmailList" })
  }
}

// export const getRoleUser = async ({ req, res, next }) => {
//   let userRoles = ['Analyst', 'QA', 'GroupAdmin'];
//   let roleIds = [];
//   for (let roleIndex = 0; roleIndex < userRoles.length; roleIndex++) {
//     let roleDetails = await Role.findOne({ roleName: userRoles[roleIndex] });
//     roleIds.push(roleDetails.id);
//   }
//   //let userDetails = await User.find({ status: true, '$or': [{ 'roleDetails.roles': { '$in': roleIds } }, { 'roleDetails.primaryRole': { '$in': roleIds } }] })
//   let userDetails = await User.find({ status: true,  roleId: { '$in': roleIds }  })
//   return res.json({ status: 200, message: "User Details retrieved successfully ", UserDetails: userDetails });

// }
