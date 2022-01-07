import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Measures } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Measures.create({ ...body, createdBy: user })
    .then((measures) => measures.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Measures.count(query)
    .then(count => Measures.find(query, select, cursor)
      .populate('createdBy')
      .then((measures) => ({
        count,
        rows: measures.map((measures) => measures.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Measures.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((measures) => measures ? measures.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Measures.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((measures) => measures ? Object.assign(measures, body).save() : null)
    .then((measures) => measures ? measures.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Measures.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((measures) => measures ? measures.remove() : null)
    .then(success(res, 204))
    .catch(next)
