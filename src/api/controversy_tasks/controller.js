import { success, notFound } from '../../services/response/'
import { Companies } from '../companies'
import { User } from '../user'
import { ControversyTasks } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  ControversyTasks.create({ ...body, createdBy: user})
    .then((controversyTasks) => controversyTasks.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = async({ querymen: { query, select, cursor } }, res, next) => {
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
            object.company= controversyTasks[cIndex].companyId ? controversyTasks[cIndex].companyId.companyName : '';
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

export const show = ({ params }, res, next) =>
  ControversyTasks.findById(params.id)
  .populate('companyId')
  .populate('analystId')
  .populate('createdBy')
    .then(notFound(res))
    .then((controversyTasks) => controversyTasks ? controversyTasks.view() : null)
    .then(success(res))
    .catch(next)

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
        let lastTaskNumber = taskObject.tasknumber.split('DT')[1];
        newTaskNumber = Number(lastTaskNumber) + 1;
      } else {
        newTaskNumber = 1;
      }
      for (let index = 0; index < body.companiesList.length; index++) {
        taskNumber = 'DT' + newTaskNumber;
        let controversyObject = {
          tasknumber: taskNumber,
          companyId: body.companiesList[index],
          analystId: body.analystId,
          taskStatus: 'Yet to Work',
          status: true,
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