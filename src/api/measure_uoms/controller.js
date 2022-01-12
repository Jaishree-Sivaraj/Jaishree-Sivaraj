import { success, notFound, authorOrAdmin } from '../../services/response/'
import { MeasureUoms } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  MeasureUoms.create({ ...body, createdBy: user })
    .then((measureUoms) => measureUoms.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  MeasureUoms.count(query)
    .then(count => MeasureUoms.find(query, select, cursor)
      .populate('createdBy')
      .then((measureUoms) => ({
        count,
        rows: measureUoms.map((measureUoms) => measureUoms.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  MeasureUoms.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((measureUoms) => measureUoms ? measureUoms.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  MeasureUoms.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((measureUoms) => measureUoms ? Object.assign(measureUoms, body).save() : null)
    .then((measureUoms) => measureUoms ? measureUoms.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  MeasureUoms.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((measureUoms) => measureUoms ? measureUoms.remove() : null)
    .then(success(res, 204))
    .catch(next)
