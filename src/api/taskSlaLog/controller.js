import { success, notFound, authorOrAdmin } from '../../services/response/'
import { TaskSlaLog } from '.'

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
