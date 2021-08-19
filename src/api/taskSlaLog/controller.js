import { success, notFound, authorOrAdmin } from '../../services/response/'
import { TaskSlaLog } from '.'
import { TaskAssignment } from '../taskAssignment'
import { User } from '../user'
import { Notifications } from '../notifications'

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
    await TaskAssignment.findOne({_id: body.taskId, status: true })
    .populate('groupId')
    .populate('analystId')
    .populate('qaId')
    .then(async(taskDetail) => {
      if (taskDetail) {
        let taskObject = {
          taskId: body.taskId,
          requestedBy: "",
          days: body.days,
          isAccepted: false,
          status: true,
          createdBy: user
        }
        if (taskDetail.analystId == user) {
          taskObject.requestedBy = "Analyst";
        } else if (taskDetail.qaId == user) {
          taskObject.requestedBy = "QA";
        }
        await TaskSlaLog.create(taskObject)
        .then(async(response) => {
          await Notifications.create({
            notifyToUser: taskDetail.groupId ? taskDetail.groupId.groupAdmin : null,
            notificationType: '/tasks',
            content: `${user.name ? user.name : 'Employee'} has raised SLA extension request for ${body.days ? body.days : ''} days of TaskID - ${taskObject.taskNumber ? taskObject.taskNumber : ''}`,
            notificationTitle: `${taskObject.requestedBy} SLA extension requested`,
            isRead: false,
            status: true
          })
          .then((notify) => {
            if (notify) {
              return res.status(200).json({ status: 200, message: "Sla extension request sucessful!", data: response });  
            } else {
              return res.status(500).json({ status: "500", message: 'Failed to send SLA extension notification!' });  
            }
          })
          .catch((error) => {
            return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to send SLA extension notification!' });
          })
        })
        .catch((error) => {
          res.status(400).json({ status: 400, message: error.message ? error.message : 'Failed to add SLA extension request!' });
        })
      } else {
        res.status(500).json({ status: 500, message: "Task not found!"});
      }
    })
    .catch((error) => {
      return res.status(500).json({ status: "400", message: error.message ? error.message : "Task not found!" });
    });
    
  } catch (error) {
    res.status(500).json({ status: (500), message: " No task details available please check!"});        
  }
}