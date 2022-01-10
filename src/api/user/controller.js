import XLSX from 'xlsx'
import _ from 'lodash'
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
import { OnboardingEmails } from '../onboarding-emails'
import { storeFileInS3, fetchFileFromS3 } from "../../services/utils/aws-s3"
import { sendEmail } from '../../services/utils/mailing'
import { Employee, CompanyRepresentative, ClientRepresentative, adminRoles, GroupRoles } from '../../constants/roles'
import { onboardingEmailContent, LINK_TO_ONBOARD_USER, FAILED_TO_ONBOARD, ACCESS_TO_LOGIN } from '../../constants/email-content';


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
  User.findById(params.id).populate('roleId').then(notFound(res)).then(async function (userDetails) {
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
      await Employees.findOne({ userId: userDetails._id }).then(async function (employee) {
        var pancardS3Url = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, employee.pancardUrl).catch((e) => {
          pancardS3Url = "No image";
        })
        var aadharcardS3Url = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, employee.aadhaarUrl).catch((e) => {
          aadharcardS3Url = "No image";
        })
        var cancelledChequeUrl = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, employee.cancelledChequeUrl).catch((e) => {
          cancelledChequeUrl = "No image";
        })
        var employeeDocuments = {
          pancardUrl: pancardS3Url, //employee && employee.pancardUrl ? employee.pancardUrl : '',
          aadhaarUrl: aadharcardS3Url, //employee && employee.aadhaarUrl ? employee.aadhaarUrl : '',
          cancelledChequeUrl: cancelledChequeUrl // employee && employee.cancelledChequeUrl ? employee.cancelledChequeUrl : ''
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
      await CompanyRepresentatives.findOne({ userId: userDetails._id }).populate('companiesList').then(async function (company) {
        var authenticationLetterForCompanyUrl = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, company.authenticationLetterForCompanyUrl).catch((e) => {
          authenticationLetterForCompanyUrl = "No image";
        })
        var companyIdForCompany = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, company.companyIdForCompany).catch((e) => {
          companyIdForCompany = "No image";
        })
        var companyDocuments = {
          authenticationLetterForCompanyUrl: authenticationLetterForCompanyUrl, //company && company.authenticationLetterForCompanyUrl ? company.authenticationLetterForCompanyUrl : '',
          companyIdForCompany: companyIdForCompany //company && company.companyIdForCompany ? company.companyIdForCompany : ''
        }
        userDetails.documents = companyDocuments;
        userDetails.companies = company.companiesList.map((rec) => {
          return { label: rec.companyName, value: rec.id }
        });
        return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
      }).catch(err => {
        return res.status(500).json({ message: "Failed to get user" })
      })
    } else if (userType === 'Client Representative') {
      await ClientRepresentatives.findOne({ userId: userDetails._id }).populate('companiesList').then(async function (client) {
        var authenticationLetterForClientUrl = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, client.authenticationLetterForClientUrl).catch((e) => {
          authenticationLetterForClientUrl = "No image";
        })
        var companyIdForClient = await fetchFileFromS3(process.env.USER_DOCUMENTS_BUCKET_NAME, client.companyIdForClient).catch((e) => {
          companyIdForClient = "No image";
        })
        var clientDocuments = {
          authenticationLetterForClientUrl: authenticationLetterForClientUrl,//client && client.authenticationLetterForClientUrl ? client.authenticationLetterForClientUrl : '',
          companyIdForClient: companyIdForClient //client && client.companyIdForClient ? client.companyIdForClient : '',
        }
        userDetails.documents = clientDocuments;
        // if(client.companiesList){
        //   userDetails.companyName = client.companiesList.length > 0 ? { label: client.companiesList[0].companyName, value: 'companyName' } : null;
        // }
        userDetails.companies = client.companiesList.map((rec) => {
          return { label: rec.companyName, value: rec.id }
        });
        return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
      }).catch(err => {
        return res.status(500).json({ message: err.message ? err.message : "Failed to get user" })
      })
    } else {
      return res.status(200).json({ status: 200, message: 'User fetched', user: userDetails })
    }
  }).catch(err => {
    return res.status(500).json({ message: err.message ? err.message : "Failed to get user" })
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
  try {
    const bodyData = Buffer.from(body.onBoardingDetails, 'base64');
    const onBoardingDetails = JSON.parse(bodyData);
    console.log(onBoardingDetails)
    let userObject, userUpdate;
    const [oboardingEmailDetails, roleDetails] = await Promise.all
      ([
        OnboardingEmails.findOne({ emailId: onBoardingDetails.email }),
        Role.find({ roleName: { $in: GroupRoles } })
      ])
    if (oboardingEmailDetails) {
      const userFound = await User.findOne({ email: oboardingEmailDetails.emailId });
      const roleObject = roleDetails.find((rec) => rec.roleName === onBoardingDetails.roleName)
      if (userFound) {
        if (!userFound.isUserApproved) {
          switch (roleObject.roleName) {
            case Employee:
              userObject = getUserDetail(oboardingEmailDetails, roleObject);
              userUpdate = await User.updateOne({ _id: userFound.id }, { $set: userObject });
              if (userUpdate) {
                const empDetails = await getEmployee(onBoardingDetails, userFound?.id);
                const empUpdate = await Employees.updateOne({ userId: userFound.id }, {
                  $set: {
                    userId: userFound.id,
                    ...empDetails
                  }
                }, {
                  upsert: true
                });
                if (empUpdate) {
                  const [userDetails,] = await Promise.all([
                    Employees.findOne({ userId: userFound.id }).populate('userId'),
                    OnboardingEmails.findOne({ emailId: onBoardingDetails.email }, { isOnboarded: true })
                  ]);

                  return res.status(200).json({
                    status: '200',
                    message: "Your details has been updated successfully", data: userDetails ? userDetails : {}
                  });
                } else {
                  return res.status(409).json({
                    status: 409,
                    message: 'Failed Employee Update'
                  });
                }
              } else {
                return res.status(409).json({
                  status: 409,
                  message: 'Failed User Update'
                });
              }
            case ClientRepresentative:
            case CompanyRepresentative:
              userObject = getUserDetail(oboardingEmailDetails, roleObject);
              userUpdate = await User.updateOne({ _id: userFound.id }, { $set: userObject });
              if (userUpdate) {
                const repDetails = await getRepDetails(onBoardingDetails.roleName, onBoardingDetails, userFound);
                const updateRep = onBoardingDetails.roleName == ClientRepresentative ?
                  await ClientRepresentatives.updateOne({ userId: userFound.id }, {
                    $set: {
                      userId: userFound.id,
                      ...repDetails
                    }
                  }, {
                    upsert: true
                  }) : await CompanyRepresentatives.updateOne({ userId: userFound.id }, {
                    $set: {
                      userId: userFound.id,
                      ...repDetails
                    }
                  }, {
                    upsert: true
                  });
                if (updateRep) {
                  const repDetailData = onBoardingDetails.roleName == ClientRepresentative ?
                    await Promise.all([ClientRepresentatives.findOne({ userId: userFound.id }).populate('userId'),
                    OnboardingEmails.findOne({ emailId: onBoardingDetails.email }, { isOnboarded: true })])
                    : await Promise.all([CompanyRepresentatives.findOne({ userId: userFound.id }).populate('userId'),
                    OnboardingEmails.findOne({ emailId: onBoardingDetails.email }, { isOnboarded: true })]);


                  return res.status(200).json({
                    status: '200',
                    message: "Your details has been updated successfully",
                    data: repDetailData ? repDetailData : {}
                  });
                }
              } else {
                return res.status(409).json({
                  status: 409,
                  message: 'Failed User Update'
                });
              }
            default:
              return res.status(400).json({
                status: "400",
                message: 'Bad Input for role'
              });
          }
        } else {
          return res.status(409).json({
            valid: false,
            param: 'email',
            message: 'email already registered'
          });
        }
      } else {
        switch (roleObject.roleName) {
          case Employee:
            userObject = getUserDetail(onBoardingDetails, roleObject);
            const userCreate = await User.create({
              email: onBoardingDetails.email ? onBoardingDetails.email : '',
              password: onBoardingDetails.password ? onBoardingDetails.password : '',
              ...userObject
            });
            if (userCreate) {
              const empDetails = await getEmployee(onBoardingDetails, userCreate.id);
              const empCreate = await Employees.create({
                userId: userCreate.id,
                ...empDetails
              });
              if (empCreate) {
                const userDetails = await Employees.findOne({ userId: userCreate.id }).populate('userId');
                if (userDetails) {
                  await OnboardingEmails.findOne({ emailId: onBoardingDetails.email }, { isOnboarded: true });
                  return res.status(200).json({
                    status: '200',
                    message: 'Your details has been updated successfully', data: userDetails ? userDetails : {}
                  });
                } else {
                  return res.status(409).json({
                    status: '409',
                    message: 'User does not exists'
                  });
                }

              } else {
                return res.status(409).json({
                  status: 409,
                  message: ' Employee Failed To Create'
                });
              }
            } else {
              return res.status(409).json({
                status: 409,
                message: 'User Failed To Create'
              });
            }
          case ClientRepresentative:
          case CompanyRepresentative:
            userObject = getUserDetail(onBoardingDetails, roleObject);
            const createUser = await User.create({
              email: onBoardingDetails.email ? onBoardingDetails.email : '',
              password: onBoardingDetails.password ? onBoardingDetails.password : '',
              roleDetails: { primaryRole: roleObject.id, roles: [] },
              ...userObject
            });

            if (createUser) {
              const repDetails = await getRepDetails(roleObject.roleName, onBoardingDetails, createUser);
              const query = {
                userId: createUser.id,
                name: onBoardingDetails.firstName ?
                  `${onBoardingDetails?.firstName} ${onBoardingDetails?.middleName} ${onBoardingDetails?.lastName}` : '',
                companiesList: [],
                ...repDetails
              }

              const createRep = roleObject.roleName === ClientRepresentative
                ? await ClientRepresentatives.create(query)
                : await CompanyRepresentatives.create(query);

              if (createRep) {
                await OnboardingEmails.findOne({ emailId: onBoardingDetails.email }, { isOnboarded: true });
                return res.status(200).json({
                  message: "Your details have been saved successfully. You will receive an email from us shortly.",
                  _id: createRep.id,
                  name: createRep.name,
                  email: onBoardingDetails.email
                });

              } else {
               return  res.status(400).json({
                  status: "400",
                  message: `${roleObject.roleName} failed to create`
                })
              }

            } else {
              return res.status(400).json({
                status: "400",
                message: 'User failed to create'
              })
            }

            break;
          default:
            return res.status(400).json({
              status: "400",
              message: 'Bad Input for role'
            });
        }
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: `Invalid email for onboarding, emailId:${onBoardingDetails.email} please check!`
      })

    }
  } catch (error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      if (error.keyPattern.phoneNumber) {
        return res.status(409).json({
          valid: false,
          param: 'phoneNumber',
          message: 'phoneNumber already registered'
        })
      } else {
        return res.status(409).json({
          valid: false,
          param: 'email',
          message: 'email already registered'
        })
      }
    }
    return res.status(409).json({
      status: 409,
      message: error.message ? error.message : 'email already registered'
    })
  }

  function getUserDetail(onBoardingDetails, roleObject) {
    return {
      name: onBoardingDetails.name ? onBoardingDetails.name : '',
      userType: roleObject && roleObject.roleName ? roleObject.roleName : '',
      phoneNumber: onBoardingDetails.phoneNumber ? onBoardingDetails.phoneNumber : ''
    }
  }

  async function getEmployee(onBoardingDetails, id) {

    const pancardUrlFileType = onBoardingDetails.pancardUrl.split(';')[0].split('/')[1];
    const pancardUrl = id + '_' + Date.now() + '.' + pancardUrlFileType;

    const aadhaarUrlFileType = onBoardingDetails.aadhaarUrl.split(';')[0].split('/')[1];
    const aadhaarUrl = id + '_' + Date.now() + '.' + aadhaarUrlFileType;

    const cancelledChequeUrllFileType = onBoardingDetails.cancelledChequeUrl.split(';')[0].split('/')[1];
    const cancelledChequeUrl = id + '_' + Date.now() + '.' + cancelledChequeUrllFileType;

    // Storing images in S3 bucket.
    await Promise.all([
      storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, pancardUrl, onBoardingDetails.pancardUrl),
      storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, aadhaarUrl, onBoardingDetails.aadhaarUrl),
      storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, cancelledChequeUrl, onBoardingDetails.cancelledChequeUrl)
    ]);

    return {
      firstName: onBoardingDetails.firstName ? onBoardingDetails.firstName : '',
      middleName: onBoardingDetails.middleName ? onBoardingDetails.middleName : '',
      lastName: onBoardingDetails.lastName ? onBoardingDetails.lastName : '',
      panNumber: onBoardingDetails.panNumber ? onBoardingDetails.panNumber : '',
      aadhaarNumber: onBoardingDetails.aadhaarNumber ? onBoardingDetails.aadhaarNumber : '',
      bankAccountNumber: onBoardingDetails.bankAccountNumber ? onBoardingDetails.bankAccountNumber : '',
      bankIFSCCode: onBoardingDetails.bankIFSCCode ? onBoardingDetails.bankIFSCCode : '',
      accountHolderName: onBoardingDetails.accountHolderName ? onBoardingDetails.accountHolderName : '',
      pancardUrl: pancardUrl, //onBoardingDetails.pancardUrl, //pancards3Insert
      aadhaarUrl: aadhaarUrl, //onBoardingDetails.aadhaarUrl,//aadhars3Insert
      cancelledChequeUrl: cancelledChequeUrl, //onBoardingDetails.cancelledChequeUrl,//cancelledChequeUrls3Insert
    }
  }

  async function getRepDetails(role, onBoardingDetails, userDetails) {
    console.log(onBoardingDetails)
    const authenticationLetter = role === ClientRepresentative ?
      onBoardingDetails.authenticationLetterForClientUrl.split(';')[0].split('/')[1]
      : onBoardingDetails.authenticationLetterForCompanyUrl.split(';')[0].split('/')[1];

    const authenticationLetterUrl = role === ClientRepresentative ?
      userDetails?.id + '_' + Date.now() + '.' + authenticationLetter
      : userDetails?.id + '_' + Date.now() + '.' + authenticationLetter;

    role === ClientRepresentative ?
      await storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, authenticationLetterUrl, onBoardingDetails.authenticationLetterForClientUrl)
      : await storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, authenticationLetterUrl, onBoardingDetails.authenticationLetterForCompanyUrl);

    const companyIdForFiletype = role === ClientRepresentative ?
      onBoardingDetails.companyIdForClient.split(';')[0].split('/')[1]
      : onBoardingDetails.companyIdForCompany.split(';')[0].split('/')[1];

    const companyId = role === ClientRepresentative ?
      userDetails?.id + '_' + Date.now() + '.' + companyIdForFiletype
      : userDetails?.id + '_' + Date.now() + '.' + companyIdForFiletype;

    role === ClientRepresentative ?
      await storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, companyId, onBoardingDetails.companyIdForClient)
      : await storeFileInS3(process.env.USER_DOCUMENTS_BUCKET_NAME, companyId, onBoardingDetails.companyIdForClient);

    return role === ClientRepresentative ? {
      authenticationLetterForClientUrl: authenticationLetterUrl,
      companyIdForClient: companyId, //onBoardingDetails.companyIdForClient,
    } : {
      authenticationLetterForCompanyUrl: authenticationLetterUrl,
      companyIdForCompany: companyId, //onBoardingDetails.companyIdForCompany,
    }
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

export const assignCompanies = async ({ bodymen: { body }, user }, res, next) => {
  console.log('assignCompanies function called!');
  if (body.type == "client") {
    await ClientRepresentatives.findOne({ userId: body.userId })
      .then(async (repDetail) => {
        let companiesList = [];
        for (let cmpIndex = 0; cmpIndex < body.companies.length; cmpIndex++) {
          companiesList.push(body.companies[cmpIndex].value);
        }
        await ClientRepresentatives.updateOne({ _id: repDetail.id }, { $set: { companiesList: companiesList } })
          .then((updateObj) => {
            return res.status(200).json({ status: "200", message: "Companies assigned to the Client-Rep successfully!" });
          })
          .catch((error) => {
            return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to update!" })
          })
      })
      .catch((error) => {
        return res.status(400).json({ status: "400", message: "User not found!" })
      });
  } else if (body.type == "company") {
    await CompanyRepresentatives.findOne({ userId: body.userId })
      .then(async (repDetail) => {
        let companiesList = [];
        for (let cmpIndex = 0; cmpIndex < body.companies.length; cmpIndex++) {
          companiesList.push(body.companies[cmpIndex].value);
        }
        await CompanyRepresentatives.updateOne({ _id: repDetail.id }, { $set: { companiesList: companiesList } })
          .then((updateObj) => {
            return res.status(200).json({ status: "200", message: "Companies assigned to the Company-Rep successfully!" });
          })
          .catch((error) => {
            return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to update!" })
          })
      })
      .catch((error) => {
        return res.status(400).json({ status: "400", message: "User not found!" })
      });
  }
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
        "label": `${rec.name}-${rec.email}`,
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

export const update = ({ bodymen: { body }, params, user }, res, next) => {
  if (body.userDetails && body.userDetails.hasOwnProperty('isUserApproved') && !body.userDetails.isUserApproved) {
    body.userDetails.isUserRejected = true;
  }
  User.findById({ _id: body.userId }).then(async function (userDetail) {
    if (userDetail && userDetail.isUserApproved == false) {
      User.updateOne({ _id: body.userId }, { $set: body.userDetails }).then(function (userUpdates) {
        if (body.userDetails && body.userDetails.hasOwnProperty('isUserApproved') && !body.userDetails.isUserApproved) {
          User.findById(body.userId).then(async function (userDetails) {
            var link = `${process.env.FRONTEND_URL}/onboard/new-user?`;
            if (userDetails && userDetails.userType) {
              userDetails.userType = userDetails.userType.split(" ").join("");
            }
            link = link + `role=${userDetails.userType}&email=${userDetails.email}&id=${userDetails.id}`;
            userDetails = userDetails.toObject();
            const emailDetails = onboardingEmailContent(body.userDetails.comments, FAILED_TO_ONBOARD);
            await sendEmail(userDetails['email'], emailDetails?.subject, emailDetails?.message)
              .then((resp) => { console.log('Mail sent!'); });
          })
          // await OnboardingEmails.updateOne({ emailId: userDetails.email }, { $set: { emailId: userDetails.email, isOnboarded: false } }, { upsert: true } )
          return res.status(200).json({
            message: 'User details updated successfully',
          });
        } else {
          User.findById(body.userId).then(async function (userDetails) {
            userDetails = userDetails.toObject();
            const emailDetails = onboardingEmailContent(process.env.FRONTEND_URL, ACCESS_TO_LOGIN); // get content from email-content-file


            await sendEmail(userDetails['email'], emailDetails?.subject, emailDetails?.message)
              .then((response) => { console.log('Mail sent!'); });
          })
        }
        return res.status(200).json({
          message: 'User details updated successfully',
        });
      }).catch(err => {
        return res.status(500).json({
          message: err.message ? err.message : 'Failed to update userDetails',
        });
      })
    } else {
      return res.status(200).json({
        message: 'User details updated successfully',
      });
    }
  })
}

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


export const onBoardingEmpolyee = async ({ bodymen: { body }, params, user }, res, next) => {


  var details = Buffer.from(body.onboardingdetails, 'base64');

  let onboardDetails = details.toString('ascii');

  let parse = JSON.parse(onboardDetails);

  let emailDetails = await OnboardingEmails.find({ emailId: parse.email })
  if (emailDetails && emailDetails.length > 0) {
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
  } else {
    return res.status(400).json({ status: '400', message: `Invalid email for the onboarding, emailId: ${parse.email}` })
  }
}

export const onBoardingClientRep = async ({ bodymen: { body }, params, user }, res, next) => {
  var details = Buffer.from(body.onboardingdetails, 'base64');

  let onboardDetails = details.toString('ascii');

  let parse = JSON.parse(onboardDetails);

  let emailDetails = await OnboardingEmails.find({ emailId: parse.email })
  if (emailDetails && emailDetails.length > 0) {
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
  } else {
    return res.status(400).json({ status: '400', message: `Invalid email for the onboarding, emailId: ${parse.email}` })
  }
}


export const onBoardingCompanyRep = async ({ bodymen: { body }, params, user }, res, next) => {
  var details = Buffer.from(body.onboardingdetails, 'base64');

  let onboardDetails = details.toString('ascii');

  let parse = JSON.parse(onboardDetails);

  let emailDetails = await OnboardingEmails.find({ emailId: parse.email })
  if (emailDetails && emailDetails.length > 0) {
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
  } else {
    return res.status(400).json({ status: '400', message: `Invalid email for the onboarding, emailId: ${parse.email}` })
  }
}

// Upload Email 
export const uploadEmailsFile = async ({ body, user }, res, next) => {
  try {
    let convertedWorkbook;
    convertedWorkbook = XLSX.read(body.emailFile.replace(/^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/, ""));
    if (convertedWorkbook.SheetNames.length > 0) {
      const worksheet = convertedWorkbook.Sheets[convertedWorkbook.SheetNames[0]];
      try {
        const sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: " " });
        //code for sending onboarding links to emails
        const [existingUserEmailsList, rolesList] = await Promise.all([
          User.find({ "status": true }),
          Role.find({ "status": true })
        ]);
        if (sheetAsJson.length > 0) {
          let existingEmails = [], hasInvalidData = false;
          for (let index1 = 0; index1 < sheetAsJson.length; index1++) {
            const rowObject = sheetAsJson[index1];
            let checkEmail = existingUserEmailsList.find(object => rowObject['email'] == object.email && object.isUserApproved == true);
            if (checkEmail) {
              existingEmails.push(rowObject['email']);
            }
            if (rowObject['email'] == ' ' || !rowObject['email']) {
              hasInvalidData = true;
              return res.status(400).json({ status: "400", message: "Email Id is not Present in the Column Please check input file" });
            } else if (rowObject['onboardingtype'] != Employee
              && rowObject['onboardingtype'] != CompanyRepresentative
              && rowObject['onboardingtype'] != ClientRepresentative) {
              hasInvalidData = true;
              return res.status(400).json({ status: "400", message: "Invalid input for onboardingtype, Please check!" });
            }
          }
          if (!hasInvalidData) {
            for (let index = 0; index < sheetAsJson.length; index++) {
              const rowObject = sheetAsJson[index];
              const [emailAlreadyExists, rolesDetails] = [
                existingUserEmailsList.find(object => rowObject['email'] == object.email
                  && object.isUserApproved == true),
                rolesList.find(object => (object.roleName == rowObject['onboardingtype']))
              ]

              let link;
              if (rolesDetails) {
                if (rolesDetails.roleName == Employee) {
                  link = `/onboard/new-user?role=Employee&email=${rowObject['email']}`
                } else if ((rolesDetails.roleName == CompanyRepresentative) || (rolesDetails.roleName == "CompanyRepresentative")) {
                  link = `/onboard/new-user?role=CompanyRepresentative&email=${rowObject['email']}`
                } else {
                  link = `/onboard/new-user?role=ClientRepresentative&email=${rowObject['email']}`
                }

                if (!emailAlreadyExists) {
                  if (rolesDetails && rolesDetails.roleName == Employee) {
                    let url = `${process.env.FRONTEND_URL}${link}&email=${rowObject['email']}`
                    //nodemail code will come here to send OTP

                    const emailDetails = onboardingEmailContent(url, LINK_TO_ONBOARD_USER); // getting email from email-content(constant file)

                    await sendEmail(rowObject['email'], emailDetails?.subject, emailDetails?.message)
                      .then((resp) => { console.log('Mail sent!'); });
                    let email = `${rowObject['email']}`;
                    await OnboardingEmails.updateOne({
                      emailId: email
                    }, {
                      $set: {
                        emailId: email, isOnboarded: false, createdBy: user.id
                      }
                    }, { upsert: true })

                  } else if (rolesDetails && (rolesDetails.roleName == ClientRepresentative
                    || rolesDetails.roleName == "ClientRepresentative"
                    || rolesDetails.roleName == CompanyRepresentative
                    || rolesDetails.roleName == "CompanyRepresentative")) {
                    const adminRoleIds = await Role.find({ roleName: { $in: adminRoles }, status: true }).distinct('_id');
                    const allAdminUserEmailIds = await User.find({
                      $or: [{
                        "roleDetails.roles": {
                          $in: adminRoleIds
                        }
                      }, {
                        "roleDetails.primaryRole": { $in: adminRoleIds }
                      }], status: true
                    }).distinct('email');
                    for (let index = 0; index < allAdminUserEmailIds.length; index++) {
                      console.log("allAdminUserEmail", allAdminUserEmailIds[index]);
                      let url = `${process.env.FRONTEND_URL}${link}&email=${rowObject['email']}`;
                      console.log("");
                      //nodemail code will come here to send OTP
                      const content = `
                        Email: ${rowObject['email']}<br/><br/>
                        Link: ${url}<br/><br/>`;

                      await sendEmail(allAdminUserEmailIds[index], 'ESG - Onboarding', content)
                        .then((resp) => { console.log('Mail sent!'); });
                      let email = `${rowObject['email']}`;

                      await OnboardingEmails.updateOne({
                        emailId: email
                      }, {
                        $set: {
                          emailId: email, isOnboarded: false, createdBy: user.id
                        }
                      }, { upsert: true })
                    }
                  }
                } else {
                  return res.status(409).json({ status: "409", message: `User with same email id: ${existingEmails}, already exits` })
                }
              } else {
                return res.status(400).json({ status: "400", message: "File has some invalid onboarding type, please check!" });
              }
            }
            return res.status(200).json({ status: "200", message: "List uploaded and emails sent successfully", UsersAlreadyOnboarded: existingEmails.length > 0 ? existingEmails : "Nil" });
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

export const sendMultipleOnBoardingLinks = async ({ bodymen: { body }, user }, res, next) => {
  const emailList = body.emailList;
  let [activeUsers, rolesList] = await Promise.all([
    User.find({ "status": true }),
    Role.find({ "status": true })
  ]);
  if (emailList.length > 0) {
    let existingEmails = [];
    for (let index = 0; index < emailList.length; index++) {
      const rowObject = emailList[index];
      const emailAlreadyExists = activeUsers.find(object => rowObject['email'] == object.email && object.isUserApproved == true);
      if (emailAlreadyExists) {
        existingEmails.push(emailAlreadyExists.email);
      }
    }

    for (let index = 0; index < emailList.length; index++) {
      const rowObject = emailList[index];
      let emailAlreadyExists = activeUsers.find(object => rowObject['email'] == object.email && object.isUserApproved == true);
      let rolesDetails = rolesList.find(object => object._id == rowObject['onboardingtype']);
      let link;
      if (rolesDetails && rolesDetails.roleName == Employee) {
        link = `/onboard/new-user?role=Employee`
      } else if (rolesDetails && ((rolesDetails.roleName == CompanyRepresentative) || (rolesDetails.roleName == "CompanyRepresentative"))) {
        link = `/onboard/new-user?role=CompanyRepresentative`
      } else {
        link = `/onboard/new-user?role=ClientRepresentative`
      }
      if (!emailAlreadyExists) {
        if (rolesDetails && rolesDetails.roleName == Employee) {
          let url = `${process.env.FRONTEND_URL}${link}&email=${rowObject['email']}`
          //nodemail code will come here to send OTP
          const emailDetails = onboardingEmailContent(url, LINK_TO_ONBOARD_USER);
          await sendEmail(rowObject['email'], emailDetails.subject, emailDetails?.message)
            .then((resp) => { console.log('Mail sent!'); });
          let email = `${rowObject['email']}`;
          await OnboardingEmails.updateOne({
            emailId: email
          }, {
            $set: {
              emailId: email, isOnboarded: false, createdBy: user.id
            }
          }, { upsert: true })

        } else if (rolesDetails && (rolesDetails.roleName == ClientRepresentative
          || rolesDetails.roleName == "ClientRepresentative"
          || rolesDetails.roleName == CompanyRepresentative
          || rolesDetails.roleName == "CompanyRepresentative")) {
          const adminRoleIds = await Role.find({ roleName: { $in: adminRoles }, status: true }).distinct('_id');
          const allAdminUserEmailIds = await User.find({
            $or: [{
              "roleDetails.roles": { $in: adminRoleIds }
            }, {
              "roleDetails.primaryRole":
                { $in: adminRoleIds }
            }], status: true
          }).distinct('email');

          for (let index = 0; index < allAdminUserEmailIds.length; index++) {
            console.log("allAdminUserEmail", allAdminUserEmailIds[index]);
            let url = `${process.env.FRONTEND_URL}${link}&email=${rowObject['email']}`;

            const content = `
              Email: ${rowObject['email']}<br/><br/>
              Link: ${url}<br/><br/>`;

            await sendEmail(allAdminUserEmailIds[index], 'ESG - Onboarding', content)
              .then((resp) => { console.log('Mail sent!'); });
            let email = `${rowObject['email']}`;
            await OnboardingEmails.updateOne({
              emailId: email
            }, {
              $set: {
                emailId: email, isOnboarded: false, createdBy: user.id
              }
            }, { upsert: true })
          }
        } else {
          return res.status(400).json({ status: "400", message: "Invalid Role" })
        }
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



export const updateUserName = async (req, res, next) => {
  let allEmployees = await Employees.find({ status: true });
  for (let eIndex = 0; eIndex < allEmployees.length; eIndex++) {
    await User.updateOne({ _id: allEmployees[eIndex].userId }, {
      $set: {
        name: allEmployees[eIndex].firstName + " " + allEmployees[eIndex].middleName + " " + allEmployees[eIndex].lastName
      }
    })
  }
}


// export const getApprovedAndAssignedRoleUser = (req, res, next => {

//   User.find({ isUserApproved: true, isRoleAssigned: true }).then((approvedUsers) => {
//     res.send(approvedUsers);
//   })
// })
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


                    // var transporter = nodemailer.createTransport({
                    //   service: 'Gmail',
                    //   auth: {
                    //     user: 'testmailer09876@gmail.com',
                    //     pass: 'ijsfupqcuttlpcez'
                    //   }
                    // });

                    // transporter.sendMail({
                    //   from: 'testmailer09876@gmail.com',
                    //   to: rowObject['email'],
                    //   subject: 'ESG - Onboarding',
                    //   html: content
                    // });

     // var transporter = nodemailer.createTransport({
            //   service: 'Gmail',
            //   auth: {
            //     user: 'testmailer09876@gmail.com',
            //     pass: 'ijsfupqcuttlpcez'
            //   }
            // });
            // transporter.sendMail({
            //   from: 'testmailer09876@gmail.com',
            //   to: userDetails['email'],
            //   subject: 'ESG - Onboarding',
            //   html: content
            // });

// var transporter = nodemailer.createTransport({
                      //   service: 'Gmail',
                      //   auth: {
                      //     user: 'testmailer09876@gmail.com',
                      //     pass: 'ijsfupqcuttlpcez'
                      //   }
                      // });

                      // transporter.sendMail({
                      //   from: 'testmailer09876@gmail.com',
                      //   to: allAdminUserEmailIds[index],
                      //   subject: 'ESG - Onboarding',
                      //   html: content
                      // });


          // var transporter = nodemailer.createTransport({
          //   service: 'Gmail',
          //   auth: {
          //     user: 'testmailer09876@gmail.com',
          //     pass: 'ijsfupqcuttlpcez'
          //   }
          // });

          // transporter.sendMail({
          //   from: 'testmailer09876@gmail.com',
          //   to: rowObject['email'],
          //   subject: 'ESG - Onboarding',
          //   html: content
          // });


            // var transporter = nodemailer.createTransport({
            //   service: 'Gmail',
            //   auth: {
            //     user: 'testmailer09876@gmail.com',
            //     pass: 'ijsfupqcuttlpcez'
            //   }
            // });

            // transporter.sendMail({
            //   from: 'testmailer09876@gmail.com',
            //   to: allAdminUserEmailIds[index],
            //   subject: 'ESG - Onboarding',
            //   html: content
            // });