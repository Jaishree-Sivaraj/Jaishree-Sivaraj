import { success, notFound, authorOrAdmin } from '../../services/response/'
import { TaskAssignment } from '.'
import { User } from '../user'
import { Role } from '../role'
import { Group } from '../group'
import { Categories } from '../categories'
import { CompanyRepresentatives } from '../company-representatives'
import { ClientRepresentatives } from '../client-representatives'


export const create = async ({ user, bodymen: { body } }, res, next) => {
  await TaskAssignment.findOne({ status: true }).sort({ createdAt: -1 }).limit(1)
    .then(async (taskObject) => {
      console.log('taskObject', taskObject);
      let newTaskNumber = '';
      if (taskObject) {
        if (taskObject.taskNumber) {
          let lastTaskNumber = taskObject.taskNumber.split('DT')[1];
          newTaskNumber = Number(lastTaskNumber) + 1;
        } else {
          newTaskNumber = '1';
        }
        body.taskNumber = 'DT' + newTaskNumber;
        await TaskAssignment.create({ ...body, createdBy: user })
          .then((taskAssignment) => {
            return res.status(200).json({ status: "200", message: "Task created successfully!", data: taskAssignment.view(true) });
          })
          .catch((error) => {
            return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to create task!" });
          })
      } else {
        if (taskObject) {
          let lastTaskNumber = taskObject.taskNumber.split('DT')[1];
          newTaskNumber = Number(lastTaskNumber) + 1;
        } else {
          newTaskNumber = '1';
        }
        body.taskNumber = 'DT' + newTaskNumber;
        await TaskAssignment.create({ ...body, createdBy: user })
          .then((taskAssignment) => {
            return res.status(200).json({ status: "200", message: "Task created successfully!", data: taskAssignment.view(true) });
          })
          .catch((error) => {
            return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to create task!" });
          })
      }
    })
    .catch((error) => {
      return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to create task!" })
    });
}

export const index = ({ querymen: { query, select, cursor } }, res, next) => {
  TaskAssignment.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then((taskAssignments) => {
      let taskList = [];
      for (let index = 0; index < taskAssignments.length; index++) {
        const object = taskAssignments[index];
        let taskObject = {
          taskId: object.id,
          taskNumber: object.taskNumber,
          pillar: object.categoryId ? object.categoryId.categoryName : null,
          pillarId: object.categoryId ? object.categoryId.id : null,
          batch: object.batchId ? object.batchId.batchName : null,
          batchId: object.batchId ? object.batchId.id : null,
          company: object.companyId ? object.companyId.companyName : null,
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
        taskList.push(taskObject);
      }
      return res.status(200).json({
        status: "200", message: "Tasks retrieved successfully!", data: {
          count: taskList.length,
          rows: taskList
        }
      })
    })
    .catch((error) => {
      return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
    })
}

export const getMyTasks = async({ user, querymen: { query, select, cursor } }, res, next) => {
  console.log('get my tasks');
  let completeUserDetail = await User.findOne({ _id: user.id, isRoleAssigned: true, isUserActive: true }).populate({ path: 'roleDetails.roles' }).
  populate({ path: 'roleDetails.primaryRole' }).catch((error) => { return res.status(500).json({ "status": "500", message: error.message }) });
  let analystTaskList = [], qaTaskList = [], clientRepTaskList = [], companyRepTaskList = [];
  let userRoles = [];
  if (completeUserDetail && completeUserDetail.primaryRole) {
    userRoles.push(completeUserDetail.primaryRole.roleName);
    if (completeUserDetail.roles && completeUserDetail.roles.length > 0) {
      for (let index = 0; index < completeUserDetail.roles.length; index++) {
        if (completeUserDetail.roles[index]) {
          userRoles.push(completeUserDetail.roles[index].roleName);          
        }
      }
    }
  } else {
    return res.status(400).json({ "status": "400", message: "User role not found!" })
  }

  if (userRoles.includes("QA")) {
    await TaskAssignment.find({ qaId: completeUserDetail.id, $or: [{ taskStatus: "Collection Completed" }, { taskStatus: "Correction Completed" }], status: true })
    .sort({ createdAt: -1 })
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then((taskAssignments) => {
      for (let index = 0; index < taskAssignments.length; index++) {
        const object = taskAssignments[index];
        let taskObject = {
          taskId: object.id,
          taskNumber: object.taskNumber,
          pillar: object.categoryId ? object.categoryId.categoryName : null,
          pillarId: object.categoryId ? object.categoryId.id : null,
          batch: object.batchId ? object.batchId.batchName : null,
          batchId: object.batchId ? object.batchId.id : null,
          company: object.companyId ? object.companyId.companyName : null,
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
      return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
    })
  }

  if (userRoles.includes("Analyst")) {
    await TaskAssignment.find({ analystId: completeUserDetail.id, $or: [{ taskStatus: "Yet to work" }, { taskStatus: "In Progress" }], status: true })
    .sort({ createdAt: -1 })
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then((taskAssignments) => {
      for (let index = 0; index < taskAssignments.length; index++) {
        const object = taskAssignments[index];
        let taskObject = {
          taskId: object.id,
          taskNumber: object.taskNumber,
          pillar: object.categoryId ? object.categoryId.categoryName : null,
          pillarId: object.categoryId ? object.categoryId.id : null,
          batch: object.batchId ? object.batchId.batchName : null,
          batchId: object.batchId ? object.batchId.id : null,
          company: object.companyId ? object.companyId.companyName : null,
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
        analystTaskList.push(taskObject);
      }
    })
    .catch((error) => {
      return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
    })
  }

  if (userRoles.includes("Client Representative")) {
    let clientRepDetail = await ClientRepresentatives.findOne({ userId: completeUserDetail.id, status: true });
    if (clientRepDetail && clientRepDetail.CompanyName) {
      await TaskAssignment.find({ companyId: clientRepDetail.CompanyName, taskStatus: "Verification Completed", status: true })
      .sort({ createdAt: -1 })
      .populate('createdBy')
      .populate('companyId')
      .populate('categoryId')
      .populate('batchId')
      .populate('analystId')
      .populate('qaId')
      .then((taskAssignments) => {
        for (let index = 0; index < taskAssignments.length; index++) {
          const object = taskAssignments[index];
          let taskObject = {
            taskId: object.id,
            taskNumber: object.taskNumber,
            pillar: object.categoryId ? object.categoryId.categoryName : null,
            pillarId: object.categoryId ? object.categoryId.id : null,
            batch: object.batchId ? object.batchId.batchName : null,
            batchId: object.batchId ? object.batchId.id : null,
            company: object.companyId ? object.companyId.companyName : null,
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
        return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
      })      
    }
  }

  if (userRoles.includes("Company Representative")) {
    let companyRepDetail = await CompanyRepresentatives.findOne({ userId: completeUserDetail.id, status: true });
    if (companyRepDetail && companyRepDetail.companiesList.length > 0) {
      await TaskAssignment.find({ companyId: { $in: companyRepDetail.companiesList }, taskStatus: "Verification Completed", status: true })
      .sort({ createdAt: -1 })
      .populate('createdBy')
      .populate('companyId')
      .populate('categoryId')
      .populate('batchId')
      .populate('analystId')
      .populate('qaId')
      .then((taskAssignments) => {
        for (let index = 0; index < taskAssignments.length; index++) {
          const object = taskAssignments[index];
          let taskObject = {
            taskId: object.id,
            taskNumber: object.taskNumber,
            pillar: object.categoryId ? object.categoryId.categoryName : null,
            pillarId: object.categoryId ? object.categoryId.id : null,
            batch: object.batchId ? object.batchId.batchName : null,
            batchId: object.batchId ? object.batchId.id : null,
            company: object.companyId ? object.companyId.companyName : null,
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
        return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
      })      
    }
  }
  let data = {
    analystTaskList: analystTaskList ? analystTaskList : [], 
    qaTaskList: qaTaskList ? qaTaskList : [], 
    clientRepTaskList: clientRepTaskList ? clientRepTaskList : [], 
    companyRepTaskList: companyRepTaskList ? companyRepTaskList : []
  }
  return res.status(200).json({ "status": "200", message: "Task retrieved succesfully!", data: data });

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
}

export const show = ({ params }, res, next) =>
  TaskAssignment.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then(notFound(res))
    .then((taskAssignment) => taskAssignment ? taskAssignment.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taskAssignment) => taskAssignment ? Object.assign(taskAssignment, body).save() : null)
    .then((taskAssignment) => taskAssignment ? taskAssignment.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taskAssignment) => taskAssignment ? taskAssignment.remove() : null)
    .then(success(res, 204))
    .catch(next)


export const getGroupAndBatches = async ({ user, params }, res, next) => {
  var groupRoleDetails = await Role.findOne({ roleName: "GroupAdmin" }).catch(() => { return res.status(500).json({ status: "500", message: error.message }) });
  var superAdminRoleDetails = await Role.findOne({ roleName: "SuperAdmin" }).catch(() => { return res.status(500).json({ status: "500", message: error.message }) });
  console.log("groupRoleDetails", groupRoleDetails);
  var userDetailWithGroupAdminRole = await User.findOne({
    _id: user.id, '$or': [{
      'roleDetails.roles': { '$in': [groupRoleDetails.id] }
    }, { 'roleDetails.primaryRole': groupRoleDetails.id }]
  }).populate({ path: 'roleDetails.roles' }).
    populate({ path: 'roleDetails.primaryRole' }).catch((error) => { return res.status(500).json({ "status": "500", message: error.message }) });
  if (userDetailWithGroupAdminRole && Object.keys(userDetailWithGroupAdminRole).length > 0) {
    console.log('in group admin')
    await Group.find({ groupAdmin: userDetailWithGroupAdminRole._id }).populate('assignedMembers').populate('batchList').then(async (group) => {
      var resArray = [];
      var resObject = {};
      for (let index = 0; index < group.length; index++) {
        for (let index1 = 0; index1 < group[index].batchList.length; index1++) {
          var categories = await Categories.find({ clientTaxonomyId: group[index].batchList[index1].clientTaxonomy }).catch(err => { return res.status(500).json({ "status": "500", message: err.message }) })
          resObject.groupName = group[index].groupName;
          resObject.groupID = group[index].id;
          var assignedBatches = group[index].batchList.map(rec => {
            return {
              "batchName": rec.batchName,
              "batchID": rec._id,
              "pillars": categories.map((rec) => {
                return { value: rec.id, label: rec.categoryName }
              }),
              "batchYear": rec.years
            }
          })
          resObject.assignedBatches = assignedBatches;
          resArray.push(resObject);
        }
      }
      return res.status(200).json({ groups: resArray });
    }).catch(err => { return res.status(500).json({ "status": "500", message: err.message }) })
  } else {
    var userDetailWithSuperAdminRole = await User.findOne({
      _id: user.id, '$or': [{
        'roleDetails.roles': { '$in': [superAdminRoleDetails.id] }
      }, { 'roleDetails.primaryRole': superAdminRoleDetails.id }]
    }).populate({ path: 'roleDetails.roles' }).
      populate({ path: 'roleDetails.primaryRole' }).catch((error) => { return res.status(500).json({ "status": "500", message: error.message }) });
    if (userDetailWithSuperAdminRole) {
      await Group.find({ status: true }).populate('assignedMembers').populate('batchList').then(async (group) => {
        var resArray = [];
        var resObject = {};
        for (let index = 0; index < group.length; index++) {
          for (let index1 = 0; index1 < group[index].batchList.length; index1++) {
            var categories = await Categories.find({ clientTaxonomyId: group[index].batchList[index1].clientTaxonomy }).catch(err => { return res.status(500).json({ "status": "500", message: err.message }) })
            resObject.groupName = group[index].groupName;
            resObject.groupID = group[index].id;
            var assignedBatches = group[index].batchList.map(rec => {
              return {
                "batchName": rec.batchName,
                "batchID": rec._id,
                "pillars": categories.map((rec) => {
                  return { value: rec.id, label: rec.categoryName }
                }),
                "batchYear": rec.years
              }
            })
            resObject.assignedBatches = assignedBatches;
            resArray.push(resObject);
          }
        }
        return res.status(200).json({ groups: resArray });
      })
    } else {
      return res.status(200).json({ groups: [] });
    }
  }
}

