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
    .then(count => User.find(query, select, cursor)
      .populate('roleId')
      .then(users => ({
        rows: users.map((user) => user.view()),
        count
      }))
    )
    .then(success(res))
    .catch(next)

export const getUsersByRole = ({ params, querymen: { query, select, cursor } }, res, next) => {
  let findQuery = query;
  findQuery.role = params.role ? params.role : '';
  User.count(findQuery)
    .then(count => User.find(findQuery, select, cursor)
      .populate('roleId')
      .then(users => ({
        rows: users.map((user) => user.view()),
        count
      }))
    )
    .then(success(res))
    .catch(next)
}

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

export const show = ({ params }, res, next) =>
  User.findById(params.id)
    .populate('roleId')
    .then(notFound(res))
    .then((user) => user ? user.view() : null)
    .then(success(res))
    .catch(next)

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
  let bodyDetails = bodyData.toString('ascii');
  let onBoardingDetails = JSON.parse(bodyDetails);
  //console.log('onBoardingDetails', onBoardingDetails);
  let roleDetails = await Role.find({ roleName: { $in: ["Employee", "Client Representative", "Company Representative"] } });
  let userObject;
  if (onBoardingDetails.roleName == "Employee") {
    var roleObject = roleDetails.find((rec) => rec.roleName === 'Employee')
    userObject = {
      email: onBoardingDetails.email ? onBoardingDetails.email : '',
      name: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
      role: roleObject && roleObject.roleName ? roleObject.roleName : '',
      roleId: roleObject && roleObject._id ? roleObject._id : '',
      password: onBoardingDetails.password ? onBoardingDetails.password : '',
      phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
      isUserApproved: false,
      status: true
    }
    await storeOnBoardingImagesInLocalStorage(onBoardingDetails.pancardUrl, 'pan').then(async (pancardUrl) => {
      await storeOnBoardingImagesInLocalStorage(onBoardingDetails.aadhaarUrl, 'aadhar').then(async (aadhaarUrl) => {
        await storeOnBoardingImagesInLocalStorage(onBoardingDetails.cancelledChequeUrl, 'cancelledCheque').then(async (cancelledChequeUrl) => {
          await User.create(userObject)
            .then(async (response) => {
              if (response) {
                let userId = response.id;
                await Employees.create({
                  userId: userId,
                  firstName: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
                  middleName: onBoardingDetails.middleName ? onBoardingDetails.middleName : '',
                  lastName: onBoardingDetails.lastName ? onBoardingDetails.lastName : '',
                  panNumber: onBoardingDetails.panNumber ? onBoardingDetails.panNumber : '',
                  aadhaarNumber: onBoardingDetails.aadhaarNumber ? onBoardingDetails.aadhaarNumber : '',
                  bankAccountNumber: onBoardingDetails.bankAccountNumber ? onBoardingDetails.bankAccountNumber : '',
                  bankIFSCCode: onBoardingDetails.bankIFSCCode ? onBoardingDetails.bankIFSCCode : '',
                  accountHolderName: onBoardingDetails.accountHolderName ? onBoardingDetails.accountHolderName : '',
                  pancardUrl: Buffer.from(onBoardingDetails.pancardUrl, 'base64'),
                  aadhaarUrl: Buffer.from(onBoardingDetails.aadhaarUrl, 'base64'),
                  cancelledChequeUrl: Buffer.from(onBoardingDetails.cancelledChequeUrl, 'base64'),
                  status: true,
                  createdBy: user
                }).then((resp) => {
                  if (resp) {
                    return res.status(200).json({ message: "New Employee onboarded successfully!", _id: response.id, name: response.name, email: response.email });
                  } else {
                    return res.status(500).json({ message: "Failed to onboard employee" });
                  }
                });
              } else {
                return res.status(500).json({ message: "Failed to onboard employee" });
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
        }).catch((err) => {
          return res.status(500).json({ message: "Failed to store cancelledChequeUrl" })
        });
      }).catch((err) => {
        return res.status(500).json({ message: "Failed to store aadharcard url" })
      });
    }).catch((err) => {
      return res.status(500).json({ message: "Failed to store pancard url" })
    });
  } else if (onBoardingDetails.roleName == "Client Representative") {
    var roleObject = roleDetails.find((rec) => rec.roleName === 'Client Representative');
    userObject = {
      email: onBoardingDetails.email ? onBoardingDetails.email : '',
      name: onBoardingDetails.name ? onBoardingDetails.name : '',
      role: roleObject && roleObject.roleName ? roleObject.roleName : '',
      roleId: roleObject && roleObject._id ? roleObject._id : '',
      password: onBoardingDetails.password ? onBoardingDetails.password : '',
      phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
      isUserApproved: false,
      status: true
    }
    console.log(userObject);
    await storeOnBoardingImagesInLocalStorage(onBoardingDetails.authenticationLetterForClientUrl, 'authenticationLetterForClient').then(async (authenticationLetterForClientUrl) => {
      await storeOnBoardingImagesInLocalStorage(onBoardingDetails.companyIdForClient, 'companyIdForClient').then(async (companyIdForClient) => {
        await User.create(userObject)
          .then(async (response) => {
            if (response) {
              let userId = response.id;
              await ClientRepresentatives.create({
                userId: userId,
                name: onBoardingDetails.name ? onBoardingDetails.name : '',
                email: onBoardingDetails.email ? onBoardingDetails.email : '',
                password: onBoardingDetails.password ? onBoardingDetails.password : '',
                phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : "",
                CompanyName: onBoardingDetails.companyName ? onBoardingDetails.companyName : "",
                authenticationLetterForClientUrl: authenticationLetterForClientUrl,
                companyIdForClient: companyIdForClient,
                status: true,
                createdBy: user
              });
              return res.status(200).json({ message: "New Client Representative onboarded successfully!", _id: response.id, name: response.name, email: response.email });
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
              console.log('error', err)
              next(err)
            }
          })
      }).catch((err) => {
        return res.status(500).json({ message: "Failed to store companyIdForClient" })
      });
    }).catch((err) => {
      return res.status(500).json({ message: "Failed to store authenticationLetterForClientUrl" })
    });
  } else if (onBoardingDetails.roleName == "Company Representative") {
    var roleObject = roleDetails.find((rec) => rec.roleName === 'Client Representative');
    userObject = {
      email: onBoardingDetails.email ? onBoardingDetails.email : '',
      name: onBoardingDetails.name ? onBoardingDetails.name : '',
      role: roleObject && roleObject.roleName ? roleObject.roleName : '',
      roleId: roleObject && roleObject._id ? roleObject._id : '',
      password: onBoardingDetails.password ? onBoardingDetails.password : '',
      phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : '',
      isUserApproved: false,
      status: true
    }
    console.log('test', onBoardingDetails.companiesList);
    var companiesList = onBoardingDetails.companiesList.map((rec) => { return rec.value });
    console.log('companiesList', companiesList);
    await storeOnBoardingImagesInLocalStorage(onBoardingDetails.authenticationLetterForCompanyUrl, 'authenticationLetterForCompany')
      .then(async (authenticationLetterForCompanyUrl) => {
        await storeOnBoardingImagesInLocalStorage(onBoardingDetails.companyIdForCompany, 'companyIdForCompany')
          .then(async (companyIdForCompany) => {
            await User.create(userObject)
              .then(async (response) => {
                if (response) {
                  let userId = response.id;
                  await CompanyRepresentatives.create({
                    userId: userId,
                    name: onBoardingDetails.name ? onBoardingDetails.name : '',
                    email: onBoardingDetails.email ? onBoardingDetails.email : '',
                    password: onBoardingDetails.password ? onBoardingDetails.password : '',
                    phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : "",
                    companiesList: companiesList ? companiesList : "",
                    authenticationLetterForCompanyUrl: authenticationLetterForCompanyUrl,
                    companyIdForCompany: companyIdForCompany,
                    status: true,
                    createdBy: user
                  });
                  return res.status(200).json({ message: "New Company Representative onboarded successfully!", _id: response.id, name: response.name, email: response.email });
                } else {
                  return res.status(500).json({ message: "Failed to onboard company representative" });
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
          })
          .catch((err) => {
            return res.status(500).json({ message: "Failed to store authenticationLetterForCompany" })
          });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Failed to store companyIdForCompany" })
      })
  } else if (onBoardingDetails.roleName == "Analyst") {
    //TODO
  } else if (onBoardingDetails.roleName == "QA") {
    //TODO
  } else {
    return res.status(500).json({ message: "Failed to onboard, invalid value for role or roleName" });
  }
}

async function storeOnBoardingImagesInLocalStorage(onboardingBase64Image, folderName) {
  console.log('in function storeOnBoardingImagesInLocalStorage')
  return new Promise(function (resolve, reject) {
    let base64Image = onboardingBase64Image.split(';base64,').pop();
    fileType.fromBuffer((Buffer.from(base64Image, 'base64'))).then(function (res) {
      let fileName = folderName + '_' + Date.now() + '.' + res.ext;
      console.log('__dirname', __dirname);
      var filePath = path.join(__dirname, '../../../uploads/') + folderName + '/' + fileName;
      console.log('filePath', filePath);
      fs.writeFile(filePath, base64Image, { encoding: 'base64' }, function (err) {
        if (err) {
          console.log('error while storing file', err);
          reject(err);
        } else {
          console.log('File created');
          resolve(fileName);
        }
      });
    }).catch(function (err) {
      console.log('err', err);
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
  console.log('assign', body)
  var roles = body.roleDetails.role.map((rec) => rec.value);
  var primaryRole = body.roleDetails.primaryRole.value;
  var roleDetails = {
    roles,
    primaryRole
  }
  console.log('roleDetails', roleDetails);
  User.updateOne({ _id: body.userDetails.value }, { $set: { roleDetails } }).then((updatedObject) => {
    console.log('updatedObject', updatedObject);
    if (updatedObject) {
      User.findById(body.userDetails.value).populate({
        path: 'roleDetails.roles'
      }).populate({
        path: 'roleDetails.primaryRole'
      }).then((userById) => {
        console.log('test', userById.roleDetails);
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
        return res.status(200).send(resObject);
      }).catch((err) => {
        next(err);
      })
    } else {
      return res.status(500).json({ message: "Failed to update Role details" });
    }
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


export const update = ({ bodymen: { body }, params, user }, res, next) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .populate('roleId')
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isAdmin = user.role === 'admin'
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate && !isAdmin) {
        res.status(401).json({
          valid: false,
          message: 'You can\'t change other user\'s data'
        })
        return null
      }
      return result
    })
    .then((user) => user ? Object.assign(user, body).save() : null)
    .then((user) => user ? user.view(true) : null)
    .then(success(res))
    .catch(next)

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

