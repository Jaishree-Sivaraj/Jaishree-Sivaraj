import { success, notFound, authorOrAdmin } from '../../services/response/'
import { UomConversions } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  UomConversions.create({ ...body, createdBy: user })
    .then((uomConversions) => uomConversions.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  UomConversions.count(query)
    .then(count => UomConversions.find(query, select, cursor)
      .populate('createdBy')
      .then((uomConversions) => ({
        count,
        rows: uomConversions.map((uomConversions) => uomConversions.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  UomConversions.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((uomConversions) => uomConversions ? uomConversions.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  UomConversions.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((uomConversions) => uomConversions ? Object.assign(uomConversions, body).save() : null)
    .then((uomConversions) => uomConversions ? uomConversions.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  UomConversions.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((uomConversions) => uomConversions ? uomConversions.remove() : null)
    .then(success(res, 204))
    .catch(next)
