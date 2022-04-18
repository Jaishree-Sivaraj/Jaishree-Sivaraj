import { success, notFound } from '../../services/response/'
import { Notifications } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  Notifications.create(body)
    .then((notifications) => notifications.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Notifications.count(query)
    .then(count => Notifications.find(query, select, cursor)
      .populate('notifyToUser')
      .then((notifications) => ({
        count,
        rows: notifications.map((notifications) => notifications.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const getMyNotifications = ({ params }, res, next) =>
  Notifications.count({ notifyToUser: params.notifyToUser ? params.notifyToUser : null, isRead: false, createdAt: {
    $gte: new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000)))
  } })
    .then(count => Notifications.find({
      notifyToUser: params.notifyToUser ? params.notifyToUser : null, isRead: false,
      createdAt: {
        $gte: new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000)))
      }
    }).sort({ createdAt: -1 }).limit(10)
      .populate('notifyToUser')
      .then((notifications) => ({
        count,
        rows: notifications.map((notifications) => notifications.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Notifications.findById(params.id)
    .populate('notifyToUser')
    .then(notFound(res))
    .then((notifications) => notifications ? notifications.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  Notifications.findById(params.id)
    .populate('notifyToUser')
    .then(notFound(res))
    .then((notifications) => notifications ? Object.assign(notifications, body).save() : null)
    .then((notifications) => notifications ? notifications.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Notifications.findById(params.id)
    .then(notFound(res))
    .then((notifications) => notifications ? notifications.remove() : null)
    .then(success(res, 204))
    .catch(next)
