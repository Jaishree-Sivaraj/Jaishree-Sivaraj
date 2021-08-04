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
        })
          .then((taskAssignment) => {
            return res.status(200).json({
              status: "200",
              message: "Task created successfully!",
              data: taskAssignment.view(true),
            });
          })
          .catch((error) => {
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
        })
          .then(async (taskAssignment) => {
            await CompaniesTasks.create({
              companyId: body.companyId,
              year: body.year,
              categoryId: body.categoryId,
              status: true,
              taskId: taskAssignment.id,
            })
              .then(async () => {
                return res.status(200).json({
                  status: "200",
                  message: "Task created successfully!",
                  data: taskAssignment.view(true),
                });
              })
              .catch((error) => {
                return res.status(400).json({
                  status: "400",
                  message: error.message
                    ? error.message
                    : "Failed to create companies task!",
                });
              });
          })
          .catch((error) => {
            return res.status(400).json({
              status: "400",
              message: error.message ? error.message : "Failed to create task!",
            });
          });
      }
    })
    .catch((error) => {
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
            await CompaniesTasks.create({
              companyId: taskObject.companyId,
              year: taskObject.year,
              categoryId: taskObject.categoryId,
              status: true,
              taskId: taskAssignment.id,
              createdBy: taskObject.createdBy,
            })
              .then(async () => {
                taskArray.push(taskAssignment.view(true));
              })
              .catch((error) => {
                return res.status(400).json({
                  status: "400",
                  message: error.message
                    ? error.message
                    : "Failed to create companies task!",
                });
              });
          })
          .catch((error) => {
            return res.status(400).json({
              status: "400",
              message: error.message ? error.message : "Failed to create task!",
            });
          });
      })
      .catch((error) => {
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

export const index = ({ querymen: { query, select, cursor } }, res, next) => {
  TaskAssignment.find(query)
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
      let taskList = [];
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
        taskList.push(taskObject);
      }
      return res.status(200).json({
        status: "200",
        message: "Tasks retrieved successfully!",
        data: {
          count: taskList.length,
          rows: taskList,
        },
      });
    })
    .catch((error) => {
      return res.status(400).json({
        status: "400",
        message: error.message ? error.message : "Failed to retrieve tasks!",
      });
    });
};

export const getMyTasks = async (
  { user, querymen: { query, select, cursor } },
  res,
  next
) => {
  console.log("get my tasks");
  let completeUserDetail = await User.findOne({
    _id: user.id,
    isRoleAssigned: true,
    isUserActive: true,
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
            qa: object.qaId ? object.qaId.name : null,
            qaId: object.qaId ? object.qaId.id : null,
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
            qa: object.qaId ? object.qaId.name : null,
            qaId: object.qaId ? object.qaId.id : null,
            fiscalYear: object.year,
            taskStatus: object.taskStatus,
            createdBy: object.createdBy ? object.createdBy.name : null,
            createdById: object.createdBy ? object.createdBy.id : null,
          };
          if (taskAssignments[index].taskStatus == "Verification Pending") {
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
              qa: object.qaId ? object.qaId.name : null,
              qaId: object.qaId ? object.qaId.id : null,
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
              qa: object.qaId ? object.qaId.name : null,
              qaId: object.qaId ? object.qaId.id : null,
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


export const updateSlaDates = ({ user, bodymen: { body }, params }, res, next) => {
  TaskAssignment.updateOne({ _id: body.taskId }, { $set: body.taskDetails }).then(function (updatedRecord) {
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
}

export const destroy = ({ user, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, "createdBy"))
    .then((taskAssignment) => (taskAssignment ? taskAssignment.remove() : null))
    .then(success(res, 204))
    .catch(next);

export const getGroupAndBatches = async ({ user, params }, res, next) => {
  var groupRoleDetails = await Role.findOne({ roleName: "GroupAdmin" }).catch(() => {
    return res.status(500).json({ status: "500", message: error.message, });
  });
  var superAdminRoleDetails = await Role.findOne({ roleName: "SuperAdmin" }).catch(() => {
    return res.status(500).json({
      status: "500", message: error.message,
    });
  });
  var adminRoleDetails = await Role.findOne({ roleName: "Admin" }).catch(() => {
    return res.status(500).json({
      status: "500",
      message: error.message,
    });
  });
  console.log("groupRoleDetails", groupRoleDetails);
  var userDetailWithGroupAdminRole = await User.findOne({
    _id: user.id,
    '$or': [
      {
        "roleDetails.roles": {
          '$in': [groupRoleDetails.id],
        }
      },
      {
        "roleDetails.primaryRole": groupRoleDetails.id,
      }
    ]
  }).populate({
    path: "roleDetails.roles"
  }).populate({
    path: "roleDetails.primaryRole"
  }).catch((error) => {
    return res.status(500).json({
      status: "500",
      message: error.message
    });
  });
  console.log('userDetailWithGroupAdminRole', userDetailWithGroupAdminRole);
  if (userDetailWithGroupAdminRole && Object.keys(userDetailWithGroupAdminRole).length > 0) {
    console.log("in group admin");
    await Group.find({
      groupAdmin: userDetailWithGroupAdminRole._id,
    }).populate("assignedMembers")
      .populate("batchList")
      .then(async (group) => {
        var resArray = [];
        for (let index = 0; index < group.length; index++) {
          var resObject = {};
          resObject.groupName = group[index].groupName;
          resObject.groupID = group[index].id;
          resObject.assignedBatches = [];
          for (
            let index1 = 0;
            index1 < group[index].batchList.length;
            index1++
          ) {
            var categories = await Categories.find({
              clientTaxonomyId: group[index].batchList[index1].clientTaxonomy,
            }).catch((err) => {
              return res.status(500).json({
                status: "500",
                message: err.message
              });
            });
            var assignedBatches = group[index].batchList.map((rec) => {
              return {
                batchName: rec.batchName,
                batchID: rec._id,
                pillars: categories.map((rec) => {
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
          resArray.push(resObject);
        }
        return res.status(200).json({
          groups: resArray
        });
      })
      .catch((err) => {
        return res.status(500).json({
          status: "500",
          message: err.message
        });
      });
  } else {
    var userDetailWithSuperAdminRole = await User.findOne({
      _id: user.id,
      '$or': [
        {
          "roleDetails.roles": {
            '$in': [
              superAdminRoleDetails.id,
              adminRoleDetails ? adminRoleDetails.id : null
            ]
          }
        },
        {
          '$or': [
            {
              "roleDetails.primaryRole": superAdminRoleDetails ? superAdminRoleDetails.id : null
            },
            {
              "roleDetails.primaryRole": adminRoleDetails ? adminRoleDetails.id : null
            }
          ]
        }
      ]
    }).populate({
      path: "roleDetails.roles"
    }).populate({
      path: "roleDetails.primaryRole"
    }).catch((error) => {
      return res.status(500).json({
        status: "500",
        message: error.message
      });
    });
    console.log('userDetailWithSuperAdminRole', userDetailWithSuperAdminRole);
    if (userDetailWithSuperAdminRole) {
      await Group.find({
        status: true,
      }).populate("assignedMembers")
        .populate("batchList")
        .then(async (group) => {
          var resArray = [];
          for (let index = 0; index < group.length; index++) {
            var resObject = {};
            resObject.groupName = group[index].groupName;
            resObject.groupID = group[index].id;
            resObject.assignedBatches = [];
            for (let index1 = 0; index1 < group[index].batchList.length; index1++) {
              var categories = await Categories.find({
                clientTaxonomyId: group[index].batchList[index1].clientTaxonomy
              }).catch((err) => {
                return res.status(500).json({
                  status: "500",
                  message: err.message
                });
              });
              var assignedBatches = group[index].batchList.map((rec) => {
                return {
                  batchName: rec.batchName,
                  batchID: rec._id,
                  pillars: categories.map((rec) => {
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
            resArray.push(resObject);
          }
          return res.status(200).json({
            groups: resArray
          });
        });
    } else {
      return res.status(200).json({
        groups: []
      });
    }
  }
};

export const getUsers = async ({ user, bodymen: { body } }, res, next) => {
  console.log("bodymen", body);
  //batchId -> Batches.findById(batchId) -> companies ->
  //loop companiesList
  //unassigned company list - companies_tasks.find({categoryId, year : {$in : [year]}}) if length > 0 don'y include this company else include with value and lable
  //find in group by groupID and populate assignedMembers
  //if roleId match with roleDetals.primaryRole roleType would be primary if match with roleDetals.roles roleType would be secondary
  //if categoryId match with roleDetals.primaryRole pilltype would be primary if match with roleDetals.roles pillType would be secondary
  //loop assignedMembers and find qa and analyst with role name
  //each iteration of assignedMembers find in taskAssignement with for qa qaId and for analyst with analystId, taskStatus !=Collection Completed and !=Correction Completed for analyst, !=Verification Completed for qa store in activeTaskCount;
  var resObj = {};
  var batch = await Batches.findById(body.batchId)
    .populate("companiesList")
    .catch();
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
      var assignedCompanyList = await CompaniesTasks.find({
        categoryId: body.categoryId,
        year: years,
        companyId: batch.companiesList[index].id,
      }).populate("companyId");
      if (assignedCompanyList.length === 0) {
        unAssignedCompanyList.push({
          id: batch.companiesList[index].id,
          companyName: batch.companiesList[index].companyName,
        });
      }
    }
    resObj["companies"] = unAssignedCompanyList;
  }
  var group = await Group.findById(body.groupId)
    .populate("assignedMembers")
    .populate({ path: "assignedMembers.roleDetails" });
  var roleDetails = await Role.find({ roleName: { $in: ["QA", "Analyst"] } });
  console.log("roleDetails", roleDetails);
  console.log("group", JSON.stringify(group, null, 3));
  var qa = [],
    analyst = [];
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
        clientTaxonomyId: batch.clientTaxonomy,
        userId: group.assignedMembers[index].id,
        $or: [
          {
            secondaryPillar: { $in: [body.categoryId] },
          },
          { primaryPillar: body.categoryId },
        ],
      })
        .populate("primaryPillar")
        .populate("secondaryPillar");
      console.log("userPillar", JSON.stringify(userPillar, null, 3));
      if (userPillar && Object.keys(userPillar).length > 0) {
        console.log("in userpillar first if");
        if (userPillar.primaryPillar.id === body.categoryId) {
          console.log("in userpillar second if");
          qaObject.primaryPillar = true;
          analystObject.primaryPillar = true;
        } else {
          console.log("in userpillar second else");
          qaObject.primaryPillar = false;
          analystObject.primaryPillar = false;
        }
        console.log(
          "before qa",
          group.assignedMembers[index].roleDetails.primaryRole,
          qaId._id
        );
        if (
          qaId &&
          group.assignedMembers[index].roleDetails.primaryRole === qaId._id
        ) {
          console.log("in if qaId");
          var activeTaskCount = await TaskAssignment.find({
            qaId: group.assignedMembers[index].id,
            status: true,
            taskStatus: { $ne: "Verification Completed" },
          });
          console.log("activeTaskCount qa", activeTaskCount);
          qaObject.id = group.assignedMembers[index].id;
          qaObject.name = group.assignedMembers[index].name;
          qaObject.primaryRole = true;
          qaObject.activeTaskCount = activeTaskCount.length;
          qa.push(qaObject);
        } else if (
          qaId &&
          group.assignedMembers[index].roleDetails.roles.indexOf(qaId._id) > -1
        ) {
          console.log("in else if qaId");
          var activeTaskCount = await TaskAssignment.find({
            qaId: group.assignedMembers[index].id,
            status: true,
            taskStatus: { $ne: "Verification Completed" },
          });
          console.log("activeTaskCount qa", activeTaskCount);
          qaObject.id = group.assignedMembers[index].id;
          qaObject.name = group.assignedMembers[index].name;
          qaObject.primaryRole = false;
          qaObject.activeTaskCount = activeTaskCount.length;
          qa.push(qaObject);
        }
        console.log(
          "before analyst",
          group.assignedMembers[index].roleDetails.primaryRole,
          analystId._id
        );
        if (
          analystId &&
          group.assignedMembers[index].roleDetails.primaryRole === analystId._id
        ) {
          console.log("in if anylysy");
          var activeTaskCount = await TaskAssignment.find({
            analystId: group.assignedMembers[index].id,
            status: true,
            taskStatus: {
              $nin: ["Collection Completed", "Correction Completed"],
            },
          });
          console.log("activeTaskCount analyst", activeTaskCount);
          analystObject.id = group.assignedMembers[index].id;
          analystObject.name = group.assignedMembers[index].name;
          analystObject.primaryRole = true;
          analystObject.activeTaskCount = activeTaskCount.length;
          analyst.push(analystObject);
        } else if (
          analystId &&
          group.assignedMembers[index].roleDetails.roles.indexOf(
            analystId._id
          ) > -1
        ) {
          console.log("in else if anylysy");
          var activeTaskCount = await TaskAssignment.find({
            analystId: group.assignedMembers[index].id,
            status: true,
            taskStatus: {
              $nin: ["Collection Completed", "Correction Completed"],
            },
          });
          console.log("activeTaskCount analyst", activeTaskCount);
          analystObject.id = group.assignedMembers[index].id;
          analystObject.name = group.assignedMembers[index].name;
          analystObject.primaryRole = false;
          analystObject.activeTaskCount = activeTaskCount.length;
          analyst.push(analystObject);
        }
      }
      console.log("in else");
    }
    resObj["qaData"] = qa;
    resObj["analystData"] = analyst;
    res.status(200).json({ data: resObj });
  }
};

export const updateCompanyStatus = async (
  { user, bodymen: { body } },
  res,
  next
) => {
  try {
    let taskDetails = await TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: body.taskStatus } });

    let categoriesLength = await Categories.find({
      clientTaxonomyId: body.clientTaxonomyId,
      status: true,
    });
    let taskDetailsObject = await TaskAssignment.find({
      companyId: body.companyId,
      year: body.year,
      taskStatus: "Completed",
    });
    if (categoriesLength.length == taskDetailsObject.length) {
      await TaskAssignment.updateOne(
        {
          companyId: body.companyId,
          year: body.year,
          taskStatus: "Completed"
        },
        {
          $set: {
            overAllCompanyTaskStatus: true,
            overAllCompanyTaskCompletedDate: Date.now()
          },
        }
      );
    } else {
    }
    return res.status(200).json({
      message: "Company Status update succesfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message,
    });
  }
};

export const reports = async ({ user, params }, res, next) => {
  console.log('in reports')
  var allTasks = await TaskAssignment.find().populate('companyId').populate('categoryId');
  var completedTask = [];
  var pendingTask = [];
  for (var i = 0; i < allTasks.length; i++) {
    console.log(JSON.stringify(allTasks[i], null, 3))
    if (allTasks[i].companyId) {
      var companyRep = await CompanyRepresentatives.findOne({ companiesList: { $in: [allTasks[i].companyId.id] } }).populate('userId');
      var clientRep = await ClientRepresentatives.findOne({ companyName: allTasks[i].companyId.id }).populate('userId');
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
    if (allTasks[i].taskStatus !== 'Completed') {
      obj.allocatedDate = allTasks[i].companyId && allTasks[i].companyId.overAllCompletedDate ? allTasks[i].companyId.overAllCompletedDate : null;
    } else {
      obj.allocatedDate = allTasks[i].companyId && allTasks[i].companyId.overAllCompletedDate ? allTasks[i].companyId.overAllCompletedDate : null;

    }
    if (allTasks[i].overAllCompanyTaskStatus) {
      completedTask.push(obj)
    } else {
      pendingTask.push(obj)
    }
  }
  completedTask = _.uniqBy(completedTask, function (e) {
    return e.companyId;
  })
  pendingTask = _.uniqBy(pendingTask, function (e) {
    return e.companyId;
  })
  return res.status(200).json({ completed: completedTask, pending: pendingTask });
}


export const getTaskList = async ({ user, bodymen: { body } }, res, next) => {
  for (var index = 0; index < body.companyTaskReports.length; index++) {
    var allTasks = await TaskAssignment.find({
      companyId: body.companyTaskReports[index]
    }).populate('companyId').populate('categoryId').populate('groupId').populate('analystId').populate('qaId');
    var result = [];
    for (var i = 0; i < allTasks.length; i++) {
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
        analystStatus: "Breached",
        qaStatus: "OnTrack",
        status: allTasks[i].taskStatus ? allTasks[i].taskStatus : null
      }
      result.push(obj);
    }
  }
  return res.status(200).json({ data: result });
}
