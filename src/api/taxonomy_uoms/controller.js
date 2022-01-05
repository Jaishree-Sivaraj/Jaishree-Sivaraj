import { success, notFound, authorOrAdmin } from '../../services/response/'
import { TaxonomyUoms } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  TaxonomyUoms.create({ ...body, createdBy: user })
    .then((taxonomyUoms) => taxonomyUoms.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  TaxonomyUoms.count(query)
    .then(count => TaxonomyUoms.find(query, select, cursor)
      .populate('createdBy')
      .then((taxonomyUoms) => ({
        count,
        rows: taxonomyUoms.map((taxonomyUoms) => taxonomyUoms.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  TaxonomyUoms.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((taxonomyUoms) => taxonomyUoms ? taxonomyUoms.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  TaxonomyUoms.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taxonomyUoms) => taxonomyUoms ? Object.assign(taxonomyUoms, body).save() : null)
    .then((taxonomyUoms) => taxonomyUoms ? taxonomyUoms.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  TaxonomyUoms.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taxonomyUoms) => taxonomyUoms ? taxonomyUoms.remove() : null)
    .then(success(res, 204))
    .catch(next)
