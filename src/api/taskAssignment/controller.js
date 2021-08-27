import { success, notFound, authorOrAdmin } from "../../services/response/";
import { TaskAssignment } from ".";
import { User } from "../user";
import { Role } from "../role";
import { Group } from "../group";
import { Categories } from "../categories";
import { Batches } from "../batches";
import { CompanyRepresentatives } from "../company-representatives";
import { ClientRepresentatives } from "../client-representatives";
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
import _ from 'lodash'

export const create = async ({ user, bodymen: { body } }, res, next) => {
  await TaskAssignment.findOne({ status: true })
    .sort({ createdAt: -1 })
    .limit(1)
    .then(async (taskObject) => {
      console.log("taskObject", taskObject);
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
  console.log("in create task", typeof body.year);
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
  var taskArray = [];
  for (let index = 0; index < body.company.length; index++) {
    taskObject.companyId = body.company[index].id;
    taskObject.taskNumber = "DT1";
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
            if (taskAssignment.year) {
              let years = taskAssignment.year.split(',');
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
                    taskArray.push(taskAssignment.view(true));
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
                  taskArray.push(taskAssignment.view(true));
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
    data: taskArray,
  });
};

export const getQaAndAnalystFromGrp = async (
  { user, bodymen: { body } },
  res,
  next
) => {
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
  var qa = [],
    analyst = [];
  for (
    let index = 0;
    index < allGrpsWithAssignedQAMembers.assignedMembers.length;
    index++
  ) {
    if (
      (allGrpsWithAssignedQAMembers.assignedMembers[
        index
      ].roleDetails.hasOwnProperty("primaryRole") &&
        allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails
          .primaryRole === qaRoleDetails._id) ||
      (allGrpsWithAssignedQAMembers.assignedMembers[
        index
      ].roleDetails.hasOwnProperty("roles") &&
        allGrpsWithAssignedQAMembers.assignedMembers[
          index
        ].roleDetails.roles.indexOf(qaRoleDetails._id) > -1)
    ) {
      qa.push({
        value: allGrpsWithAssignedQAMembers.assignedMembers[index].id,
        label: allGrpsWithAssignedQAMembers.assignedMembers[index].name,
      });
    }
    if (
      (allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails
        .primaryRole &&
        allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails
          .primaryRole === analystRoleDetails._id) ||
      (allGrpsWithAssignedQAMembers.assignedMembers[index].roleDetails.roles &&
        allGrpsWithAssignedQAMembers.assignedMembers[
          index
        ].roleDetails.roles.indexOf(analystRoleDetails._id) > -1)
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

export const index = async({ user, querymen: { query, select, cursor } }, res, next) => {
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isUserActive: true
  }) .populate({ path: "roleDetails.roles" }) .populate({ path: "roleDetails.primaryRole" })
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
      if ( completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0 ) {
        for ( let index = 0; index < completeUserDetail.roleDetails.roles.length; index++ ) {
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
    groupAdminTaskList : {
      pendingList: [],
      completedList: [],
      controversyList: []
    },
    adminTaskList : {
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
        findQuery = { status : true };
      } else if (userRoles[roleIndex] == "GroupAdmin"){
        let groupIds = await Group.find({ groupAdmin: user.id, status: true }).distinct('id');
        findQuery = { 
          groupId: { $in: groupIds },
          status : true 
        };
      }
      await TaskAssignment.find(findQuery)
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
                finalResponseObject.adminTaskList.pendingList.push(taskObject)
              } else if (object.taskStatus == "Completed"){
                finalResponseObject.adminTaskList.completedList.push(taskObject)
              }
            } else if (userRoles[roleIndex] == "GroupAdmin"){
              if (object.taskStatus != "Completed") {
                finalResponseObject.groupAdminTaskList.pendingList.push(taskObject)
              } else if (object.taskStatus == "Completed"){
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
    await ControversyTasks.find({ status: true })
    .populate('companyId')
    .populate('analystId')
    .populate('createdBy')
    .then((controversyTasks) => {
      if (controversyTasks && controversyTasks.length > 0) {
        for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
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
    return res.status(200).json({
      status: "200",
      message: "Tasks retrieved successfully!",
      data: finalResponseObject,
    });
  }
};

export const getMyTasks = async (
  { user, querymen: { query, select, cursor } },
  res,
  next
) => {
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
    controversyTaskList = [];
  let userRoles = [];
  if (completeUserDetail && completeUserDetail.roleDetails) {
    if (completeUserDetail.roleDetails.primaryRole) {
      userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
      if (
        completeUserDetail.roleDetails.roles &&
        completeUserDetail.roleDetails.roles.length > 0
      ) {
        for (
          let index = 0;
          index < completeUserDetail.roleDetails.roles.length;
          index++
        ) {
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
          taskStatus: "Yet to work",
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
          let categoryValidationRules = await Validations.find({categoryId: object.categoryId.id})
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
      .then((controversyTasks) => {
        if (controversyTasks && controversyTasks.length > 0) {
          for (let cIndex = 0; cIndex < controversyTasks.length; cIndex++) {
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
            if (controversyTasks[cIndex] && object) {
              controversyTaskList.push(object);
            }
          }
        }
      });
  }
  console.log('userRoles', userRoles);
  if (userRoles.includes("Client Representative")) {
    let clientRepDetail = await ClientRepresentatives.findOne({
      userId: completeUserDetail.id,
      status: true,
    });
    if (clientRepDetail && clientRepDetail.CompanyName) {
      await TaskAssignment.find({
        companyId: clientRepDetail.CompanyName,
        taskStatus: "Verification Completed",
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
    }
  }

  if (userRoles.includes("Company Representative")) {
    let companyRepDetail = await CompanyRepresentatives.findOne({
      userId: completeUserDetail.id,
      status: true,
    });
    if (companyRepDetail && companyRepDetail.companiesList.length > 0) {
      await TaskAssignment.find({
        companyId: {
          $in: companyRepDetail.companiesList,
        },
        taskStatus: "Verification Completed",
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
    }
  }
  let data = {
    analystCollectionTaskList: analystCollectionTaskList
      ? analystCollectionTaskList
      : [],
    analystCorrectionTaskList: analystCorrectionTaskList
      ? analystCorrectionTaskList
      : [],
    qaTaskList: qaTaskList ? qaTaskList : [],
    clientRepTaskList: clientRepTaskList ? clientRepTaskList : [],
    companyRepTaskList: companyRepTaskList ? companyRepTaskList : [],
    controversyTaskList: controversyTaskList ? controversyTaskList : [],
  };
  return res.status(200).json({
    status: "200",
    message: "Task retrieved succesfully!",
    data: data,
  });

  // if (user.roleDetails) {
  //   findQuery = { status: true, $or: [{ analystId: user.id }, { qaId: user.id }] };
  // }
  // let findQuery = { status: true, $or: [{ analystId: user.id }, { qaId: user.id }] };
  // TaskAssignment.find(findQuery)
  //   .sort({ createdAt: -1 })
  //   .populate('createdBy')
  //   .populate('companyId')
  //   .populate('categoryId')
  //   .populate('batchId')
  //   .populate('analystId')
  //   .populate('qaId')
  //   .then((taskAssignments) => {
  //     let taskList = [];
  //     for (let index = 0; index < taskAssignments.length; index++) {
  //       const object = taskAssignments[index];
  //       let taskObject = {
  //         taskId: object.id,
  //         taskNumber: object.taskNumber,
  //         pillar: object.categoryId ? object.categoryId.categoryName : null,
  //         pillarId: object.categoryId ? object.categoryId.id : null,
  //         batch: object.batchId ? object.batchId.batchName : null,
  //         batchId: object.batchId ? object.batchId.id : null,
  //         company: object.companyId ? object.companyId.companyName : null,
  //         companyId: object.companyId ? object.companyId.id : null,
  //         analyst: object.analystId ? object.analystId.name : null,
  //         analystId: object.analystId ? object.analystId.id : null,
  //         qa: object.qaId ? object.qaId.name : null,
  //         qaId: object.qaId ? object.qaId.id : null,
  //         fiscalYear: object.year,
  //         taskStatus: object.taskStatus,
  //         createdBy: object.createdBy ? object.createdBy.name : null,
  //         createdById: object.createdBy ? object.createdBy.id : null,
  //       };
  //       taskList.push(taskObject);
  //     }
  //     return res.status(200).json({
  //       status: "200", message: "Tasks retrieved successfully!", data: {
  //         count: taskList.length,
  //         rows: taskList
  //       }
  //     })
  //   })
  //   .catch((error) => {
  //     return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
  //   })
};

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


export const updateSlaDates = async({ user, bodymen: { body }, params }, res, next) => {
  await TaskAssignment.findById(body.taskId).populate('companyId').populate('categoryId')
  .then(async(result) => {
    if(result.taskStatus == "Reassignment Pending"){
      body.taskDetails['taskStatus'] = "Correction Pending";
    }
    await TaskAssignment.updateOne({ _id: body.taskId }, { $set: body.taskDetails }).then( async(updatedRecord) => {
      if(result.taskStatus == "Reassignment Pending"){
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
        }).catch((error) =>{
          return res.status(500).json({status: "500", message: error.message ? error.message : "Failed to create task history!"});    
        });
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
  });
}

export const destroy = ({ user, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, "createdBy"))
    .then((taskAssignment) => (taskAssignment ? taskAssignment.remove() : null))
    .then(success(res, 204))
    .catch(next);

export const getGroupAndBatches = async ({ user, params }, res, next) => {
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isUserActive: true
  }) .populate({ path: "roleDetails.roles" }) .populate({ path: "roleDetails.primaryRole" })
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
      if ( completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0 ) {
        for ( let index = 0; index < completeUserDetail.roleDetails.roles.length; index++ ) {
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
    groupAdminList : [],
    adminList : []
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
    console.log('userRoles', userRoles);
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
            for ( let index1 = 0; index1 < group[index].batchList.length; index1++ ) {
              let foundCategories = categories.filter(obj => obj.clientTaxonomyId.id == group[index].batchList[index1].clientTaxonomy );
              var assignedBatches = group[index].batchList.map((rec) => {
                return {
                  batchName: rec.batchName,
                  batchID: rec._id,
                  pillars: foundCategories.map((rec) => {
                    return {
                      value: rec.id,
                      label: rec.categoryName
                    };
                  }),
                  batchYear: rec.years
                };
              });
              resObject.assignedBatches = assignedBatches ? assignedBatches : [];
            }
            if (userRoles[roleIndex] == "GroupAdmin") {
              finalResponseObject.groupAdminList.push(resObject);
            } else if (userRoles[roleIndex] == "SuperAdmin" || userRoles[roleIndex] == "Admin"){
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
};

export const getUsers = async ({ user, bodymen: { body } }, res, next) => {
  console.log("bodymen", body);
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
      var assignedCompanyList = await CompaniesTasks.find({ categoryId: body.categoryId, year: years, companyId: batch.companiesList[index].id }).populate("companyId");
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
      }).populate("primaryPillar").populate("secondaryPillar");
      if (userPillar && Object.keys(userPillar).length > 0) {
        if (userPillar.primaryPillar.id === body.categoryId) {
          qaObject.primaryPillar = true;
          analystObject.primaryPillar = true;
        } else {
          qaObject.primaryPillar = false;
          analystObject.primaryPillar = false;
        }
        console.log('primary', group.assignedMembers[index].roleDetails.primaryRole, qaId.id);
        console.log('primary', typeof group.assignedMembers[index].roleDetails.primaryRole, typeof qaId.id);
        if (qaId && (group.assignedMembers[index].roleDetails.primaryRole == qaId.id)) {
          console.log('in if for qa', qaId.id)
          var activeTaskCount = await TaskAssignment.find({
            qaId: group.assignedMembers[index].id,
            status: true,
            taskStatus: { $ne: "Verification Completed" },
          });
          qaObject.id = group.assignedMembers[index].id;
          qaObject.name = group.assignedMembers[index].name;
          qaObject.primaryRole = true;
          qaObject.activeTaskCount = activeTaskCount.length;
          console.log('qa object', qaObject);
          qa.push(qaObject);
        } else if (qaId && (group.assignedMembers[index].roleDetails.roles.indexOf(qaId.id) > -1)) {
          console.log('in else if for qa', qaId.id)
          var activeTaskCount = await TaskAssignment.find({
            qaId: group.assignedMembers[index].id,
            status: true,
            taskStatus: { $ne: "Verification Completed" },
          });
          qaObject.id = group.assignedMembers[index].id;
          qaObject.name = group.assignedMembers[index].name;
          qaObject.primaryRole = false;
          qaObject.activeTaskCount = activeTaskCount.length;
          console.log('qa object', qaObject);
          qa.push(qaObject);
        }
        if (analystId && (group.assignedMembers[index].roleDetails.primaryRole == analystId.id)) {
          console.log('in if analyst', analystId.id)
          var activeTaskCount = await TaskAssignment.find({
            analystId: group.assignedMembers[index].id,
            status: true,
            taskStatus: {
              $nin: ["Collection Completed", "Correction Completed"],
            },
          });
          analystObject.id = group.assignedMembers[index].id;
          analystObject.name = group.assignedMembers[index].name;
          analystObject.primaryRole = true;
          analystObject.activeTaskCount = activeTaskCount.length;
          console.log('analystObject object', analystObject);
          analyst.push(analystObject);
        } else if (analystId && (group.assignedMembers[index].roleDetails.roles.indexOf(analystId._id) > -1)) {
          console.log('in else if analyst', analystId.id)
          var activeTaskCount = await TaskAssignment.find({
            analystId: group.assignedMembers[index].id,
            status: true,
            taskStatus: {
              $nin: ["Collection Completed", "Correction Completed"],
            },
          });
          analystObject.id = group.assignedMembers[index].id;
          analystObject.name = group.assignedMembers[index].name;
          analystObject.primaryRole = false;
          analystObject.activeTaskCount = activeTaskCount.length;
          console.log('analystObject object', analystObject);
          analyst.push(analystObject);
        }
      }
    }
    resObj["qaData"] = qa;
    resObj["analystData"] = analyst;
    res.status(200).json({ data: resObj });
  }
};

export const updateCompanyStatus = async ( { user, bodymen: { body } }, res, next ) => {
  let taskDetails = await TaskAssignment.findOne({ _id: body.taskId }).populate('categoryId').populate('companyId').populate('groupId');
  let distinctYears = taskDetails.year.split(',');
  try {
    let allStandaloneDetails = await StandaloneDatapoints.find({
    taskId: body.taskId,
    companyId: taskDetails.companyId.id,
    year: {
      "$in": distinctYears
    },
    status: true
  })
  .populate('createdBy')
  .populate('datapointId')
  .populate('companyId')

let allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
    taskId: body.taskId,
    companyId: taskDetails.companyId.id,
    year: {
      "$in": distinctYears
    },
    status: true
  })
  .populate('createdBy')
  .populate('datapointId')
  .populate('companyId')

let allKmpMatrixDetails = await KmpMatrixDataPoints.find({
    taskId: body.taskId,
    companyId: taskDetails.companyId.id,
    year: {
      "$in": distinctYears
    },
    status: true
  })
  .populate('createdBy')
  .populate('datapointId')
  .populate('companyId')
    let taskStatusValue = "";
    let mergedDetails = _.concat(allKmpMatrixDetails,allBoardMemberMatrixDetails,allStandaloneDetails);
    let datapointsLength = await Datapoints.find({clientTaxonomyId: body.clientTaxonomyId, categoryId: taskDetails.categoryId.id, dataCollection: "Yes"});
    let hasError = mergedDetails.find(object => object.hasError == true);
    let hasCorrection = mergedDetails.find(object => object.hasCorrection == true);
    let multipliedValue = datapointsLength.length * distinctYears.length;
    console.log(hasError, multipliedValue,mergedDetails )
    if(mergedDetails.length == multipliedValue && hasError){
      if(body.role == 'QA'){
        taskStatusValue = "Correction Pending";
        await KmpMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: true},{$set: {dpStatus: 'Error', correctionStatus:'Incomplete'}})
        await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: true},{$set: {dpStatus: 'Error', correctionStatus:'Incomplete'}})
        await StandaloneDatapoints.updateMany({taskId: body.taskId, status: true, hasError: true},{$set: {dpStatus: 'Error', correctionStatus:'Incomplete'}})
        
        await KmpMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: false, dpStatus: 'Correction' },{$set: {dpStatus: 'Collection', correctionStatus:'Completed'}})
        await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: false, dpStatus: 'Correction' },{$set: {dpStatus: 'Collection', correctionStatus:'Completed'}})
        await StandaloneDatapoints.updateMany({taskId: body.taskId, status: true, hasError: false, dpStatus: 'Correction' },{$set: {dpStatus: 'Collection', correctionStatus:'Completed'}})
        await TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue}});
      } else{
        taskStatusValue = "Reassignment Pending"; 
        await KmpMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: true},{$set: {dpStatus: 'Error', correctionStatus:'Incomplete'}})
        await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: true},{$set: {dpStatus: 'Error', correctionStatus:'Incomplete'}})
        await StandaloneDatapoints.updateMany({taskId: body.taskId, status: true, hasError: true},{$set: {dpStatus: 'Error', correctionStatus:'Incomplete'}})    
        
        await KmpMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: false, dpStatus: 'Correction' },{$set: {dpStatus: 'Collection', correctionStatus:'Completed'}})
        await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasError: false, dpStatus: 'Correction' },{$set: {dpStatus: 'Collection', correctionStatus:'Completed'}})
        await StandaloneDatapoints.updateMany({taskId: body.taskId, status: true, hasError: false, dpStatus: 'Correction' },{$set: {dpStatus: 'Collection', correctionStatus:'Completed'}})
        await TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue}});
      }
    } else if(mergedDetails.length == multipliedValue && hasCorrection){      
      taskStatusValue = "Correction Completed"; 
      await KmpMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasCorrection: true},{$set: {dpStatus: 'Correction', correctionStatus:'Incomplete'}})
      await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, status: true, hasCorrection: true},{$set: {dpStatus: 'Correction', correctionStatus:'Incomplete'}})
      await StandaloneDatapoints.updateMany({taskId: body.taskId, status: true, hasCorrection: true},{$set: {dpStatus: 'Correction', correctionStatus:'Incomplete'}})
      await TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue}});
    } else if(mergedDetails.length == multipliedValue && hasError == undefined && hasCorrection == undefined){      
      if(body.role == 'QA'){
        taskStatusValue = "Verification Completed";
        await KmpMatrixDataPoints.updateMany({taskId: body.taskId, status: true},{$set: {dpStatus: 'Correction', correctionStatus:'Incomplete'}})
        await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, status: true},{$set: {dpStatus: 'Correction', correctionStatus:'Incomplete'}})
        await StandaloneDatapoints.updateMany({taskId: body.taskId, status: true},{$set: {dpStatus: 'Correction', correctionStatus:'Incomplete'}}) 
        await TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue}});
      } else{
        taskStatusValue = "Collection Completed"; 
        await TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue}});
      };
    }
    await TaskHistories.create({
      taskId: body.taskId,
      companyId: taskDetails.companyId.id,
      categoryId: taskDetails.categoryId.id,
      submittedByName: user.name,
      stage: taskStatusValue,
      comment: '',
      status: true,
      createdBy: user
    }).catch((error) =>{
      return res.status(500).json({status: "500", message: error.message ? error.message : "Failed to create task history!"});    
    });
    if(taskStatusValue == 'Reassignment Pending'){
      await Notifications.create({
        notifyToUser: taskDetails.groupId.groupAdmin, 
        notificationType: "/tasklist",
        content: "Reassign the task for Analyst as it has some errors TaskID - "+ taskDetails.taskNumber, 
        notificationTitle: "Reassignment Pending",
        status: true,
        isRead: false
      }).catch((error) =>{
        return res.status(500).json({status: "500", message: error.message ? error.message : "Failed to sent notification!"});
      });
    }
    let categoriesLength = await Categories.count({
      clientTaxonomyId: body.clientTaxonomyId,
      status: true,
    });
    let taskDetailsObject = await TaskAssignment.count({
      companyId: body.companyId,
      year: body.year,
      taskStatus: "Completed"
    });
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
  var allTasks = await TaskAssignment.find({}).populate('companyId').populate('categoryId');
  var completedTask = [];
  var pendingTask = [];
  for (var i = 0; i < allTasks.length; i++) {
    if (allTasks[i].companyId) {
      var companyRep = await CompanyRepresentatives.findOne({ companiesList: { $in: [allTasks[i].companyId.id] } }).populate('userId');
      var clientRep = await ClientRepresentatives.findOne({ companyName: allTasks[i].companyId.id }).populate('userId');
      var companyTask = await CompaniesTasks.findOne({ companyId: allTasks[i].companyId.id }).populate('companyId');
    } if (allTasks[i].categoryId) {
      var categoryWithClientTaxonomy = await Categories.findById(allTasks[i].categoryId.id).populate('clientTaxonomyId');
    }
    var obj = {
      taxonomy: categoryWithClientTaxonomy && categoryWithClientTaxonomy.clientTaxonomyId ? categoryWithClientTaxonomy.clientTaxonomyId.taxonomyName : null,
      companyName: allTasks[i].companyId ? allTasks[i].companyId.companyName : null,
      companyRepresentative: companyRep && companyRep.userId ? companyRep.userId.name : null,
      clientRrepresentative: clientRep && clientRep.userId ? clientRep.userId.name : null,
      isChecked: false,
      companyId: allTasks[i].companyId ? allTasks[i].companyId.id : null,
    }
    if (companyTask && companyTask.overAllCompanyTaskStatus) {
      obj.completedDate = companyTask ? companyTask.completedDate : null;
    } else {
      obj.allocatedDate = companyTask ? companyTask.completedDate : null;
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
    console.log(JSON.stringify(controversyTask[i], null, 3))
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
  return res.status(200).json({ completed: completedTask, pending: pendingTask, controversy });
}


export const getTaskList = async ({ user, bodymen: { body } }, res, next) => {
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
      if (obj.analystStatus === 'Breached' || obj.qaStatus === 'Breached') {
        obj.status = "Breached";
      } else {
        if (companyTask && companyTask.overAllCompanyTaskStatus) {
          obj.status = 'Completed';
        } else {
          obj.status = 'OnTrack'
        }
      }
      result.push(obj);
    }
  }
  return res.status(200).json({ data: result });
}


export const controversyReports = async ({ user, params }, res, next) => {
  var controversyTask = await ControversyTasks.find({ status: true }).populate('companyId').populate('analystId');
  var controversy = [];
  for (var i = 0; i < controversyTask.length; i++) {
    console.log(JSON.stringify(controversyTask[i], null, 3))
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
}



export const getTaskListForControversy = async ({ user, bodymen: { body } }, res, next) => {
  var result = [];
  var controversyTask = await Controversy.find({ taskId: { $in: body.controversyTaskReports }, status: true }).
    populate('companyId').populate({
      path: "taskId",
      populate: {
        path: "analystId"
      }
    });
  console.log('controversyTask', JSON.stringify(controversyTask, null, 3))
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
}