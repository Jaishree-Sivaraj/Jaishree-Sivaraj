import _ from 'lodash';
import { success, notFound, authorOrAdmin } from "../../services/response/";
import { TaskAssignment } from ".";
import { User } from "../user";
import { Role } from "../role";
import { Group } from "../group";
import { Categories } from "../categories";
import { Batches } from "../batches";
import { CompaniesTasks } from "../companies_tasks";
import { UserPillarAssignments } from "../user_pillar_assignments";
import { ControversyTasks } from "../controversy_tasks";
import { TaskSlaLog } from "../taskSlaLog"
import { Companies } from "../companies"
import { Controversy } from "../controversy";
import { Datapoints } from "../datapoints";
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { Notifications } from '../notifications'
import { TaskHistories } from '../task_histories'
import { Validations } from '../validations'
import { ValidationResults } from '../validation_results'
import { Functions } from '../functions'
import { QA, Analyst, adminRoles } from '../../constants/roles';
import { ClientRepresentative, CompanyRepresentative } from "../../constants/roles";
import { CompanyRepresentatives } from '../company-representatives';
import { ClientRepresentatives } from '../client-representatives';
import { checkIfAllDpCodeAreFilled, getCompanyDetails, getTotalMultipliedValues, conditionalResult } from './helper-function-update-company-status';
import {
  VerificationCompleted,
  ReassignmentPending,
  Completed,
  Incomplete
} from '../../constants/task-status';
import { RepEmail, getEmailForJsonGeneration } from '../../constants/email-content';
import { sendEmail } from '../../services/utils/mailing';
import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from "../../constants/dp-type";

export const create = async ({ user, bodymen: { body } }, res, next) => {
  await TaskAssignment.findOne({ status: true })
    .sort({ createdAt: -1 })
    .limit(1)
    .then(async (taskObject) => {
      let newTaskNumber = "";
      if (taskObject) {
        if (taskObject.taskNumber) {
          let lastTaskNumber = taskObject.taskNumber.split("DT")[1];
          newTaskNumber = Number(lastTaskNumber) + 1;
        } else {
          newTaskNumber = "1";
        }
        body.taskNumber = "DT" + newTaskNumber;
        await TaskAssignment.create({
          ...body,
          createdBy: user,
        }).then(async (taskAssignment) => {
          await CompaniesTasks.create({
            companyId: body.companyId,
            year: body.year,
            categoryId: body.categoryId,
            status: true,
            taskId: taskAssignment.id,
          }).then(async () => {
            return res.status(200).json({
              status: "200",
              message: "Task created successfully!",
              data: taskAssignment.view(true),
            });
          }).catch((error) => {
            return res.status(400).json({
              status: "400",
              message: error.message
                ? error.message
                : "Failed to create companies task!",
            });
          });
        }).catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message ? error.message : "Failed to create task!",
          });
        });
      } else {
        body.taskNumber = "DT1";
        await TaskAssignment.create({
          ...body,
          createdBy: user,
        }).then(async (taskAssignment) => {
          await CompaniesTasks.create({
            companyId: body.companyId,
            year: body.year,
            categoryId: body.categoryId,
            status: true,
            taskId: taskAssignment.id,
          }).then(async () => {
            return res.status(200).json({
              status: "200",
              message: "Task created successfully!",
              data: taskAssignment.view(true),
            });
          }).catch((error) => {
            return res.status(400).json({
              status: "400",
              message: error.message
                ? error.message
                : "Failed to create companies task!",
            });
          });
        }).catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message ? error.message : "Failed to create task!",
          });
        });
      }
    }).catch((error) => {
      return res.status(400).json({
        status: "400",
        message: error.message ? error.message : "Failed to create task!",
      });
    });
};

export const createTask = async ({ user, bodymen: { body } }, res, next) => {
  var years = "";
  body.year.forEach((rec, forIndex) => {
    if (forIndex == body.year.length - 1) {
      years = years + rec.value;
    } else {
      years = years + rec.value + ", ";
    }
  });
  var taskObject = {
    categoryId: body.pillar.value,
    groupId: body.groupId,
    batchId: body.batchId,
    year: years,
    analystSLADate: body.analystSla,
    qaSLADate: body.qaSla,
    analystId: body.analyst.value,
    qaId: body.qa.value,
    createdBy: user,
  };
  // var taskArray = [];
  let taskAssign = [];
  let companyIds = []
  body.company.map((company) => {
    companyIds.push(company.id)
  });
  let clientTaxDtl = await Companies.findOne({ _id: { $in: companyIds } }).populate('clientTaxonomyId');
  for (let index = 0; index < body.company.length; index++) {
    taskObject.companyId = body.company[index].id;
    taskObject.taskNumber = 'DT1';
    if (clientTaxDtl.clientTaxonomyId && clientTaxDtl.clientTaxonomyId.isDerivedCalculationRequired == false) {
      taskObject.isDerviedCalculationCompleted = true;
    }
    await TaskAssignment.findOne({ status: true })
      .sort({ createdAt: -1 })
      .limit(1)
      .then(async (taskObjectCreated) => {
        let newTaskNumber = "";
        if (taskObjectCreated && taskObjectCreated.taskNumber) {
          let lastTaskNumber = taskObjectCreated.taskNumber.split("DT")[1];
          newTaskNumber = Number(lastTaskNumber) + 1;
          taskObject.taskNumber = "DT" + newTaskNumber;
        }
        await TaskAssignment.create(taskObject)
          .then(async (taskAssignment) => {
            taskAssign.push(taskAssignment.view(true));
            if (taskAssignment.year) {
              let years = taskAssignment.year.split(', ');
              if (years.length > 1) {
                for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
                  await CompaniesTasks.create({
                    companyId: taskObject.companyId,
                    year: years[yearIndex],
                    categoryId: taskObject.categoryId,
                    status: true,
                    taskId: taskAssignment.id,
                    createdBy: taskObject.createdBy,
                  }).then(async () => {
                    // console.log(taskAssignment.view(true))
                    // taskArray.push(taskAssignment.view(true));
                  }).catch((error) => {
                    return res.status(400).json({
                      status: "400",
                      message: error.message ? error.message : "Failed to create companies task!",
                    });
                  });
                }
              } else {
                await CompaniesTasks.create({
                  companyId: taskObject.companyId,
                  year: years[0],
                  categoryId: taskObject.categoryId,
                  status: true,
                  taskId: taskAssignment.id,
                  createdBy: taskObject.createdBy,
                }).then(async () => {
                  // taskArray.push(taskAssignment.view(true));
                }).catch((error) => {
                  return res.status(400).json({
                    status: "400",
                    message: error.message ? error.message : "Failed to create companies task!",
                  });
                });
              }
            }
          }).catch((error) => {
            return res.status(400).json({
              status: "400",
              message: error.message ? error.message : "Failed to create task!",
            });
          });
      }).catch((error) => {
        return res.status(400).json({
          status: "400",
          message: error.message ? error.message : "Failed to create task!",
        });
      });
  }
  res.status(200).json({
    status: "200",
    message: "Task created successfully!",
    data: taskAssign,
  });
};

export const getQaAndAnalystFromGrp = async ({ user, bodymen: { body } }, res, next) => {
  var { batchId, groupId } = body;
  var qaRoleDetails = await Role.findOne({ roleName: "QA" }).catch((error) => {
    return res.status(500).json({ status: "500", message: error.message });
  });
  var analystRoleDetails = await Role.findOne({ roleName: "Analyst" }).catch(
    (error) => {
      return res.status(500).json({ status: "500", message: error.message });
    }
  );
  var allGrpsWithAssignedQAMembers = await Group.findOne({
    _id: groupId,
    batchList: { $in: [batchId] },
  })
    .populate("assignedMembers")
    .populate("assignedMembers.roleDetails")
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message });
    });
  var qa = [], analyst = [];
  for (let index = 0; index < allGrpsWithAssignedQAMembers.assignedMembers.length; index++) {
    if ((allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.hasOwnProperty("primaryRole") &&
      allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.primaryRole === qaRoleDetails._id) ||
      (allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.hasOwnProperty("roles") &&
        allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.roles.indexOf(qaRoleDetails._id) > -1)) {
      qa.push({
        value: allGrpsWithAssignedQAMembers.assignedMembers[index].id,
        label: allGrpsWithAssignedQAMembers.assignedMembers[index].name
      });
    }
    if ((allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.primaryRole &&
      allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.primaryRole === analystRoleDetails._id) ||
      (allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.roles &&
        allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.roles.indexOf(analystRoleDetails._id) > -1)
    ) {
      analyst.push({
        value: allGrpsWithAssignedQAMembers.assignedMembers[index].id,
        label: allGrpsWithAssignedQAMembers.assignedMembers[index].name,
      });
    }
  }
  res.status(200).json({
    message: "Fetched qa and analyst successfully",
    status: "200",
    data: { qa, analyst },
  });
};

export const index = async ({ user, querymen: { query, select, cursor } }, res, next) => {
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isUserActive: true
  }).populate({ path: "roleDetails.roles" }).populate({ path: "roleDetails.primaryRole" })
    .catch((error) => {
      return res.status(500).json({
        status: "500",
        message: error.message,
      });
    });
  let userRoles = [];
  if (completeUserDetail && completeUserDetail.roleDetails) {
    if (completeUserDetail.roleDetails.primaryRole) {
      userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
      if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
        for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
          if (completeUserDetail.roleDetails.roles[index]) {
            userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
          }
        }
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "User role not found!",
    });
  }
  let finalResponseObject = {
    groupAdminTaskList: {
      pendingList: [],
      completedList: [],
      controversyList: []
    },
    adminTaskList: {
      pendingList: [],
      completedList: [],
      controversyList: []
    }
  };
  userRoles = _.uniq(userRoles);
  if (userRoles.length > 0) {
    for (let roleIndex = 0; roleIndex < userRoles.length; roleIndex++) {
      let findQuery = {};
      if (userRoles[roleIndex] == "Admin" || userRoles[roleIndex] == "SuperAdmin") {
        findQuery = { status: true };
      } else if (userRoles[roleIndex] == "GroupAdmin") {
        let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
        findQuery = {
          groupId: { $in: groupIds },
          status: true
        };
      }
      await ControversyTasks.find({ status: true })
        .populate('companyId')
        .populate('analystId')
        .populate('createdBy')
        .then(async (controversyTasks) => {
          if (controversyTasks && controversyTasks.length > 0) {
            for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
              let yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              let lastModifiedDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, status: true, isActive: true }).limit(1).sort({ updatedAt: -1 });
              let reviewDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 });
              let totalNoOfControversy = await Controversy.count({ taskId: controversyTasks[cIndex].id, status: true, isActive: true });
              let object = {};
              object.taskNumber = controversyTasks[cIndex].taskNumber;
              object.taskId = controversyTasks[cIndex].id;
              object.companyId = controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.id : '';
              object.company = controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.companyName : '';
              object.analystId = controversyTasks[cIndex].analystId ? controversyTasks[cIndex].analystId.id : '';
              object.analyst = controversyTasks[cIndex].analystId ? controversyTasks[cIndex].analystId.name : '';
              object.taskStatus = controversyTasks[cIndex].taskStatus ? controversyTasks[cIndex].taskStatus : '';
              object.status = controversyTasks[cIndex].status;
              object.createdBy = controversyTasks[cIndex].createdBy ? controversyTasks[cIndex].createdBy : null;
              object.lastModifiedDate = lastModifiedDate[0] ? lastModifiedDate[0].updatedAt : "";
              object.reviewDate = reviewDate[0] ? reviewDate[0].reviewDate : '';
              object.totalNoOfControversy = totalNoOfControversy;
              if (controversyTasks[cIndex] && object) {
                finalResponseObject.adminTaskList.controversyList.push(object)
                finalResponseObject.groupAdminTaskList.controversyList.push(object)
              }
            }
          }
        })
        .catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve controversy pending tasks!" })
        })
      await TaskAssignment.find(findQuery)
        .populate("createdBy")
        .populate("categoryId")
        .populate("groupId")
        .populate("batchId")
        .populate("analystId")
        .populate("qaId")
        .populate("companyId")
        .then((taskAssignments) => {
          for (let index = 0; index < taskAssignments.length; index++) {
            const object = taskAssignments[index];
            let taskObject = {
              taskId: object.id,
              taskNumber: object.taskNumber,
              pillar: object.categoryId ? object.categoryId.categoryName : null,
              pillarId: object.categoryId ? object.categoryId.id : null,
              group: object.groupId ? object.groupId.groupName : null,
              groupId: object.groupId ? object.groupId.id : null,
              batch: object.batchId ? object.batchId.batchName : null,
              batchId: object.batchId ? object.batchId.id : null,
              company: object.companyId ? object.companyId.companyName : null,
              companyId: object.companyId ? object.companyId.id : null,
              analyst: object.analystId ? object.analystId.name : null,
              analystId: object.analystId ? object.analystId.id : null,
              qa: object.qaId ? object.qaId.name : null,
              analystSLA: object.analystSLADate ? object.analystSLADate : null,
              qaSLA: object.qaSLADate ? object.qaSLADate : null,
              qaId: object.qaId ? object.qaId.id : null,
              fiscalYear: object.year,
              taskStatus: object.taskStatus,
              overAllCompletedDate: object.overAllCompletedDate,
              overAllCompanyTaskStatus: object.overAllCompanyTaskStatus,
              createdBy: object.createdBy ? object.createdBy.name : null,
              createdById: object.createdBy ? object.createdBy.id : null,
            };

            if (userRoles[roleIndex] == "Admin" || userRoles[roleIndex] == "SuperAdmin") {
              if (object.taskStatus != "Completed") {
                finalResponseObject.adminTaskList.pendingList.push(taskObject);
              } else if (object.taskStatus == "Completed") {
                finalResponseObject.adminTaskList.completedList.push(taskObject)
              }
            } else if (userRoles[roleIndex] == "GroupAdmin") {
              if (object.taskStatus != "Completed") {
                finalResponseObject.groupAdminTaskList.pendingList.push(taskObject)
              } else if (object.taskStatus == "Completed") {
                finalResponseObject.groupAdminTaskList.completedList.push(taskObject)
              }
            }
          }
        })
        .catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message ? error.message : "Failed to retrieve tasks!",
          });
        });
    }
    finalResponseObject.groupAdminTaskList.controversyList = _.sortBy(finalResponseObject.groupAdminTaskList.controversyList, 'company')
    finalResponseObject.adminTaskList.controversyList = _.sortBy(finalResponseObject.adminTaskList.controversyList, 'company')
    finalResponseObject.groupAdminTaskList.completedList = _.sortBy(finalResponseObject.groupAdminTaskList.completedList, 'company')
    finalResponseObject.groupAdminTaskList.pendingList = _.sortBy(finalResponseObject.groupAdminTaskList.pendingList, 'company')
    finalResponseObject.adminTaskList.pendingList = _.sortBy(finalResponseObject.adminTaskList.pendingList, 'company');
    finalResponseObject.adminTaskList.completedList = _.sortBy(finalResponseObject.adminTaskList.completedList, 'company');

    return res.status(200).json({
      status: "200",
      message: "Tasks retrieved successfully!",
      data: finalResponseObject,
    });
  }
};

export const retrieveFilteredDataTasks = async ({ user, params, querymen: { query, select, cursor } }, res, next) => {
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isUserActive: true
  }).populate({ path: "roleDetails.roles" }).populate({ path: "roleDetails.primaryRole" })
    .catch((error) => {
      return res.status(500).json({
        status: "500",
        message: error.message,
      });
    });
  let userRoles = [];
  if (completeUserDetail && completeUserDetail.roleDetails) {
    if (completeUserDetail.roleDetails.primaryRole) {
      userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
      if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
        for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
          if (completeUserDetail.roleDetails.roles[index]) {
            userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
          }
        }
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "User role not found!",
    });
  }
  userRoles = _.uniq(userRoles);
  let findQuery = {}, companyIds = [];
  if (query.company) {
    let companyDetail = await Companies.find({ companyName: { $regex: new RegExp(query.company, "i") } }).distinct('_id');
    companyIds = companyDetail ? companyDetail : [];
  }
  if (params.taskStatus && params.role == "GroupAdmin") {
    let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
    if (params.taskStatus == "Completed") {
      findQuery = {
        taskStatus: { $in: ["Completed", "Verification Completed"] },
        groupId: { $in: groupIds },
        status: true
      };
    } else if (params.taskStatus == "Pending") {
      findQuery = {
        taskStatus: { $nin: ["Completed", "Verification Completed"] },
        groupId: { $in: groupIds },
        status: true
      };
    }else {
      findQuery = {
        taskStatus: params.taskStatus ? params.taskStatus : '',
        groupId: { $in: groupIds },
        status: true
      };
    }
    if (query.company) {
      let groupAdminCompanyIds = await TaskAssignment.find({ groupId: { $in: groupIds }, status: true }).distinct('companyId');
      let commonCompanyIds = _.intersectionWith(groupAdminCompanyIds, companyIds, _.isEqual);
      findQuery['companyId'] = { $in: commonCompanyIds };
    }
  } else if (params.taskStatus && params.role == "SuperAdmin" || params.taskStatus && params.role == "Admin") {
    if (params.taskStatus == "Completed") {
      findQuery = { taskStatus: { $in: ["Completed", "Verification Completed"] }, status: true };
    } else {
      findQuery = { taskStatus: { $nin: ["Completed", "Verification Completed"] }, status: true };
    }
    if (query.company) {
      findQuery['companyId'] = { $in: companyIds };
    }
  } else if (params.role !== "GroupAdmin") {
    findQuery = { taskStatus: '', status: true };
  }
  if (userRoles.includes(params.role)) {
    await TaskAssignment.count(findQuery)
      .then(async (count) => {
        await TaskAssignment.find(findQuery, select, cursor)
          // .skip(query ? Number((query.page*query.limit)-query.limit) : 0)
          // .limit(query ? Number(query.limit) : 10)
          // .sort({createdAt: -1})
          .populate("createdBy")
          .populate("categoryId")
          .populate("groupId")
          .populate("batchId")
          .populate("analystId")
          .populate("qaId")
          .populate("companyId")
          .then(async (taskAssignments) => {
            let responseToReturn = {
              status: "200",
              message: "Tasks retrieved successfully!",
              count: count,
              rows: []
            };
            if (taskAssignments.length > 0) {
              for (let index = 0; index < taskAssignments.length; index++) {
                const object = taskAssignments[index];
                let taskObject = {
                  taskId: object.id,
                  taskNumber: object.taskNumber,
                  pillar: object.categoryId ? object.categoryId.categoryName : null,
                  pillarId: object.categoryId ? object.categoryId.id : null,
                  group: object.groupId ? object.groupId.groupName : null,
                  groupId: object.groupId ? object.groupId.id : null,
                  batch: object.batchId ? object.batchId.batchName : null,
                  batchId: object.batchId ? object.batchId.id : null,
                  company: object.companyId ? object.companyId.companyName : null,
                  companyId: object.companyId ? object.companyId.id : null,
                  analyst: object.analystId ? object.analystId.name : null,
                  analystId: object.analystId ? object.analystId.id : null,
                  qa: object.qaId ? object.qaId.name : null,
                  analystSLA: object.analystSLADate ? object.analystSLADate : null,
                  qaSLA: object.qaSLADate ? object.qaSLADate : null,
                  qaId: object.qaId ? object.qaId.id : null,
                  fiscalYear: object.year,
                  taskStatus: object.taskStatus,
                  overAllCompletedDate: object.overAllCompletedDate,
                  overAllCompanyTaskStatus: object.overAllCompanyTaskStatus,
                  createdBy: object.createdBy ? object.createdBy.name : null,
                  createdById: object.createdBy ? object.createdBy.id : null,
                };
                responseToReturn.rows.push(taskObject);
              }
            }
            return res.json(responseToReturn);
          })
          .catch((error) => {
            return res.status(400).json({
              status: "400",
              message: error.message ? error.message : "Failed to retrieve tasks!",
            });
          });
      });
  } else {
    return res.json({ status: "200", message: "Tasks retrieved successfully!", count: 0, rows: [] });
  }
};

export const retrieveFilteredControversyTasks = async ({ user, params, querymen: { query, select, cursor } }, res, next) => {
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isUserActive: true
  }).populate({ path: "roleDetails.roles" }).populate({ path: "roleDetails.primaryRole" })
    .catch((error) => {
      return res.status(500).json({
        status: "500",
        message: error.message,
      });
    });
  let userRoles = [];
  if (completeUserDetail && completeUserDetail.roleDetails) {
    if (completeUserDetail.roleDetails.primaryRole) {
      userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
      if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
        for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
          if (completeUserDetail.roleDetails.roles[index]) {
            userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
          }
        }
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "User role not found!",
    });
  }
  userRoles = _.uniq(userRoles);
  if (userRoles.includes(params.role)) {
    let findQuery = {}, companyIds = [];
    if (query.company) {
      let companyDetail = await Companies.find({ companyName: { $regex: new RegExp(query.company, "i") } }).distinct('_id');
      companyIds = companyDetail ? companyDetail : [];
    }
    if (params.role == "Client Representative") {
      let repDetails = await ClientRepresentatives.findOne({ userId: user.id }).populate('companiesList');
      findQuery = { companyId: { $in: repDetails.companiesList }, status: true };
      if (query.company) {
        let repCompanyIds = await Companies.find({ _id: { $in: repDetails.companiesList } }).distinct('_id');
        let commonCompanyIds = _.intersectionWith(repCompanyIds, companyIds, _.isEqual);
        findQuery['companyId'] = { $in: commonCompanyIds };
      }
    } else if (params.role == "Company Representative") {
      let repDetails = await CompanyRepresentatives.findOne({ userId: user.id }).populate('companiesList');
      findQuery = { companyId: { $in: repDetails.companiesList }, status: true };
      if (query.company) {
        let repCompanyIds = await Companies.find({ _id: { $in: repDetails.companiesList } }).distinct('_id');
        let commonCompanyIds = _.intersectionWith(repCompanyIds, companyIds, _.isEqual);
        findQuery['companyId'] = { $in: commonCompanyIds };
      }
    } else if (params.role == "GroupAdmin" || params.role == "Admin" || params.role == "SuperAdmin") {
      findQuery = { status: true };
      if (query.company) {
        findQuery['companyId'] = { $in: companyIds };
      }
    } else {
      return res.json({ status: "200", message: "Tasks retrieved successfully!", count: 0, rows: [] });
    }
    await ControversyTasks.count(findQuery)
      .then(async (count) => {
        await ControversyTasks.find(findQuery, select, cursor)
          .populate('companyId')
          .populate('analystId')
          .populate('createdBy')
          .then(async (controversyTasks) => {
            let responseToReturn = {
              status: "200",
              message: "Tasks retrieved successfully!",
              count: count,
              rows: []
            };
            if (controversyTasks && controversyTasks.length > 0) {
              for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
                let yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                // let lastModifiedDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, status: true, isActive: true }).limit(1).sort({ updatedAt: -1 });
                // let reviewDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 });
                // let totalNoOfControversy = await Controversy.count({ taskId: controversyTasks[cIndex].id, status: true, isActive: true });
                const [lastModifiedDate, reviewDate, totalNoOfControversy] = await Promise.all([
                  Controversy.find({ taskId: controversyTasks[cIndex].id, status: true, isActive: true }).limit(1).sort({ updatedAt: -1 }),
                  Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 }),
                  Controversy.count({ taskId: controversyTasks[cIndex].id, response: { $nin: ["", " "] }, status: true, isActive: true })
                ])
                // let totalNoOfControversy;
                // let controCount = _.countBy(allControversyTasks, obj => obj.taskId ? obj.taskId._id < controversyTasks[cIndex].id : null).true;
                // totalNoOfControversy = controCount;
                // console.log('totalNoOfControversy', totalNoOfControversy);
                let object = {};
                object.taskNumber = controversyTasks[cIndex].taskNumber;
                object.taskId = controversyTasks[cIndex].id;
                object.companyId = controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.id : '';
                object.company = controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.companyName : '';
                object.analystId = controversyTasks[cIndex].analystId ? controversyTasks[cIndex].analystId.id : '';
                object.analyst = controversyTasks[cIndex].analystId ? controversyTasks[cIndex].analystId.name : '';
                object.taskStatus = controversyTasks[cIndex].taskStatus ? controversyTasks[cIndex].taskStatus : '';
                object.status = controversyTasks[cIndex].status;
                object.createdBy = controversyTasks[cIndex].createdBy ? controversyTasks[cIndex].createdBy : null;
                object.lastModifiedDate = lastModifiedDate[0] ? lastModifiedDate[0].updatedAt : "";
                object.reviewDate = reviewDate[0] ? reviewDate[0].reviewDate : '';
                object.totalNoOfControversy = totalNoOfControversy;
                if (controversyTasks[cIndex] && object) {
                  responseToReturn.rows.push(object)
                }
              }
            }
            return res.json(responseToReturn);
          })
          .catch((error) => {
            return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve controversy tasks!" })
          })
      });
  } else {
    return res.json({ status: "200", message: "Tasks retrieved successfully!", count: 0, rows: [] });
  }
};

export const getMyTasks = async ({ user, querymen: { query, select, cursor } }, res, next) => {
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isUserActive: true
  })
    .populate({
      path: "roleDetails.roles",
    })
    .populate({
      path: "roleDetails.primaryRole",
    })
    .catch((error) => {
      return res.status(500).json({
        status: "500",
        message: error.message,
      });
    });
  let analystCollectionTaskList = [],
    analystCorrectionTaskList = [],
    qaTaskList = [],
    clientRepTaskList = [],
    companyRepTaskList = [],
    controversyTaskList = [],
    repControversyTaskList = [];
  let userRoles = [];
  if (completeUserDetail && completeUserDetail.roleDetails) {
    if (completeUserDetail.roleDetails.primaryRole) {
      userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
      if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
        for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
          if (completeUserDetail.roleDetails.roles[index]) {
            userRoles.push(
              completeUserDetail.roleDetails.roles[index].roleName
            );
          }
        }
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "User role not found!",
    });
  }
  userRoles = _.uniq(userRoles);

  if (userRoles.includes("QA")) {
    await TaskAssignment.find({
      qaId: completeUserDetail.id,
      $or: [
        {
          taskStatus: "Collection Completed",
        },
        {
          taskStatus: "Correction Completed",
        },
      ],
      status: true,
    })
      .sort({
        createdAt: -1,
      })
      .populate("createdBy")
      .populate("companyId")
      .populate("categoryId")
      .populate("groupId")
      .populate("batchId")
      .populate("analystId")
      .populate("qaId")
      .then(async (taskAssignments) => {
        for (let index = 0; index < taskAssignments.length; index++) {
          const object = taskAssignments[index];
          let categoryValidationRules = await Validations.find({ categoryId: object.categoryId.id })
            .populate({
              path: "datapointId",
              populate: {
                path: "keyIssueId"
              }
            });
          let taskObject = {
            taskId: object.id,
            taskNumber: object.taskNumber,
            pillar: object.categoryId ? object.categoryId.categoryName : null,
            pillarId: object.categoryId ? object.categoryId.id : null,
            group: object.groupId ? object.groupId.groupName : null,
            groupId: object.groupId ? object.groupId.id : null,
            batch: object.batchId ? object.batchId.batchName : null,
            batchId: object.batchId ? object.batchId.id : null,
            company: object.companyId ? object.companyId.companyName : null,
            clientTaxonomyId: object.companyId ? object.companyId.clientTaxonomyId : null,
            companyId: object.companyId ? object.companyId.id : null,
            analyst: object.analystId ? object.analystId.name : null,
            analystId: object.analystId ? object.analystId.id : null,
            analystSLADate: object.analystSLADate ? object.analystSLADate : null,
            qa: object.qaId ? object.qaId.name : null,
            qaId: object.qaId ? object.qaId.id : null,
            qaSLADate: object.qaSLADate ? object.qaSLADate : null,
            fiscalYear: object.year,
            taskStatus: object.taskStatus,
            createdBy: object.createdBy ? object.createdBy.name : null,
            createdById: object.createdBy ? object.createdBy.id : null,
          };
          if (categoryValidationRules.length > 0) {
            taskObject.isValidationRequired = true;
          }
          qaTaskList.push(taskObject);
        }
      })
      .catch((error) => {
        return res.status(400).json({
          status: "400",
          message: error.message ? error.message : "Failed to retrieve tasks!",
        });
      });
  }

  if (userRoles.includes("Analyst")) {
    await TaskAssignment.find({
      analystId: completeUserDetail.id,
      $or: [
        {
          taskStatus: "Pending",
        },
        {
          taskStatus: "In Progress",
        },
        {
          taskStatus: "Verification Pending",
        },
        {
          taskStatus: "Correction Pending",
        }
      ],
      status: true,
    })
      .sort({
        createdAt: -1,
      })
      .populate("createdBy")
      .populate("companyId")
      .populate("categoryId")
      .populate("groupId")
      .populate("batchId")
      .populate("analystId")
      .populate("qaId")
      .then(async (taskAssignments) => {
        for (let index = 0; index < taskAssignments.length; index++) {
          const object = taskAssignments[index];
          let categoryValidationRules = await Validations.find({ categoryId: object.categoryId.id })
            .populate({
              path: "datapointId",
              populate: {
                path: "keyIssueId"
              }
            });
          let taskObject = {
            taskId: object.id,
            taskNumber: object.taskNumber,
            pillar: object.categoryId ? object.categoryId.categoryName : null,
            pillarId: object.categoryId ? object.categoryId.id : null,
            group: object.groupId ? object.groupId.groupName : null,
            groupId: object.groupId ? object.groupId.id : null,
            batch: object.batchId ? object.batchId.batchName : null,
            batchId: object.batchId ? object.batchId.id : null,
            company: object.companyId ? object.companyId.companyName : null,
            clientTaxonomyId: object.companyId ? object.companyId.clientTaxonomyId : null,
            companyId: object.companyId ? object.companyId.id : null,
            analyst: object.analystId ? object.analystId.name : null,
            analystId: object.analystId ? object.analystId.id : null,
            analystSLADate: object.analystSLADate ? object.analystSLADate : null,
            qa: object.qaId ? object.qaId.name : null,
            qaId: object.qaId ? object.qaId.id : null,
            qaSLADate: object.qaSLADate ? object.qaSLADate : null,
            fiscalYear: object.year,
            taskStatus: object.taskStatus,
            isValidationRequired: false,
            createdBy: object.createdBy ? object.createdBy.name : null,
            createdById: object.createdBy ? object.createdBy.id : null
          };
          if (categoryValidationRules.length > 0) {
            taskObject.isValidationRequired = true;
          }
          if (taskAssignments[index].taskStatus == "Verification Pending" || taskAssignments[index].taskStatus == "Correction Pending") {
            analystCorrectionTaskList.push(taskObject);
          } else {
            analystCollectionTaskList.push(taskObject);
          }
        }
      })
      .catch((error) => {
        return res.status(400).json({
          status: "400",
          message: error.message ? error.message : "Failed to retrieve tasks!",
        });
      });
    await ControversyTasks.find({
      analystId: completeUserDetail.id,
      taskStatus: {
        $ne: "Completed",
      },
      status: true,
    })
      .populate("companyId")
      .populate("analystId")
      .populate("createdBy")
      .then(async (controversyTasks) => {
        if (controversyTasks && controversyTasks.length > 0) {
          for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            let lastModifiedDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, status: true, isActive: true }).limit(1).sort({ updatedAt: -1 });
            let reviewDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 });
            let totalNoOfControversy = await Controversy.count({ taskId: controversyTasks[cIndex].id, status: true, isActive: true });
            let object = {};
            object.taskNumber = controversyTasks[cIndex].taskNumber;
            object.taskId = controversyTasks[cIndex].id;
            object.companyId = controversyTasks[cIndex].companyId
              ? controversyTasks[cIndex].companyId.id
              : "";
            object.company = controversyTasks[cIndex].companyId
              ? controversyTasks[cIndex].companyId.companyName
              : "";
            object.analystId = controversyTasks[cIndex].analystId
              ? controversyTasks[cIndex].analystId.id
              : "";
            object.analyst = controversyTasks[cIndex].analystId
              ? controversyTasks[cIndex].analystId.name
              : "";
            object.taskStatus = controversyTasks[cIndex].taskStatus
              ? controversyTasks[cIndex].taskStatus
              : "";
            object.status = controversyTasks[cIndex].status;
            object.createdBy = controversyTasks[cIndex].createdBy
              ? controversyTasks[cIndex].createdBy
              : null;
            object.lastModifiedDate = lastModifiedDate[0] ? lastModifiedDate[0].updatedAt : "";
            object.reviewDate = reviewDate[0] ? reviewDate[0].reviewDate : '';
            object.totalNoOfControversy = totalNoOfControversy;
            if (controversyTasks[cIndex] && object) {
              controversyTaskList.push(object);
            }
          }
        }
      });
  }
  if (userRoles.includes("Client Representative")) {
    console.log('in client');
    let clientRepDetail = await ClientRepresentatives.findOne({
      userId: completeUserDetail.id,
      status: true
    });
    if (clientRepDetail && clientRepDetail.companiesList) {
      await TaskAssignment.find({
        companyId: { $in: clientRepDetail.companiesList },
        taskStatus: { $in: ["Completed", "Verification Completed"] },
        status: true
      }).sort({
        createdAt: -1,
      }).populate("createdBy")
        .populate("companyId")
        .populate("categoryId")
        .populate("groupId")
        .populate("batchId")
        .populate("analystId")
        .populate("qaId")
        .then((taskAssignments) => {
          for (let index = 0; index < taskAssignments.length; index++) {
            const object = taskAssignments[index];
            let taskObject = {
              taskId: object.id,
              taskNumber: object.taskNumber,
              pillar: object.categoryId ? object.categoryId.categoryName : null,
              pillarId: object.categoryId ? object.categoryId.id : null,
              group: object.groupId ? object.groupId.groupName : null,
              groupId: object.groupId ? object.groupId.id : null,
              batch: object.batchId ? object.batchId.batchName : null,
              batchId: object.batchId ? object.batchId.id : null,
              company: object.companyId ? object.companyId.companyName : null,
              clientTaxonomyId: object.companyId ? object.companyId.clientTaxonomyId : null,
              companyId: object.companyId ? object.companyId.id : null,
              analyst: object.analystId ? object.analystId.name : null,
              analystId: object.analystId ? object.analystId.id : null,
              analystSLADate: object.analystSLADate ? object.analystSLADate : null,
              qa: object.qaId ? object.qaId.name : null,
              qaId: object.qaId ? object.qaId.id : null,
              qaSLADate: object.qaSLADate ? object.qaSLADate : null,
              fiscalYear: object.year,
              taskStatus: object.taskStatus,
              createdBy: object.createdBy ? object.createdBy.name : null,
              createdById: object.createdBy ? object.createdBy.id : null,
            };
            clientRepTaskList.push(taskObject);
          }
        })
        .catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message
              ? error.message
              : "Failed to retrieve tasks!",
          });
        });
      await ControversyTasks.find({
        companyId: { $in: clientRepDetail.companiesList },
        status: true,
      })
        .populate("companyId")
        .populate("analystId")
        .populate("createdBy")
        .then(async (controversyTasks) => {
          if (controversyTasks && controversyTasks.length > 0) {
            for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
              let yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              let lastModifiedDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, status: true, isActive: true }).limit(1).sort({ updatedAt: -1 });
              let reviewDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 });
              let totalNoOfControversy = await Controversy.count({ taskId: controversyTasks[cIndex].id, status: true, isActive: true });
              let object = {};
              object.taskNumber = controversyTasks[cIndex].taskNumber;
              object.taskId = controversyTasks[cIndex].id;
              object.companyId = controversyTasks[cIndex].companyId
                ? controversyTasks[cIndex].companyId.id
                : "";
              object.company = controversyTasks[cIndex].companyId
                ? controversyTasks[cIndex].companyId.companyName
                : "";
              object.analystId = controversyTasks[cIndex].analystId
                ? controversyTasks[cIndex].analystId.id
                : "";
              object.analyst = controversyTasks[cIndex].analystId
                ? controversyTasks[cIndex].analystId.name
                : "";
              object.taskStatus = controversyTasks[cIndex].taskStatus
                ? controversyTasks[cIndex].taskStatus
                : "";
              object.status = controversyTasks[cIndex].status;
              object.createdBy = controversyTasks[cIndex].createdBy
                ? controversyTasks[cIndex].createdBy
                : null;
              object.lastModifiedDate = lastModifiedDate[0] ? lastModifiedDate[0].updatedAt : "";
              object.reviewDate = reviewDate[0] ? reviewDate[0].reviewDate : '';
              object.totalNoOfControversy = totalNoOfControversy;
              if (controversyTasks[cIndex] && object) {
                repControversyTaskList.push(object);
              }
            }
          }
        });
    }
  }

  if (userRoles.includes("Company Representative")) {
    let companyRepDetail = await CompanyRepresentatives.findOne({
      userId: completeUserDetail.id,
      status: true
    });
    if (companyRepDetail && companyRepDetail.companiesList.length > 0) {
      await TaskAssignment.find({
        companyId: {
          $in: companyRepDetail.companiesList,
        },
        taskStatus: { $in: ["Completed", "Verification Completed"] },
        status: true,
      })
        .sort({
          createdAt: -1,
        })
        .populate("createdBy")
        .populate("companyId")
        .populate("categoryId")
        .populate("groupId")
        .populate("batchId")
        .populate("analystId")
        .populate("qaId")
        .then((taskAssignments) => {
          for (let index = 0; index < taskAssignments.length; index++) {
            const object = taskAssignments[index];
            let taskObject = {
              taskId: object.id,
              taskNumber: object.taskNumber,
              pillar: object.categoryId ? object.categoryId.categoryName : null,
              pillarId: object.categoryId ? object.categoryId.id : null,
              group: object.groupId ? object.groupId.groupName : null,
              groupId: object.groupId ? object.groupId.id : null,
              batch: object.batchId ? object.batchId.batchName : null,
              batchId: object.batchId ? object.batchId.id : null,
              company: object.companyId ? object.companyId.companyName : null,
              clientTaxonomyId: object.companyId ? object.companyId.clientTaxonomyId : null,
              companyId: object.companyId ? object.companyId.id : null,
              analyst: object.analystId ? object.analystId.name : null,
              analystId: object.analystId ? object.analystId.id : null,
              analystSLADate: object.analystSLADate ? object.analystSLADate : null,
              qa: object.qaId ? object.qaId.name : null,
              qaId: object.qaId ? object.qaId.id : null,
              qaSLADate: object.qaSLADate ? object.qaSLADate : null,
              fiscalYear: object.year,
              taskStatus: object.taskStatus,
              createdBy: object.createdBy ? object.createdBy.name : null,
              createdById: object.createdBy ? object.createdBy.id : null,
            };
            companyRepTaskList.push(taskObject);
          }
        })
        .catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message
              ? error.message
              : "Failed to retrieve tasks!",
          });
        });
      await ControversyTasks.find({
        companyId: { $in: companyRepDetail.companiesList },
        status: true,
      })
        .populate("companyId")
        .populate("analystId")
        .populate("createdBy")
        .then(async (controversyTasks) => {
          if (controversyTasks && controversyTasks.length > 0) {
            for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
              let yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              let lastModifiedDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, status: true, isActive: true }).limit(1).sort({ updatedAt: -1 });
              let reviewDate = await Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 });
              let totalNoOfControversy = await Controversy.count({ taskId: controversyTasks[cIndex].id, status: true, isActive: true });
              let object = {};
              object.taskNumber = controversyTasks[cIndex].taskNumber;
              object.taskId = controversyTasks[cIndex].id;
              object.companyId = controversyTasks[cIndex].companyId
                ? controversyTasks[cIndex].companyId.id
                : "";
              object.company = controversyTasks[cIndex].companyId
                ? controversyTasks[cIndex].companyId.companyName
                : "";
              object.analystId = controversyTasks[cIndex].analystId
                ? controversyTasks[cIndex].analystId.id
                : "";
              object.analyst = controversyTasks[cIndex].analystId
                ? controversyTasks[cIndex].analystId.name
                : "";
              object.taskStatus = controversyTasks[cIndex].taskStatus
                ? controversyTasks[cIndex].taskStatus
                : "";
              object.status = controversyTasks[cIndex].status;
              object.createdBy = controversyTasks[cIndex].createdBy
                ? controversyTasks[cIndex].createdBy
                : null;
              object.lastModifiedDate = lastModifiedDate[0] ? lastModifiedDate[0].updatedAt : "";
              object.reviewDate = reviewDate[0] ? reviewDate[0].reviewDate : '';
              object.totalNoOfControversy = totalNoOfControversy;
              if (controversyTasks[cIndex] && object) {
                repControversyTaskList.push(object);
              }
            }
          }
        });
    }
  }
  let data = {
    analystCollectionTaskList: analystCollectionTaskList ? analystCollectionTaskList : [],
    analystCorrectionTaskList: analystCorrectionTaskList ? analystCorrectionTaskList : [],
    qaTaskList: qaTaskList ? qaTaskList : [],
    clientRepTaskList: clientRepTaskList ? clientRepTaskList : [],
    companyRepTaskList: companyRepTaskList ? companyRepTaskList : [],
    controversyTaskList: controversyTaskList ? controversyTaskList : [],
    repControversyTaskList: repControversyTaskList ? repControversyTaskList : []
  };
  return res.status(200).json({
    status: "200",
    message: "Task retrieved succesfully!",
    data: data,
  });
};

export const getMyTasksPageData = async ({ user, querymen: { query, select, cursor }, params }, res, next) => {
  try {
    let completeUserDetail = await User.findOne({ _id: user.id, isUserActive: true })
      .populate({ path: "roleDetails.roles" }).populate({ path: "roleDetails.primaryRole" })
      .catch((error) => {
        return res.status(500).json({
          status: "500",
          message: error.message,
        });
      });
    let userRoles = [];
    if (completeUserDetail && completeUserDetail.roleDetails) {
      if (completeUserDetail.roleDetails.primaryRole) {
        userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
        if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
          for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
            if (completeUserDetail.roleDetails.roles[index]) {
              userRoles.push(
                completeUserDetail.roleDetails.roles[index].roleName
              );
            }
          }
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "User role not found!",
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
    userRoles = _.uniq(userRoles);
    let rows = [], count = 0, findQuery = {}, companyIds = [];
    if (query.company) {
      let companyDetail = await Companies.find({ companyName: { $regex: new RegExp(query.company, "i") } }).distinct('_id');
      companyIds = companyDetail ? companyDetail : [];
    }
    if (params.role == "Analyst") {
      if (userRoles.includes("Analyst")) {
        if (params.type == "DataCollection") {
          findQuery = {
            analystId: completeUserDetail.id,
            $or: [
              {
                taskStatus: "Pending"
              },
              {
                taskStatus: "In Progress"
              }
            ],
            status: true,
          }
        } else if (params.type == "DataCorrection") {
          findQuery = {
            analystId: completeUserDetail.id,
            $or: [
              {
                taskStatus: "Verification Pending"
              },
              {
                taskStatus: "Correction Pending"
              }
            ],
            status: true,
          }
        } else if (params.type == "ControversyCollection") {
          findQuery = {
            analystId: completeUserDetail.id,
            taskStatus: {
              $ne: "Completed"
            },
            status: true
          }
        } else {
          return res.status(400).json({ status: "400", rows: [], count: 0, message: "Invalid type to fetch the records!" });
        }
        if (query.company) {
          findQuery['companyId'] = { $in: companyIds };
        }
      } else {
        return res.status(400).json({ status: "400", message: "User role not found!" });
      }
    } else if (params.role == "QA") {
      if (userRoles.includes("QA")) {
        if (params.type == "DataVerification") {
          findQuery = {
            qaId: completeUserDetail.id,
            $or: [
              {
                taskStatus: "Collection Completed"
              },
              {
                taskStatus: "Correction Completed"
              }
            ],
            status: true
          }
        } else {
          return res.status(400).json({ status: "400", rows: [], count: 0, message: "Invalid type to fetch the records!" });
        }
        if (query.company) {
          findQuery['companyId'] = { $in: companyIds };
        }
      } else {
        return res.status(400).json({ status: "400", message: "User role not found!" });
      }
    } else if (params.role == "GroupAdmin") {
      if (userRoles.includes("GroupAdmin")) {
        let adminGroupIds = await Group.find({ groupAdmin: completeUserDetail.id, status: true }).distinct('_id');
        if (params.type == "DataVerification") {
          if (adminGroupIds.length > 0) {
            findQuery = {
              $or: [
                {
                  groupId: { $in: adminGroupIds },
                },
                {
                  qaId: completeUserDetail.id
                }
              ],
              $or: [
                {
                  taskStatus: "Collection Completed"
                },
                {
                  taskStatus: "Correction Completed"
                }
              ],
              status: true
            }
          } else {
            findQuery = {
              qaId: completeUserDetail.id,
              $or: [
                {
                  taskStatus: "Collection Completed"
                },
                {
                  taskStatus: "Correction Completed"
                }
              ],
              status: true
            }
          }
        } else {
          return res.status(400).json({ status: "400", rows: [], count: 0, message: "Invalid type to fetch the records!" });
        }
        if (query.company) {
          findQuery['companyId'] = { $in: companyIds };
        }
      } else {
        return res.status(400).json({ status: "400", message: "User role not found!" });
      }
    } else if (params.role == "Admin" || params.role == "SuperAdmin") {
      if (userRoles.includes("Admin") || userRoles.includes("SuperAdmin")) {
        if (params.type == "DataVerification") {
          findQuery = {
            $or: [
              {
                taskStatus: "Collection Completed"
              },
              {
                taskStatus: "Correction Completed"
              }
            ],
            status: true
          }
        } else {
          return res.status(400).json({ status: "400", rows: [], count: 0, message: "Invalid type to fetch the records!" });
        }
        if (query.company) {
          findQuery['companyId'] = { $in: companyIds };
        }
      } else {
        return res.status(400).json({ status: "400", message: "User role not found!" });
      }
    } else if (params.role == "Client Representative") {
      if (userRoles.includes("Client Representative")) {
        let clientRepDetail = await ClientRepresentatives.findOne({
          userId: completeUserDetail.id,
          status: true
        }).populate('companiesList')
          .catch((err) => { return res.status(400).json({ status: "400", message: err.message ? err.message : "Invalid user Id" }) });
        if (clientRepDetail && clientRepDetail.companiesList) {
          if (params.type == "DataReview") {
            findQuery = {
              companyId: { $in: clientRepDetail.companiesList },
              taskStatus: { $in: ["Completed", "Verification Completed"] },
              status: true
            }
          } else if (params.type == "ControversyCollection" || params.type == "ControversyReview") {
            findQuery = {
              companyId: { $in: clientRepDetail.companiesList },
              status: true
            }
          } else {
            return res.status(400).json({ status: "400", rows: [], count: 0, message: "Invalid type to fetch the records!" });
          }
          if (query.company) {
            let repCompanyIds = await Companies.find({ _id: { $in: clientRepDetail.companiesList } }).distinct('_id');
            let commonCompanyIds = _.intersectionWith(repCompanyIds, companyIds, _.isEqual);
            findQuery['companyId'] = { $in: commonCompanyIds };
          }
        } else {
          return res.status(200).json({ status: "200", message: "Task retrieved succesfully!", rows: [], count: 0 });
        }
      } else {
        return res.status(400).json({ status: "400", message: "User role not found!" });
      }
    } else if (params.role == "Company Representative") {
      if (userRoles.includes("Company Representative")) {
        let companyRepDetail = await CompanyRepresentatives.findOne({
          userId: completeUserDetail.id,
          status: true
        }).populate('companiesList');
        if (companyRepDetail && companyRepDetail.companiesList) {
          if (params.type == "DataReview") {
            findQuery = {
              companyId: {
                $in: companyRepDetail.companiesList
              },
              taskStatus: { $in: ["Completed", "Verification Completed"] },
              status: true
            }
          } else if (params.type == "ControversyCollection" || params.type == "ControversyReview") {
            findQuery = {
              companyId: { $in: companyRepDetail.companiesList },
              status: true
            }
          } else {
            return res.status(400).json({ status: "400", rows: [], count: 0, message: "Invalid type to fetch the records!" });
          }
          if (query.company) {
            let repCompanyIds = await Companies.find({ _id: { $in: companyRepDetail.companiesList } }).distinct('_id');
            let commonCompanyIds = _.intersectionWith(repCompanyIds, companyIds, _.isEqual);
            findQuery['companyId'] = { $in: commonCompanyIds };
          }
        } else {
          return res.status(200).json({ status: "200", message: "Task retrieved succesfully!", rows: [], count: 0 });
        }
      } else {
        return res.status(400).json({ status: "400", message: "User role not found!" });
      }
    }
    if (params.type == "ControversyCollection" || params.type == "ControversyReview") {
      count = await ControversyTasks.count(findQuery);
      await ControversyTasks.find(findQuery, select, cursor)
        .populate("companyId")
        .populate("analystId")
        .populate("createdBy")
        .then(async (controversyTasks) => {
          if (controversyTasks && controversyTasks.length > 0) {
            for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
              let object = {};
              if (params.type != "ControversyReview") {
                let yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const [lastModifiedDate, reviewDate, totalNoOfControversy] = await Promise.all([
                  ControversyTasks.find({ _id: controversyTasks[cIndex].id, status: true }),
                  Controversy.find({ taskId: controversyTasks[cIndex].id, reviewDate: { $gt: yesterday }, status: true, isActive: true }).limit(1).sort({ reviewDate: 1 }),
                  Controversy.count({ taskId: controversyTasks[cIndex].id, response: { $nin: ["", " "] }, status: true, isActive: true })
                ]);
                // object.lastModifiedDate = lastModifiedDate[0] ? lastModifiedDate[0].updatedAt : "";
                object.reassessmentDate = lastModifiedDate[0] ? lastModifiedDate[0]?.reassessmentDate : "";
                object.reviewedByCommittee = lastModifiedDate[0] ? lastModifiedDate[0]?.reviewedByCommittee : "";
                object.reviewDate = reviewDate[0] ? reviewDate[0].reviewDate : '';
                object.totalNoOfControversy = totalNoOfControversy;
              }
              object.taskNumber = controversyTasks[cIndex].taskNumber;
              object.taskId = controversyTasks[cIndex].id;
              object.companyId = controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.id : "";
              object.company = controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.companyName : "";
              object.analystId = controversyTasks[cIndex].analystId ? controversyTasks[cIndex].analystId.id : "";
              object.analyst = controversyTasks[cIndex].analystId ? controversyTasks[cIndex].analystId.name : "";
              object.taskStatus = controversyTasks[cIndex].taskStatus ? controversyTasks[cIndex].taskStatus : "";
              object.status = controversyTasks[cIndex].status;
              object.createdBy = controversyTasks[cIndex].createdBy ? controversyTasks[cIndex].createdBy : null;
              if (controversyTasks[cIndex] && object) {
                rows.push(object);
              }
            }
          }
          return res.status(200).json({ status: "200", rows: rows, count: count, message: "Task retrieved succesfully!" });
        })
        .catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message ? error.message : "Failed to retrieve tasks!"
          });
        });
    } else if (params.type == "DataCollection" || params.type == "DataCorrection" || params.type == "DataVerification" || params.type == "DataReview") {
      count = await TaskAssignment.count(findQuery);
      await TaskAssignment.find(findQuery, select, cursor)
        .sort({ createdAt: -1 })
        .populate("createdBy")
        .populate("companyId")
        .populate("categoryId")
        .populate("groupId")
        .populate("batchId")
        .populate("analystId")
        .populate("qaId")
        .then(async (taskAssignments) => {
          for (let index = 0; index < taskAssignments.length; index++) {
            const object = taskAssignments[index];
            let categoryValidationRules = [];
            if (params.role == "Analyst") {
              categoryValidationRules = await Validations.find({ categoryId: object.categoryId.id })
                .populate({ path: "datapointId", populate: { path: "keyIssueId" } });
            }
            let taskObject = {
              taskId: object.id,
              taskNumber: object.taskNumber,
              pillar: object.categoryId ? object.categoryId.categoryName : null,
              pillarId: object.categoryId ? object.categoryId.id : null,
              group: object.groupId ? object.groupId.groupName : null,
              groupId: object.groupId ? object.groupId.id : null,
              batch: object.batchId ? object.batchId.batchName : null,
              batchId: object.batchId ? object.batchId.id : null,
              company: object.companyId ? object.companyId.companyName : null,
              clientTaxonomyId: object.companyId ? object.companyId.clientTaxonomyId : null,
              companyId: object.companyId ? object.companyId.id : null,
              analyst: object.analystId ? object.analystId.name : null,
              analystId: object.analystId ? object.analystId.id : null,
              analystSLADate: object.analystSLADate ? object.analystSLADate : null,
              qa: object.qaId ? object.qaId.name : null,
              qaId: object.qaId ? object.qaId.id : null,
              qaSLADate: object.qaSLADate ? object.qaSLADate : null,
              fiscalYear: object.year,
              taskStatus: object.taskStatus,
              createdBy: object.createdBy ? object.createdBy.name : null,
              createdById: object.createdBy ? object.createdBy.id : null
            };
            if (params.role == "Analyst") {
              if (categoryValidationRules.length > 0) {
                taskObject.isValidationRequired = true;
              } else {
                taskObject.isValidationRequired = false;
              }
            }
            if (params.type == "DataVerification") {
              taskObject.isChecked = false;
            }
            rows.push(taskObject);
          }
          return res.status(200).json({ status: "200", rows: rows, count: count, message: "Task retrieved succesfully!" });
        })
        .catch((error) => {
          return res.status(400).json({
            status: "400",
            message: error.message ? error.message : "Failed to retrieve tasks!"
          });
        });
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the tasks!" });
  }
}

export const show = ({ params }, res, next) =>
  TaskAssignment.findById(params.id)
    .populate("createdBy")
    .populate("companyId")
    .populate("categoryId")
    .populate("groupId")
    .populate("batchId")
    .populate("analystId")
    .populate("qaId")
    .then(notFound(res))
    .then((taskAssignment) => (taskAssignment ? taskAssignment.view() : null))
    .then(success(res))
    .catch(next);

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .populate("createdBy")
    .populate("companyId")
    .populate("categoryId")
    .populate("groupId")
    .populate("batchId")
    .populate("analystId")
    .populate("qaId")
    .then(notFound(res))
    .then(authorOrAdmin(res, user, "createdBy"))
    .then((taskAssignment) =>
      taskAssignment ? Object.assign(taskAssignment, body).save() : null
    )
    .then((taskAssignment) =>
      taskAssignment ? taskAssignment.view(true) : null
    )
    .then(success(res))
    .catch(next);


export const updateSlaDates = async ({ user, bodymen: { body }, params }, res, next) => {
  await TaskAssignment.findById(body.taskId).populate('companyId').populate('categoryId').populate('groupId')
    .then(async (result) => {
      if (result.taskStatus == "Reassignment Pending") {
        body.taskDetails['taskStatus'] = "Correction Pending";
      }
      if (body.taskDetails.analystRequestedDate == body.taskDetails.analystSLADate) {
        await TaskSlaLog.updateMany({ taskId: body.taskId, requestedBy: 'Analyst', status: true },
          { $set: { isAccepted: true, isReviewed: true } });
        await Notifications.create({
          notifyToUser: result.analystId,
          notificationType: "/pendingtasks",
          content: `SLA request accepted by ${user.name ? user.name : 'GroupAdmin'} for TaskID - ` + result.taskNumber,
          notificationTitle: "SLA request accepted",
          status: true,
          isRead: false
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
      if (body.taskDetails.qaRequestedDate == body.taskDetails.qaSLADate) {
        await TaskSlaLog.updateMany({ taskId: body.taskId, requestedBy: 'QA', status: true },
          { $set: { isAccepted: true, isReviewed: true } });
        await Notifications.create({
          notifyToUser: result.qaId,
          notificationType: "/pendingtasks",
          content: `SLA request accepted by ${user.name ? user.name : 'GroupAdmin'} for TaskID - ` + result.taskNumber,
          notificationTitle: "SLA request accepted",
          status: true,
          isRead: false
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
      if (result.analystSLADate != body.taskDetails.analystSLADate) {
        await Notifications.create({
          notifyToUser: result.analystId,
          notificationType: "/pendingtasks",
          content: `SLA date extended by ${user.name ? user.name : 'GroupAdmin'} for TaskID - ` + result.taskNumber,
          notificationTitle: "SLA Date Extended",
          status: true,
          isRead: false
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
      if (result.qaSLADate != body.taskDetails.qaSLADate) {
        await Notifications.create({
          notifyToUser: result.qaId,
          notificationType: "/pendingtasks",
          content: `SLA date extended by ${user.name ? user.name : 'GroupAdmin'} for TaskID - ` + result.taskNumber,
          notificationTitle: "SLA Date Extended",
          status: true,
          isRead: false
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
      if (result.analystId != body.taskDetails.analystId) {
        await Notifications.create({
          notifyToUser: result.analystId,
          notificationType: "/pendingtasks",
          content: `New task assigned by ${user.name ? user.name : 'GroupAdmin'} for TaskID - ` + result.taskNumber,
          notificationTitle: "New Task Assigned",
          status: true,
          isRead: false
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
      if (result.qaId != body.taskDetails.qaId) {
        await Notifications.create({
          notifyToUser: result.qaId,
          notificationType: "/pendingtasks",
          content: `New task assigned by ${user.name ? user.name : 'GroupAdmin'} for TaskID - ` + result.taskNumber,
          notificationTitle: "New Task Assigned",
          status: true,
          isRead: false
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
      await TaskAssignment.updateOne({ _id: body.taskId }, { $set: body.taskDetails }).then(async (updatedRecord) => {
        if (result.taskStatus == "Reassignment Pending") {
          body.taskDetails['taskStatus'] = "Correction Pending";
          await TaskHistories.create({
            taskId: body.taskId,
            companyId: result.companyId.id,
            categoryId: result.categoryId.id,
            submittedByName: user.name,
            stage: "Correction Pending",
            comment: '',
            status: true,
            createdBy: user
          }).catch((error) => {
            return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to create task history!" });
          });
          await Notifications.create({
            notifyToUser: result.groupId.groupAdmin,
            notificationType: "/tasklist",
            content: "Reassign the task for Analyst as it has some errors TaskID - " + `${result.taskNumber}, CompanyName - ${result.companyId.companyName}`,
            notificationTitle: "Reassignment Pending",
            status: true,
            isRead: false
          }).catch((error) => {
            return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
          });
          let adminRoleIds = await Role.find({ roleName: { $in: ["SuperAdmin", "Admin"] }, status: true }).distinct('_id');
          let allAdminUserIds = await User.find({ $or: [{ "roleDetails.roles": { $in: adminRoleIds } }, { "roleDetails.primaryRole": { $in: adminRoleIds } }], status: true }).distinct('_id');
          for (let admIndex = 0; admIndex < allAdminUserIds.length; admIndex++) {
            await Notifications.create({
              notifyToUser: allAdminUserIds[admIndex],
              notificationType: "/tasklist",
              content: "Reassign the task for Analyst as it has some errors TaskID - " + `${result.taskNumber}, CompanyName - ${result.companyId.companyName}`,
              notificationTitle: "Reassignment Pending",
              status: true,
              isRead: false
            }).catch((error) => {
              return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
            });
          }
        }
        res.send({
          status: 200,
          message: 'Task updated successfully'
        })
      }).catch((err) => {
        return res.status(500).json({
          status: "500",
          message: err.message
        });
      });
    })
    .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to update the sla dates!" }) });
}

export const destroy = ({ user, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, "createdBy"))
    .then((taskAssignment) => (taskAssignment ? taskAssignment.remove() : null))
    .then(success(res, 204))
    .catch(next);

export const getGroupAndBatches = async ({ user, params }, res, next) => {
  try {
    let completeUserDetail = await User.findOne({
      _id: user.id,
      isUserActive: true
    }).populate({ path: "roleDetails.roles" }).populate({ path: "roleDetails.primaryRole" })
      .catch((error) => {
        return res.status(500).json({
          status: "500",
          message: error.message,
        });
      });
    let userRoles = [];
    if (completeUserDetail && completeUserDetail.roleDetails) {
      if (completeUserDetail.roleDetails.primaryRole) {
        userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
        if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
          for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
            if (completeUserDetail.roleDetails.roles[index]) {
              userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
            }
          }
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "User role not found!",
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
    let finalResponseObject = {
      groupAdminList: [],
      adminList: []
    };
    userRoles = _.uniq(userRoles);
    if (userRoles.length > 0) {
      let categories = await Categories.find({
        status: true
      })
        .populate('clientTaxonomyId').catch((err) => {
          return res.status(500).json({
            status: "500",
            message: err.message
          });
        });
      for (let roleIndex = 0; roleIndex < userRoles.length; roleIndex++) {
        let findQuery = {};
        if (userRoles[roleIndex] == "GroupAdmin") {
          findQuery = { groupAdmin: user.id, status: true };
        } else if (userRoles[roleIndex] == "SuperAdmin" || userRoles[roleIndex] == "Admin") {
          findQuery = { status: true };
        }
        if (findQuery != {}) {
          await Group.find(findQuery)
            .populate("assignedMembers")
            .populate("batchList")
            .populate("batchList.clientTaxonomy")
            .then(async (group) => {
              for (let index = 0; index < group.length; index++) {
                var resObject = {};
                resObject.groupName = group[index].groupName;
                resObject.groupID = group[index].id;
                resObject.assignedBatches = [];
                for (let index1 = 0; index1 < group[index].batchList.length; index1++) {

                  let foundCategories = categories.filter(obj => obj.clientTaxonomyId.id == group[index].batchList[index1].clientTaxonomy);
                  var batchDetailsObject = group[index].batchList[index1];
                  var batchDetails = {
                    batchName: batchDetailsObject.batchName,
                    batchID: batchDetailsObject._id,
                    pillars: foundCategories.map((rec) => {
                      return {
                        value: rec.id,
                        label: rec.categoryName
                      };
                    }),
                    batchYear: batchDetailsObject.years
                  }
                  // arrayYe.push(bactch)
                  // var assignedBatches = group[index].batchList.map((rec) => {
                  //   return {
                  //     batchName: rec.batchName,
                  //     batchID: rec._id,
                  //     pillars: foundCategories.map((rec) => {
                  //       return {
                  //         value: rec.id,
                  //         label: rec.categoryName
                  //       };
                  //     }),
                  //     batchYear: rec.years
                  //   };
                  // });
                  resObject.assignedBatches.push(batchDetails);
                }
                if (userRoles[roleIndex] == "GroupAdmin") {
                  finalResponseObject.groupAdminList.push(resObject);
                } else if (userRoles[roleIndex] == "SuperAdmin" || userRoles[roleIndex] == "Admin") {
                  finalResponseObject.adminList.push(resObject);
                }
              }
            })
            .catch((err) => {
              return res.status(500).json({
                status: "500",
                message: err.message
              });
            });
        }
      }
    }
    return res.status(200).json({ status: "200", message: "Groups retrieved successfully!", data: finalResponseObject });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the groups and batches!" })
  }
}

export const getUsers = async ({ user, bodymen: { body } }, res, next) => {
  try {
    var resObj = {};
    var batch = await Batches.findById(body.batchId).populate("companiesList").catch();
    if (batch && batch.companiesList.length > 0) {
      var unAssignedCompanyList = [];
      for (let index = 0; index < batch.companiesList.length; index++) {
        var years = "";
        if (batch.years && batch.years.length > 0) {
          batch.years.forEach((rec, forIndex) => {
            if (forIndex == batch.years.length - 1) {
              years = years + rec;
            } else {
              years = years + rec + ", ";
            }
          });
        }
        var assignedCompanyList = await TaskAssignment.find({ categoryId: body.categoryId, year: years, companyId: batch.companiesList[index].id })
          .populate("companyId")
          .catch((error) => { return res.status(500).json({ status: "500", message: error.message }) })
        if (assignedCompanyList.length === 0) {
          unAssignedCompanyList.push({
            id: batch.companiesList[index].id,
            companyName: batch.companiesList[index].companyName,
          })
        }
      }
      resObj["companies"] = unAssignedCompanyList;
    }
    var group = await Group.findById(body.groupId).populate("assignedMembers").populate({ path: "assignedMembers.roleDetails" });
    var roleDetails = await Role.find({ roleName: { $in: ["QA", "Analyst"] } });
    var qa = [], analyst = [];
    if (group && group.assignedMembers.length > 0) {
      for (let index = 0; index < group.assignedMembers.length; index++) {
        var qaId = roleDetails.find((rec) => {
          return rec.roleName === "QA";
        });
        var analystId = roleDetails.find((rec) => {
          return rec.roleName === "Analyst";
        });
        var qaObject = {};
        var analystObject = {};
        var userPillar = await UserPillarAssignments.findOne({
          userId: group.assignedMembers[index].id,
          $or: [
            {
              secondaryPillar: { $in: [body.categoryId] },
            },
            { primaryPillar: body.categoryId },
          ]
        }).populate("primaryPillar").populate("secondaryPillar")
          .catch((error) => { return res.status(500).json({ status: "500", message: error.message }) })
        if (userPillar && Object.keys(userPillar).length > 0) {
          if (userPillar.primaryPillar.id === body.categoryId) {
            qaObject.primaryPillar = true;
            analystObject.primaryPillar = true;
          } else {
            qaObject.primaryPillar = false;
            analystObject.primaryPillar = false;
          }
          if (qaId && (group.assignedMembers[index].roleDetails.primaryRole == qaId.id)) {
            var activeTaskCount = await TaskAssignment.find({
              qaId: group.assignedMembers[index].id,
              status: true,
              taskStatus: { $ne: "Verification Completed" },
            });
            qaObject.id = group.assignedMembers[index].id;
            qaObject.name = group.assignedMembers[index].name;
            qaObject.primaryRole = true;
            qaObject.activeTaskCount = activeTaskCount.length;
            qa.push(qaObject);
          } else if (qaId && (group.assignedMembers[index].roleDetails.roles.indexOf(qaId.id) > -1)) {
            var activeTaskCount = await TaskAssignment.find({
              qaId: group.assignedMembers[index].id,
              status: true,
              taskStatus: { $ne: "Verification Completed" },
            });
            qaObject.id = group.assignedMembers[index].id;
            qaObject.name = group.assignedMembers[index].name + "-" + group.assignedMembers[index].email;
            qaObject.primaryRole = false;
            qaObject.activeTaskCount = activeTaskCount.length;
            qa.push(qaObject);
          }
          if (analystId && (group.assignedMembers[index].roleDetails.primaryRole == analystId.id)) {
            var activeTaskCount = await TaskAssignment.find({
              analystId: group.assignedMembers[index].id,
              status: true,
              taskStatus: {
                $nin: ["Collection Completed", "Correction Completed"],
              },
            });
            analystObject.id = group.assignedMembers[index].id;
            analystObject.name = group.assignedMembers[index].name + "-" + group.assignedMembers[index].email;
            analystObject.primaryRole = true;
            analystObject.activeTaskCount = activeTaskCount.length;
            analyst.push(analystObject);
          } else if (analystId && (group.assignedMembers[index].roleDetails.roles.indexOf(analystId._id) > -1)) {
            var activeTaskCount = await TaskAssignment.find({
              analystId: group.assignedMembers[index].id,
              status: true,
              taskStatus: {
                $nin: ["Collection Completed", "Correction Completed"],
              },
            });
            analystObject.id = group.assignedMembers[index].id;
            analystObject.name = group.assignedMembers[index].name + "-" + group.assignedMembers[index].email;
            analystObject.primaryRole = false;
            analystObject.activeTaskCount = activeTaskCount.length;
            analyst.push(analystObject);
          }
        }
      }
      resObj["qaData"] = qa;
      resObj["analystData"] = analyst;
      return res.status(200).json({ data: resObj });
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the users!" })
  }
}


export const updateCompanyStatus = async ({ user, bodymen: { body } }, res, next) => {
  try {
    if (body.role == Analyst && !body.skipValidation) {
      let failedCount = await ValidationResults.countDocuments({ taskId: body.taskId, isValidResponse: false, status: true });
      if (failedCount > 0) {
        return res.status(400).json({ status: 400, message: "Few validations are still failed, Please check before submitting or skip the validation!" })
      }
    }
    // get all task details.
    const taskDetails = await TaskAssignment.findOne({
      _id: body.taskId
    }).populate({
      path: 'companyId',
      populate: {
        path: 'clientTaxonomyId'
      }
    })
      .populate('groupId')
      .populate('categoryId');

    // Get distinct years
    let distinctYears = taskDetails.year.split(', ');
    const fiscalYearEndMonth = taskDetails.companyId.fiscalYearEndMonth;
    const fiscalYearEndDate = taskDetails.companyId.fiscalYearEndDate;
    let [reqDpCodes, negativeNews] = await Promise.all([
      Datapoints.find({ categoryId: taskDetails.categoryId, isRequiredForReps: true }),
      Functions.findOne({ functionType: "Negative News", status: true })
    ]);

    const query = {
      taskId: body.taskId,
      companyId: taskDetails.companyId.id,
      year: {
        "$in": distinctYears
      },
      isActive: true,
      status: true
    }

    if (body.skipValidation) {
      query.datapointId = { $in: reqDpCodes }
    }

    // StandAlone, BoardMatrix and KMP are DpTypes.
    const [allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails, distinctBMMembers, distinctKmpMembers] = await Promise.all([
      StandaloneDatapoints.find(query),
      BoardMembersMatrixDataPoints.find(query),
      KmpMatrixDataPoints.find(query),
      BoardMembersMatrixDataPoints.distinct('memberName', query),
      KmpMatrixDataPoints.distinct('memberName', query)
    ]);

    let totalDatapointsCollectedCount = 0;
    // Getting all the collected Datas.
    const mergedDetails = _.concat(allKmpMatrixDetails, allBoardMemberMatrixDetails, allStandaloneDetails);
    // total collected data.
    totalDatapointsCollectedCount = totalDatapointsCollectedCount + allStandaloneDetails.length + allBoardMemberMatrixDetails.length + allKmpMatrixDetails.length;

    let datapointQuery = {
      clientTaxonomyId: body.clientTaxonomyId,
      categoryId: taskDetails.categoryId._id,
      dataCollection: "Yes",
      functionId: { "$ne": negativeNews.id },
      status:true

    }

    if (body.skipValidation) {
      datapointQuery.isRequiredForReps = true
    }

    // Getting all datapoint belonging to a particular category
    let [standaloneDatapoints, boardMatrixDatapoints, kmpMatrixDatapoints] = await Promise.all([
      Datapoints.find({ ...datapointQuery, dpType: STANDALONE }),
      Datapoints.find({ ...datapointQuery, dpType: BOARD_MATRIX }),
      Datapoints.find({ ...datapointQuery, dpType: KMP_MATRIX }),
    ]);

    const isSFDR = taskDetails.companyId.clientTaxonomyId?.isDerivedCalculationRequired ? false : true;

    // Comment the purpose.
    const errorMessageForBM = checkIfAllDpCodeAreFilled(boardMatrixDatapoints, allBoardMemberMatrixDetails, BOARD_MATRIX);
    const errorMessageForKM = checkIfAllDpCodeAreFilled(kmpMatrixDatapoints, allKmpMatrixDetails, KMP_MATRIX);

    if (Object.keys(errorMessageForBM)?.length !== 0) {
      return res.status(409).json(errorMessageForBM);
    }

    if (Object.keys(errorMessageForKM)?.length !== 0) {
      return res.status(409).json(errorMessageForKM);
    }

    // mergedDetails is the Dp codes of all Dp Types.
    let [hasError, hasCorrection, isCorrectionStatusIncomplete] = [
      mergedDetails.find(object => object.hasError == true),
      mergedDetails.find(object => object.hasCorrection == true),
      mergedDetails.find(object => object.correctionStatus == Incomplete)];

    // Compare the totalDatapoint * collected year == totalDatapointsCollectedCount
    const expectedDataCount = await getTotalMultipliedValues(standaloneDatapoints, boardMatrixDatapoints, kmpMatrixDatapoints, distinctBMMembers, distinctKmpMembers, distinctYears, isSFDR, fiscalYearEndMonth, fiscalYearEndDate);

    const condition = body.role == ClientRepresentative || body.role == CompanyRepresentative
      ? totalDatapointsCollectedCount >= expectedDataCount :
      totalDatapointsCollectedCount >= expectedDataCount && !isCorrectionStatusIncomplete

    const { message, taskStatusValue } = await conditionalResult(body, hasError, hasCorrection, condition);

    if (message !== '') {
      return res.status(409).json({
        status: 409,
        message
      });
    }

    // Creating Record for Task History
    await TaskHistories.create({
      taskId: body.taskId,
      companyId: taskDetails.companyId.id,
      categoryId: taskDetails.categoryId.id,
      submittedByName: user.name,
      submittedById: user?.id,
      stage: taskStatusValue,
      comment: '',
      status: true,
      createdBy: user
    }).then((user) => console.log('done'))
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to create task history!" });
      });

    // * Code to send email to CompanyRep/ClientRep who raised error, about the action taken by QA. -Ticket ECS-600

    //  check if the body.role is QA and taskHistory has Reassignment Pending then email to all company and client rep of this particular task.

    const getTaskHistory = await TaskHistories.findOne({ taskId: body.taskId, status: true, stage: ReassignmentPending });

    if (getTaskHistory && body.role == QA) {
      // Send Email to Client or Company Rep.
      const companyDetails = await getCompanyDetails(body.companyId);
      const emailDetails = RepEmail(companyDetails?.companyName, taskDetails?.categoryId.categoryName, taskDetails?.year);
      companyDetails?.email.map(async (e) => {
        const subject = `Error Updated for task ${taskDetails.taskNumber}`
        if (process.env.NODE_ENV === 'production') {
          await sendEmail(e, subject, emailDetails?.message)
            .then((resp) => { console.log('Mail sent!') })
            .catch(err => console.log(err))
        }
      })
    }
    // * taskStatusValue = 'Reassignment Pending' Testing Purpose.
    if (taskStatusValue == 'Reassignment Pending') {
      const query = {
        notificationType: "/tasklist",
        content: "Reassign the task for Analyst as it has some errors TaskID - " + `${taskDetails.taskNumber}, CompanyName - ${taskDetails.companyId.companyName}`,
        notificationTitle: "Reassignment Pending",
        status: true,
        isRead: false
      }
      // creating notiification for groupAdmin
      await Notifications.create({
        notifyToUser: taskDetails.groupId.groupAdmin,
        ...query
      }).catch((error) => {
        return res.status(500).json({
          status: "500",
          message: error.message ? error.message : "Failed to sent notification!"
        });
      });

      const adminRoleIds = await Role.find({
        roleName: { $in: adminRoles },
        status: true
      }).distinct('_id');

      const allAdminUserIds = await User.find({
        $or: [{ "roleDetails.roles": { $in: adminRoleIds } }, {
          "roleDetails.primaryRole": { $in: adminRoleIds }
        }],
        status: true
      })
        .distinct('_id');
      // creating notiification for Admin and SuperAdmin
      for (let admIndex = 0; admIndex < allAdminUserIds.length; admIndex++) {
        await Notifications.create({
          notifyToUser: allAdminUserIds[admIndex],
          ...query
        }).catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to sent notification!" });
        });
      }
    }

    const [categoriesLength, taskDetailsObject] = await Promise.all([
      Categories.count({
        clientTaxonomyId: body.clientTaxonomyId,
        status: true,
      }),
      TaskAssignment.count({
        companyId: body.companyId,
        year: body.year,
        taskStatus: { $in: [VerificationCompleted, Completed] }
      })
    ]);

    // All the task for a particular category is completed.
    if (categoriesLength == taskDetailsObject) {
      await CompaniesTasks.updateMany(
        {
          companyId: body.companyId,
          year: body.year
        },
        {
          $set: {
            overAllCompanyTaskStatus: true,
            completedDate: Date.now()
          },
        }
      );
      // Send Email to Client or Company Rep.
      const companyDetails = await getCompanyDetails(body.companyId)
      const emailDetails = getEmailForJsonGeneration(companyDetails?.companyName, body?.year);
      companyDetails?.email.map(async (e) => {
        const subject = `${companyDetails?.companyName},  data uploaded on ESGDS InfinData Platform`
        if (process.env.NODE_ENV === 'production') {
          await sendEmail(e, subject, emailDetails)
            .then((resp) => { console.log('Mail sent!') })
            .catch(err => console.log(err))
        }
      })

    }
    return res.status(200).json({
      message: "Company Status update succesfully!",
    });

  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message ? error.message : "Failed to update task status",
    });
  }
};

export const reports = async ({ user, params }, res, next) => {
  try {
    let completeUserDetail = await User.findOne({
      _id: user.id,
      isUserActive: true
    })
      .populate({
        path: "roleDetails.roles",
      })
      .populate({
        path: "roleDetails.primaryRole",
      })
      .catch((error) => {
        return res.status(500).json({
          status: "500",
          message: error.message,
        });
      });
    let userRoles = [];
    if (completeUserDetail && completeUserDetail.roleDetails) {
      if (completeUserDetail.roleDetails.primaryRole) {
        userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
        if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
          for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
            if (completeUserDetail.roleDetails.roles[index]) {
              userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
            }
          }
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "User role not found!",
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
    userRoles = _.uniq(userRoles);
    let findQuery = {};
    if (userRoles.includes("SuperAdmin") || userRoles.includes("Admin")) {
      findQuery = { status: true };
      if (params.role == "GroupAdmin") {
        let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
        findQuery = { groupId: { $in: groupIds }, status: true };
      } else if (params.role == "SuperAdmin" || params.role == "Admin") {
        findQuery = { status: true };
      } else {
        return res.status(400).json({ completed: [], pending: [], controversy: [] });
      }
    } else if (userRoles.includes("GroupAdmin")) {
      let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
      findQuery = { groupId: { $in: groupIds }, status: true };
      if (params.role == "GroupAdmin") {
        let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
        findQuery = { groupId: { $in: groupIds }, status: true };
      } else if (params.role == "SuperAdmin" || params.role == "Admin") {
        findQuery = { status: true };
      } else {
        return res.status(200).json({ status: "200", completed: [], pending: [], controversy: [] });
      }
    } else {
      return res.status(200).json({ status: "200", completed: [], pending: [], controversy: [] });
    }
    var allTasks = await TaskAssignment.find(findQuery).populate('companyId').populate('categoryId');
    var completedTask = [];
    var pendingTask = [];
    for (var i = 0; i < allTasks.length; i++) {
      let clientRepNamesList = [], companyRepNamesList = [];
      let clientRepNames = "", companyRepNames = "";
      if (allTasks[i].companyId) {
        var companyRep = await CompanyRepresentatives.find({ companiesList: { $in: [allTasks[i].companyId.id] } }).populate('userId');
        if (companyRep && companyRep.length > 0) {
          for (let cmpIndex = 0; cmpIndex < companyRep.length; cmpIndex++) {
            if (companyRep[cmpIndex] && companyRep[cmpIndex].userId && companyRep[cmpIndex].userId.name) {
              companyRepNamesList.push(companyRep[cmpIndex].userId.name);
            }
          }
          companyRepNames = companyRepNamesList.join();
        }
        var clientRep = await ClientRepresentatives.find({ companiesList: { $in: [allTasks[i].companyId.id] } }).populate('userId');
        if (clientRep && clientRep.length > 0) {
          for (let clnIndex = 0; clnIndex < clientRep.length; clnIndex++) {
            if (clientRep[clnIndex] && clientRep[clnIndex].userId && clientRep[clnIndex].userId.name) {
              clientRepNamesList.push(clientRep[clnIndex].userId.name);
            }
          }
          clientRepNames = clientRepNamesList.join();
        }
        var companyTask = await CompaniesTasks.findOne({ companyId: allTasks[i].companyId.id }).populate('companyId');
      }
      console.log('HEre is the error')
      if (allTasks[i].categoryId) {
        var categoryWithClientTaxonomy = await Categories.findById(allTasks[i].categoryId.id).populate('clientTaxonomyId');
      }
      var obj = {
        taxonomy: categoryWithClientTaxonomy && categoryWithClientTaxonomy.clientTaxonomyId ? categoryWithClientTaxonomy.clientTaxonomyId.taxonomyName : null,
        companyName: allTasks[i].companyId ? allTasks[i].companyId.companyName : null,
        companyRepresentative: companyRepNames,
        clientRrepresentative: clientRepNames,
        isChecked: false,
        companyId: allTasks[i].companyId ? allTasks[i].companyId.id : null,
      }
      if (companyTask && companyTask.overAllCompanyTaskStatus) {
        obj.completedDate = companyTask ? companyTask.completedDate : null;
      } else {
        obj.allocatedDate = companyTask ? companyTask.createdAt : null;
      }
      if (companyTask && companyTask.overAllCompanyTaskStatus) {
        completedTask.push(obj)
      } else {
        pendingTask.push(obj)
      }
    }
    var controversyTask = await ControversyTasks.find({ status: true }).populate('companyId').populate('analystId');
    var controversy = [];
    for (var i = 0; i < controversyTask.length; i++) {
      if (controversyTask[i].companyId) {
        var taxonomy = Companies.findById(controversyTask[i].companyId).populate('clientTaxonomyId');
      }
      var obj = {
        taxonomy: taxonomy && taxonomy.clientTaxonomyId ? taxonomy.clientTaxonomyId.taxonomyName : null,
        companyId: controversyTask[i].companyId ? controversyTask[i].companyId.id : null,
        companyName: controversyTask[i].companyId ? controversyTask[i].companyId.companyName : null,
        allocatedDate: controversyTask[i].createdAt,
        taskId: controversyTask[i].taskNumber ? controversyTask[i].taskNumber : null,
        isChecked: false,
        id: controversyTask[i].id
      }
      controversy.push(obj);
    }
    completedTask = _.uniqBy(completedTask, function (e) {
      return e.companyId;
    })
    pendingTask = _.uniqBy(pendingTask, function (e) {
      return e.companyId;
    })
    completedTask = _.sortBy(completedTask, 'companyName');
    pendingTask = _.sortBy(pendingTask, 'companyName');
    controversy = _.sortBy(controversy, 'companyName');
    return res.status(200).json({ completed: completedTask, pending: pendingTask, controversy });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the reports!" })
  }
}

export const taskReports = async ({ user, params, querymen: { query, select, cursor } }, res, next) => {
  try {
    let completeUserDetail = await User.findOne({
      _id: user.id,
      isUserActive: true
    })
      .populate({
        path: "roleDetails.roles",
      })
      .populate({
        path: "roleDetails.primaryRole",
      })
      .catch((error) => {
        return res.status(500).json({
          status: "500",
          message: error.message,
        });
      });
    let userRoles = [];
    if (completeUserDetail && completeUserDetail.roleDetails) {
      if (completeUserDetail.roleDetails.primaryRole) {
        userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
        if (completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0) {
          for (let index = 0; index < completeUserDetail.roleDetails.roles.length; index++) {
            if (completeUserDetail.roleDetails.roles[index]) {
              userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
            }
          }
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "User role not found!",
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
    userRoles = _.uniq(userRoles);
    let findQuery = {};
    if (userRoles.includes("SuperAdmin") || userRoles.includes("Admin")) {
      if (params.role == "GroupAdmin") {
        let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
        let groupTaskCompanyIds = await TaskAssignment.find({ groupId: { $in: groupIds } }).distinct('companyId');
        if (params.taskStatus == 'Pending') {
          findQuery = { companyId: { $in: groupTaskCompanyIds }, overAllCompanyTaskStatus: false, status: true };
        } else if (params.taskStatus == 'Completed') {
          findQuery = { companyId: { $in: groupTaskCompanyIds }, overAllCompanyTaskStatus: true, status: true };
        } else if (params.taskStatus == 'Controversy') {
          findQuery = { status: true };
        } else {
          return res.status(200).json({ status: "200", count: 0, rows: [] });
        }
      } else if (params.role == "SuperAdmin" || params.role == "Admin") {
        if (params.taskStatus == 'Pending') {
          findQuery = { overAllCompanyTaskStatus: false, status: true };
        } else if (params.taskStatus == 'Completed') {
          findQuery = { overAllCompanyTaskStatus: true, status: true };
        } else if (params.taskStatus == 'Controversy') {
          findQuery = { status: true };
        } else {
          return res.status(200).json({ status: "200", count: 0, rows: [] });
        }
      } else {
        return res.status(200).json({ status: "200", count: 0, rows: [] });
      }
    } else if (userRoles.includes("GroupAdmin")) {
      if (params.role == "GroupAdmin") {
        let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('_id');
        let groupTaskCompanyIds = await TaskAssignment.find({ groupId: { $in: groupIds } }).distinct('companyId');
        if (params.taskStatus == 'Pending') {
          findQuery = { companyId: { $in: groupTaskCompanyIds }, overAllCompanyTaskStatus: false, status: true };
        } else if (params.taskStatus == 'Completed') {
          findQuery = { companyId: { $in: groupTaskCompanyIds }, overAllCompanyTaskStatus: true, status: true };
        } else if (params.taskStatus == 'Controversy') {
          findQuery = { status: true };
        } else {
          return res.status(200).json({ status: "200", count: 0, rows: [] });
        }
      } else if (params.role == "SuperAdmin" || params.role == "Admin") {
        if (params.taskStatus == 'Pending') {
          findQuery = { overAllCompanyTaskStatus: false, status: true };
        } else if (params.taskStatus == 'Completed') {
          findQuery = { overAllCompanyTaskStatus: true, status: true };
        } else if (params.taskStatus == 'Controversy') {
          findQuery = { status: true };
        } else {
          return res.status(200).json({ status: "200", count: 0, rows: [] });
        }
      } else {
        return res.status(200).json({ status: "200", count: 0, rows: [] });
      }
    } else {
      return res.status(200).json({ status: "200", count: 0, rows: [] });
    }
    if (params.taskStatus == "Pending" || params.taskStatus == "Completed") {
      let companiesTasks = await CompaniesTasks.aggregate([
        { "$match": findQuery },
        { "$group": { _id: "$companyId", count: { $sum: 1 } } },
        { "$sort": { _id: 1 } },
        { "$skip": cursor.skip },
        { "$limit": cursor.limit }
      ]);
      let completedTask = await CompaniesTasks.find({ overAllCompanyTaskStatus: true }).distinct('companyId');
      let taskList = [];
      for (let dtIndex = 0; dtIndex < companiesTasks.length; dtIndex++) {
        let clientRepNamesList = [], companyRepNamesList = [];
        let clientRepNames = "", companyRepNames = "";
        if (companiesTasks[dtIndex]._id) {
          var companyRep = await CompanyRepresentatives.find({ companiesList: { $in: [companiesTasks[dtIndex]._id] } }).populate('userId');
          if (companyRep && companyRep.length > 0) {
            for (let cmpIndex = 0; cmpIndex < companyRep.length; cmpIndex++) {
              if (companyRep[cmpIndex] && companyRep[cmpIndex].userId && companyRep[cmpIndex].userId.name) {
                companyRepNamesList.push(companyRep[cmpIndex].userId.name);
              }
            }
            companyRepNames = companyRepNamesList.join();
          }
          var clientRep = await ClientRepresentatives.find({ companiesList: { $in: [companiesTasks[dtIndex]._id] } }).populate('userId');
          if (clientRep && clientRep.length > 0) {
            for (let clnIndex = 0; clnIndex < clientRep.length; clnIndex++) {
              if (clientRep[clnIndex] && clientRep[clnIndex].userId && clientRep[clnIndex].userId.name) {
                clientRepNamesList.push(clientRep[clnIndex].userId.name);
              }
            }
            clientRepNames = clientRepNamesList.join();
          }
          var companyTask = await CompaniesTasks.findOne({ companyId: companiesTasks[dtIndex]._id }).populate({ path: 'companyId', populate: { path: 'clientTaxonomyId' } });
        }
        var obj = {
          taxonomy: companyTask.companyId && companyTask.companyId.clientTaxonomyId ? companyTask.companyId.clientTaxonomyId.taxonomyName : null,
          companyName: companyTask.companyId ? companyTask.companyId.companyName : null,
          companyRepresentative: companyRepNames,
          clientRrepresentative: clientRepNames,
          isChecked: false,
          companyId: companyTask.companyId ? companyTask.companyId.id : null,
        }
        if (companyTask && companyTask.overAllCompanyTaskStatus) {
          obj.completedDate = companyTask ? companyTask.completedDate : null;
        } else {
          obj.allocatedDate = companyTask ? companyTask.createdAt : null;
        }
        taskList.push(obj);
      }
      return res.json({ count: completedTask.length, rows: taskList });
    } else if (params.taskStatus == "Controversy") {
      let controversyTasks = await ControversyTasks.find({ status: true }).distinct('companyId');
      var controversyTask = await ControversyTasks.find({ status: true }, select, cursor).populate({ path: 'companyId', populate: { path: 'clientTaxonomyId' } }).populate('analystId');
      var controversy = [];
      for (var i = 0; i < controversyTask.length; i++) {
        var obj = {
          taxonomy: controversyTask[i].companyId && controversyTask[i].companyId.clientTaxonomyId ? controversyTask[i].companyId.clientTaxonomyId.taxonomyName : null,
          companyId: controversyTask[i].companyId ? controversyTask[i].companyId.id : null,
          companyName: controversyTask[i].companyId ? controversyTask[i].companyId.companyName : null,
          allocatedDate: controversyTask[i].createdAt,
          taskId: controversyTask[i].taskNumber ? controversyTask[i].taskNumber : null,
          isChecked: false,
          id: controversyTask[i].id
        }
        controversy.push(obj);
      }
      return res.json({ status: "200", count: controversyTasks.length, rows: controversy });
    } else {
      return res.status(200).json({ status: "200", count: 0, rows: [] });
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the task reports!" })
  }
}

export const getTaskList = async ({ user, bodymen: { body } }, res, next) => {
  try {
    var result = [];
    for (var index = 0; index < body.companyTaskReports.length; index++) {
      var allTasks = await TaskAssignment.find({
        companyId: body.companyTaskReports[index]
      }).populate('companyId').populate('categoryId').populate('groupId').populate('analystId').populate('qaId').populate('batchId');
      for (var i = 0; i < allTasks.length; i++) {
        if (allTasks[i].companyId) {
          var companyTask = await CompaniesTasks.findOne({ companyId: allTasks[i].companyId.id }).populate('companyId');
        }
        var analystTaskLog = TaskSlaLog.find({ taskId: allTasks[i].id, requestedBy: 'Analyst' });
        var qaLog = TaskSlaLog.find({ taskId: allTasks[i].id, requestedBy: 'QA' });
        var obj = {
          companyName: allTasks[i].companyId ? allTasks[i].companyId.companyName : null,
          taskid: allTasks[i].taskNumber,
          group: allTasks[i].groupId ? allTasks[i].groupId.groupName : null,
          batch: allTasks[i].batchId ? allTasks[i].batchId.batchName : null,
          pillar: allTasks[i].categoryId ? allTasks[i].categoryId.categoryName : null,
          analyst: allTasks[i].analystId ? allTasks[i].analystId.name : null,
          analystSla: allTasks[i].analystSLADate ? allTasks[i].analystSLADate : null,
          qa: allTasks[i].qaId ? allTasks[i].qaId.name : null,
          qaSla: allTasks[i].qaSLADate ? allTasks[i].qaSLADate : null,
          analystStatus: analystTaskLog && analystTaskLog.length > 0 ? "Breached" : "OnTrack",
          qaStatus: qaLog && qaLog.length > 0 ? "Breached" : "OnTrack",
          stage: allTasks[i].taskStatus ? allTasks[i].taskStatus : null
        }
        if (companyTask && !companyTask.overAllCompanyTaskStatus) {
          obj.stage = allTasks[i].taskStatus ? allTasks[i].taskStatus : null;
        }
        let currentDate = new Date();
        let qaSLADate = allTasks[i].qaSLADate ? allTasks[i].qaSLADate : null;
        if (allTasks[i].taskStatus == 'Completed' || allTasks[i].taskStatus == 'Verification Completed') {
          let completedDate = allTasks[i].updatedAt;
          if (currentDate <= qaSLADate) {
            obj.status = "Met";
          } else {
            obj.status = "Not Met";
          }
        } else if (allTasks[i].taskStatus != 'Completed' && allTasks[i].taskStatus != 'Verification Completed' && qaSLADate && (currentDate <= qaSLADate)) {
          obj.status = "OnTrack";
        } else if (allTasks[i].taskStatus != 'Completed' && allTasks[i].taskStatus != 'Verification Completed' && qaSLADate && (currentDate > qaSLADate)) {
          obj.status = "Not Met";
        } else {
          obj.status = "NA";
        }
        // if (obj.analystStatus === 'Breached' || obj.qaStatus === 'Breached') {
        //   obj.status = "Breached";
        // } else {
        //   if (companyTask && companyTask.overAllCompanyTaskStatus) {
        //     obj.status = 'Completed';
        //   } else {
        //     obj.status = 'OnTrack'
        //   }
        // }
        result.push(obj);
      }
    }
    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the task list" })
  }
}

export const getTaskListPageData = async ({ user, querymen: { query, select, cursor }, bodymen: { body } }, res, next) => {
  try {
    var result = [];
    var count = await TaskAssignment.count({ companyId: { $in: body.companyTaskReports }, status: true });
    var allTasks = await TaskAssignment.find({
      companyId: { $in: body.companyTaskReports },
      status: true
    }, select, cursor).populate('companyId').populate('categoryId').populate('groupId').populate('analystId').populate('qaId').populate('batchId');
    for (var i = 0; i < allTasks.length; i++) {
      if (allTasks[i].companyId) {
        var companyTask = await CompaniesTasks.findOne({ companyId: allTasks[i].companyId.id }).populate('companyId');
      }
      var analystTaskLog = TaskSlaLog.find({ taskId: allTasks[i].id, requestedBy: 'Analyst' });
      var qaLog = TaskSlaLog.find({ taskId: allTasks[i].id, requestedBy: 'QA' });
      var obj = {
        companyName: allTasks[i].companyId ? allTasks[i].companyId.companyName : null,
        taskid: allTasks[i].taskNumber,
        group: allTasks[i].groupId ? allTasks[i].groupId.groupName : null,
        batch: allTasks[i].batchId ? allTasks[i].batchId.batchName : null,
        pillar: allTasks[i].categoryId ? allTasks[i].categoryId.categoryName : null,
        analyst: allTasks[i].analystId ? allTasks[i].analystId.name : null,
        analystSla: allTasks[i].analystSLADate ? allTasks[i].analystSLADate : null,
        qa: allTasks[i].qaId ? allTasks[i].qaId.name : null,
        qaSla: allTasks[i].qaSLADate ? allTasks[i].qaSLADate : null,
        analystStatus: analystTaskLog && analystTaskLog.length > 0 ? "Breached" : "OnTrack",
        qaStatus: qaLog && qaLog.length > 0 ? "Breached" : "OnTrack",
        stage: allTasks[i].taskStatus ? allTasks[i].taskStatus : null
      }
      if (companyTask && !companyTask.overAllCompanyTaskStatus) {
        obj.stage = allTasks[i].taskStatus ? allTasks[i].taskStatus : null;
      }
      let currentDate = new Date();
      let qaSLADate = allTasks[i].qaSLADate ? allTasks[i].qaSLADate : null;
      if (allTasks[i].taskStatus == 'Completed' || allTasks[i].taskStatus == 'Verification Completed') {
        if (currentDate <= qaSLADate) {
          obj.status = "Met";
        } else {
          obj.status = "Not Met";
        }
      } else if (allTasks[i].taskStatus != 'Completed' && allTasks[i].taskStatus != 'Verification Completed' && qaSLADate && (currentDate <= qaSLADate)) {
        obj.status = "OnTrack";
      } else if (allTasks[i].taskStatus != 'Completed' && allTasks[i].taskStatus != 'Verification Completed' && qaSLADate && (currentDate > qaSLADate)) {
        obj.status = "Not Met";
      } else {
        obj.status = "NA";
      }
      result.push(obj);
    }
    return res.status(200).json({ data: result, count: count });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve the task list page data" })
  }
}

export const controversyReports = async ({ user, params }, res, next) => {
  try {
    var controversyTask = await ControversyTasks.find({ status: true }).populate('companyId').populate('analystId');
    var controversy = [];
    for (var i = 0; i < controversyTask.length; i++) {
      if (controversyTask[i].companyId) {
        var taxonomy = Companies.findById(controversyTask[i].companyId).populate('clientTaxonomyId');
      }
      var obj = {
        taxonomy: taxonomy && taxonomy.clientTaxonomyId ? taxonomy.clientTaxonomyId.taxonomyName : null,
        companyId: controversyTask[i].companyId ? controversyTask[i].companyId.id : null,
        companyName: controversyTask[i].companyId ? controversyTask[i].companyId.companyName : null,
        allocatedDate: controversyTask[i].createdAt,
        taskId: controversyTask[i].taskNumber ? controversyTask[i].taskNumber : null,
        isChecked: false,
        id: controversyTask[i].id
      }
      controversy.push(obj);
    }
    return res.status(200).json({ controversy: controversy });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retieve the controversy reports" })
  }
}

export const getTaskListForControversy = async ({ user, bodymen: { body } }, res, next) => {
  try {
    var result = [];
    var controversyTask = await Controversy.find({ taskId: { $in: body.controversyTaskReports }, isActive: true, status: true }).
      populate('companyId').populate({
        path: "taskId",
        populate: {
          path: "analystId"
        }
      });
    if (controversyTask && Object.keys(controversyTask).length > 0) {
      for (let index = 0; index < controversyTask.length; index++) {
        var obj = {
          "companyName": controversyTask[index].companyId ? controversyTask[index].companyId.companyName : null,
          "controversyId": controversyTask[index].controversyNumber ? controversyTask[index].controversyNumber : null,
          "analyst": controversyTask[index].taskId.analystId ? controversyTask[index].taskId.analystId.name : null,
          "createdDate": controversyTask[index].createdAt,
        }
        result.push(obj);
      }
    }
    return res.status(200).json({ controversyTaskList: result });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retieve the task list for controversy" })
  }
}




    // if (taskDetails.isReassigned && body.role == QA) { // as QA is making an update hence, checking if it was reassigned before.
    //   const taskhistoryDetails = await TaskHistories.findOne({ taskId: body.taskId, status: true }); //companyName
    //   if (taskhistoryDetails) {
    //     const [cmpDetail, errorSubmittedBy] = await Promise.all([
    //       Companies.findOne({ _id: body.companyId }),
    //       User.findOne({ _id: taskhistoryDetails?.submittedById }) // remove field submittedById
    //     ])

    //     const content = `Hi,
    //   There has been an update for the error you had raised for company ${cmpDetail?.companyName}
    //   with comment ${taskhistoryDetails.comment}
    //   ThanksESGDS Team`

    //     // send email to all the reps.
    //     await sendEmail(errorSubmittedBy?.email, 'ESG - Onboarding', content)
    //       .then((resp) => { console.log('Mail sent!') });
    //   }
    // }

    // ----//