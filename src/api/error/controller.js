import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Errors } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Errors.create({ ...body, createdBy: user })
    .then((error) => error.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Errors.count(query)
    .then(count => Errors.find(query, select, cursor)
      .populate('createdBy')
      .then((errors) => ({
        count,
        rows: errors.map((error) => error.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Errors.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((error) => error ? error.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Errors.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((error) => error ? Object.assign(error, body).save() : null)
    .then((error) => error ? error.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Errors.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((error) => error ? error.remove() : null)
    .then(success(res, 204))
    .catch(next)
