import { success, notFound } from '../../services/response/'
import { TaskHistories } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  TaskHistories.create(body)
    .then((taskHistories) => taskHistories.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  TaskHistories.count(query)
    .then(count => TaskHistories.find(query, select, cursor)
      .then((taskHistories) => ({
        count,
        rows: taskHistories.map((taskHistories) => taskHistories.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  TaskHistories.findById(params.id)
    .then(notFound(res))
    .then((taskHistories) => taskHistories ? taskHistories.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  TaskHistories.findById(params.id)
    .then(notFound(res))
    .then((taskHistories) => taskHistories ? Object.assign(taskHistories, body).save() : null)
    .then((taskHistories) => taskHistories ? taskHistories.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  TaskHistories.findById(params.id)
    .then(notFound(res))
    .then((taskHistories) => taskHistories ? taskHistories.remove() : null)
    .then(success(res, 204))
    .catch(next)
