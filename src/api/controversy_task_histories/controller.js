import { success, notFound } from '../../services/response/'
import { ControversyTaskHistories } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  ControversyTaskHistories.create(body)
    .then((controversyTaskHistories) => controversyTaskHistories.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ControversyTaskHistories.count(query)
    .then(count => ControversyTaskHistories.find(query, select, cursor)
      .then((controversyTaskHistories) => ({
        count,
        rows: controversyTaskHistories.map((controversyTaskHistories) => controversyTaskHistories.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  ControversyTaskHistories.findById(params.id)
    .then(notFound(res))
    .then((controversyTaskHistories) => controversyTaskHistories ? controversyTaskHistories.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  ControversyTaskHistories.findById(params.id)
    .then(notFound(res))
    .then((controversyTaskHistories) => controversyTaskHistories ? Object.assign(controversyTaskHistories, body).save() : null)
    .then((controversyTaskHistories) => controversyTaskHistories ? controversyTaskHistories.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  ControversyTaskHistories.findById(params.id)
    .then(notFound(res))
    .then((controversyTaskHistories) => controversyTaskHistories ? controversyTaskHistories.remove() : null)
    .then(success(res, 204))
    .catch(next)
