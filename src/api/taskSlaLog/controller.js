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
        console.log(taskDetail.analystId.email == user.email);
        if (taskDetail.analystId.email == user.email) {
          taskObject.requestedBy = "Analyst";
        } else if (taskDetail.qaId.email == user.email) {
          taskObject.requestedBy = "QA";
        }
        await TaskSlaLog.updateMany({ taskId: body.taskId, createdBy: user.id, status: true}, { $set: { status: false } });
        await TaskSlaLog.create(taskObject)
        .then(async(response) => {
          await Notifications.create({
            notifyToUser: taskDetail.groupId ? taskDetail.groupId.groupAdmin : null,
            notificationType: '/tasklist',
            content: `${user.name ? user.name : 'Employee'} has raised SLA extension request for ${body.days ? body.days : ''} of TaskID - ${taskDetail.taskNumber ? taskDetail.taskNumber : ''}`,
            notificationTitle: `SLA extension requested`,
            isRead: false,
            status: true
          })
          .then((notify) => {
            if (notify) {
              return res.status(200).json({ status: 200, message: "Sla extension request successful!", data: response });  
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

export const getAllRequestsOfaTask = async ({user, params}, res, next) => {
  await TaskSlaLog.find({ taskId: params.taskId ? params.taskId : null, isReviewed: false, status: true})
  .then((logs) => {
    //for loop to form the structure
    //TODO
    return res.status(200).json({ status: "200", message: "SLA requests retrieved", data: logs });
  })
}

export const rejectRequest = async ({user, params, bodymen: { body } }, res, next) => {
  await TaskSlaLog.updateOne({_id: params.id}, { $set: { isRejected: true, isReviewed: true } })
  .then(async()=> {
    let taskDetail = await TaskSlaLog.findById(params.id).populate('taskId');
    await Notifications.create({
      notifyToUser: taskDetail.createdBy ? taskDetail.createdBy : null,
      notificationType: '/tasklist',
      content: `Your SLA extension request for TaskID - ${taskDetail.taskId.taskNumber ? taskDetail.taskId.taskNumber : ''}`,
      notificationTitle: 'SLA request rejected',
      isRead: false,
      status: true
    })
    .then((notify) => {
      if (notify) {
        return res.status(200).json({ status: 200, message: "Rejected SLA extension request!" });  
      } else {
        return res.status(500).json({ status: "500", message: 'Failed to send SLA extension reject notification!' });  
      }
    })
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to send SLA extension reject notification!' });
    })
  });
}