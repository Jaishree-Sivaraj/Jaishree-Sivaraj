import * as fs from 'fs'
import { success, notFound } from '../../services/response/'
import { Companies } from '../companies'
import { User } from '../user'
import { Functions } from '../functions'
import { TaskAssignment } from "../taskAssignment";
import { Datapoints } from '../datapoints'
import { ControversyTasks } from '.'
import { Role } from "../role"
import { Controversy } from '../controversy'
import { ControversyTaskHistories } from '../controversy_task_histories'
import moment from 'moment'
   
export const create = ({ user, bodymen: { body } }, res, next) =>
  ControversyTasks.create({ ...body, createdBy: user })
    .then((controversyTasks) => controversyTasks.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = async ({ querymen: { query, select, cursor } }, res, next) => {
  await ControversyTasks.find(query)
    .populate('companyId')
    .populate('analystId')
    .populate('createdBy')
    .then((controversyTasks) => {
      let controversyTasksList = [];
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
            controversyTasksList.push(object);
          }
        }
      }
      return res.status(200).json({ status: "200", message: "Controversy tasks retrieved successfully!", count: controversyTasks.length, rows: controversyTasksList })
    })
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve controversy tasks!" })
    })
}

export const getMyPendingTasks = async ({ user, querymen: { query, select, cursor } }, res, next) => {
  let userTypeDetail = await User.findOne({
    _id: user.id,
    isUserActive: true,
    isUserApproved: true,
    status: true,
    '$or': [{
      'roleDetails.roles': { '$in': [userTypeDetail.id] }
    }, { 'roleDetails.primaryRole': userTypeDetail.id }]
  })
    .populate({ path: 'roleDetails.roles' })
    .populate({ path: 'roleDetails.primaryRole' }).catch((error) => { return res.status(500).json({ "status": "500", message: error.message }) });

  let findQuery = {};
  if (user.userType == 'SuperAdmin' || userTypeDetail || Object.keys(userTypeDetail).length > 0) {
    findQuery = { taskStatus: { $ne: 'Completed' }, status: true };
  } else {
    findQuery = { analystId: user, taskStatus: { $ne: 'Completed' }, status: true };
  }
  await ControversyTasks.find(findQuery)
    .populate('companyId')
    .populate('analystId')
    .populate('createdBy')
    .then((controversyTasks) => {
      let controversyTasksList = [];
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
            controversyTasksList.push(object);
          }
        }
      }
      return res.status(200).json({ status: "200", message: "Controversy pending tasks retrieved successfully!", count: controversyTasks.length, rows: controversyTasksList })
    })
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve controversy pending tasks!" })
    })
}

export const companiesAndAnalyst = async ({ params }, res, next) => {
  var allCompanies = await Companies.find({ clientTaxonomyId: params.taxonomyId, status: true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message }) });
  var unassignedCompanies = [];
  if (allCompanies && allCompanies.length > 0) {
    for (var i = 0; i < allCompanies.length; i++) {
      var controversyTask = await ControversyTasks.find({ companyId: allCompanies[i].id, status: true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message }) });
      if (controversyTask.length === 0) {
        unassignedCompanies.push({ "companyName": allCompanies[i].companyName, "id": allCompanies[i].id });
      }
    }
  }
  var analystRoleDetails = await Role.findOne({ roleName: "Analyst" }).catch(() => { return res.status(500).json({ status: "500", message: error.message }) });
  var userDetailWithAnalystRole = await User.find({ '$or': [{ "roleDetails.roles": { '$in': [analystRoleDetails.id] } }, { "roleDetails.primaryRole": analystRoleDetails.id }] }).populate({ path: "roleDetails.roles" }).populate({ path: "roleDetails.primaryRole" }).catch((error) => {
    return res.status(500).json({
      status: "500",
      message: error.message
    });
  });
  var analyst = [];
  for (let index = 0; index < userDetailWithAnalystRole.length; index++) {
    var analystObject = { "id": userDetailWithAnalystRole[index].id, "name": userDetailWithAnalystRole[index].name };
    var controversyTask = await ControversyTasks.find({ analystId: userDetailWithAnalystRole[index].id, status: true, taskStatus: { $ne: "Completed" } }).catch((error) => { return res.status(500).json({ status: "500", message: error.message }) });
    analystObject.activeTaskCount = controversyTask.length;
    if (analystRoleDetails.id === userDetailWithAnalystRole[index].roleDetails.primaryRole) {
      analystObject.primaryRole = true;
    } else {
      analystObject.primaryRole = false;
    }
    analyst.push(analystObject);
  }
  return res.status(200).json({ analystData: analyst, companies: unassignedCompanies });
}

export const show = async ({ params }, res, next) => {
  try {    
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });
    await ControversyTasks.findById(params.id)
      .populate({
        path: 'companyId',
        populate: {
          path: 'clientTaxonomyId'
        }
       })
      .populate('analystId')
      .populate('createdBy')
      .then(async (controversyTasks) => {
        if (controversyTasks) {
          let controversyObject = {
            taskNumber: controversyTasks.taskNumber,
            taskId: controversyTasks.id,
            companyName: controversyTasks.companyId.companyName,
            companyId: controversyTasks.companyId.id,
            dpCodesList: []
          }
          await Datapoints.find({
            "functionId": functionId,
            clientTaxonomyId: controversyTasks.companyId.clientTaxonomyId.id,
            status: true
          })
            .populate('keyIssueId')
            .then(async (datapoints) => {
              if (datapoints.length > 0) {
                for (let index = 0; index < datapoints.length; index++) {
                  let yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  let reassessmentDate = await Controversy.find({taskId: controversyTasks.id,datapointId: datapoints[index].id, reassessmentDate:{$gt : yesterday}, status:true, isActive: true}).limit(1).sort({reassessmentDate: 1});
                  let reviewDate = await Controversy.find({taskId: controversyTasks.id,datapointId: datapoints[index].id, reviewDate:{$gt : yesterday}, status:true, isActive: true}).limit(1).sort({reviewDate: 1});
                  let fiscalYearEndDate = await Controversy.find({taskId: controversyTasks.id,datapointId: datapoints[index].id , status:true, isActive: true}).limit(1).sort({fiscalYearEndDate: -1});
                  let objectToPush = {
                    dpCode: datapoints[index].code,
                    dpCodeId: datapoints[index].id,
                    keyIssueName: datapoints[index].keyIssueId.keyIssueName,
                    keyIssueId: datapoints[index].keyIssueId.id,
                    reassessmentDate: reassessmentDate[0] ? reassessmentDate[0].reassessmentDate : '',
                    reviewDate: reviewDate[0] ? reviewDate[0].reviewDate : '',
                    controversyFiscalYearEndDate: fiscalYearEndDate[0] ? fiscalYearEndDate[0].fiscalYearEndDate : ""
                  };
                  controversyObject.dpCodesList.push(objectToPush);
                }
                return res.status(200).json({ status: "200", message: "Retrieved datapoints successfully!", data: controversyObject });
              } else {
                return res.status(500).json({ status: "500", message: "No controversy datapoints found!" });
              }
            })
            .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to get controvery datapoints!' }) });
        } else {
          return res.status(500).json({ status: "500", message: "Controversy Task not found!" });
        }
      })
      .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Controversy task not found!' }) });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : 'Controversy task not found!' })
  }
}

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  ControversyTasks.findById(params.id)
    .populate('companyId')
    .populate('analystId')
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((controversyTasks) => controversyTasks ? Object.assign(controversyTasks, body).save() : null)
    .then((controversyTasks) => controversyTasks ? controversyTasks.view(true) : null)
    .then(success(res))
    .catch(next)

export const updateControversyTask = ({ user, bodymen: { body }, params }, res, next) => {
  ControversyTasks.updateOne({"_id": body.taskId}, { $set: { analystId: body.analystId } })
  .then((result) => {
    return res.status(200).json({ status: "200", message: "Updated controversy task!" });
  })
  .catch((error) => {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to update controversy task!" });
  })
} 

export const destroy = ({ user, params }, res, next) =>
  ControversyTasks.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((controversyTasks) => controversyTasks ? controversyTasks.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const newControversyTask = async ({ user, bodymen: { body } }, res, next) => {
  await ControversyTasks.findOne({ status: true }).sort({ createdAt: -1 }).limit(1)
    .then(async (taskObject) => {
      let controversyTaskDetails = [], newTaskNumber, taskNumber;
      if (taskObject) {
        let lastTaskNumber = taskObject.taskNumber.split('DT')[1];
        newTaskNumber = Number(lastTaskNumber) + 1;
      } else {
        newTaskNumber = 1;
      }
      for (let index = 0; index < body.company.length; index++) {
        taskNumber = 'DT' + newTaskNumber;
        let controversyObject = {
          taskNumber: taskNumber,
          companyId: body.company[index].id ? body.company[index].id : null,
          analystId: body.analyst.value ? body.analyst.value : null,
          taskStatus: 'Yet to Work',
          status: true,
          canGenerateJson: true, 
          isJsonGenerated: false,
          createdBy: user
        }
        controversyTaskDetails.push(controversyObject);
        newTaskNumber = newTaskNumber + 1;
        await ControversyTasks.create(controversyObject)
          .then((controversyTaskDetail) => {
            console.log('');
          })
          .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create group!' }) });
      }
      res.status(200).json({ status: (200), message: 'controversy task created success', data: controversyTaskDetails });
    })
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create group!' })
    })
}

export const allocateTasksFromJson = async ({ user, params }, res, next) => {
  try {
    fs.readFile(__dirname + '/controversy_task_allocation.json', async (err, data) => {
      if (err) throw err;
      let allTaskList = JSON.parse(data);
      for (let index = 0; index < allTaskList.length; index++) {
        let completeUserDetails = await User.find({ email: allTaskList[index].analystEmail, status: true });
        let companyDetail = await Companies.find({ cin: allTaskList[index].cin, status: true });
        let controversyObject = {
        taskNumber: `CT${index+1}`,
        companyId: companyDetail[0].id,
        analystId: completeUserDetails[0].id,
        taskStatus: 'Completed',
        createdBy: user.id
        }
        await ControversyTasks.create(controversyObject)
        .then(async(controversyTaskDtl) => {
          let taskHistoriesObject = {
            taskId: controversyTaskDtl._id,
            companyId: controversyTaskDtl.companyId,
            analystId: controversyTaskDtl.analystId,
            stage: 'Assigned',
            createdBy: user.id,
          }
          await Controversy.updateMany({ companyId: controversyTaskDtl.companyId,isActive: true, status: true}, { $set: { taskId: controversyTaskDtl._id } })
          await ControversyTaskHistories.create(taskHistoriesObject)
        });
      }
      return res.status(200).json({ status: "200", message: "Controversy tasks created sucessfully" })
    })
  } catch (error) {
    return res.status(400).json({ status: "400", message: "Failed to create the controversy tasks" })
  }
}