import { success, notFound, authorOrAdmin } from '../../services/response/'
import { TaskSlaLog } from '.'
import { TaskAssignment } from '../taskAssignment'
import { User } from '../user'
import { populate } from 'mongoose/lib/utils'

export const create = ({ user, bodymen: { body } }, res, next) =>
  TaskSlaLog.create({ ...body, createdBy: user })
    .then((taskSlaLog) => taskSlaLog.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  TaskSlaLog.count(query)
    .then(count => TaskSlaLog.find(query, select, cursor)
    .populate('taskId')
    .populate('createdBy')
      .then((taskSlaLogs) => ({
        count,
        rows: taskSlaLogs.map((taskSlaLog) => taskSlaLog.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  TaskSlaLog.findById(params.id)
  .populate('taskId')
  .populate('createdBy')
    .then(notFound(res))
    .then((taskSlaLog) => taskSlaLog ? taskSlaLog.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  TaskSlaLog.findById(params.id)
  .populate('taskId')
  .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taskSlaLog) => taskSlaLog ? Object.assign(taskSlaLog, body).save() : null)
    .then((taskSlaLog) => taskSlaLog ? taskSlaLog.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  TaskSlaLog.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taskSlaLog) => taskSlaLog ? taskSlaLog.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const slaDateExtensionRequest = async ({user, body}, res, next) => {
  try {
    let taskDetails = await TaskAssignment.find({_id: body.taskId, status: true })
    .populate('analystId')
    .populate('qaId');
    taskDetails.find({})
    console.log("Task Details", taskDetails);
    if (taskDetails) {
      let taskUpdateObject = {
        taskId: body.taskId,
        requestedBy: user.name,
        days: body.days
      }
      await TaskSlaLog.create(taskUpdateObject)
      .then((response) => {
        return res.status(200).json({ status: (200), message: "sla extension request stored sucessfully!", data: response});
      })
      .catch((error) => {
        res.status(400).json({ status: (400), message: error.message ? error.message : ''});
      })
    } else {
      res.status(500).json({ status: (500), message: "No task details available please check!"});
    }
    
  } catch (error) {
    res.status(500).json({ status: (500), message: " No task details available please check!"});        
  }
}