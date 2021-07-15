import { success, notFound } from '../../services/response/'
import { Categories } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  Categories.create(body)
    .then((categories) => categories.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Categories.count(query)
    .then(count => Categories.find(query, select, cursor)
      .then((categories) => ({
        count,
        rows: categories.map((categories) => categories.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Categories.findById(params.id)
    .then(notFound(res))
    .then((categories) => categories ? categories.view() : null)
    .then(success(res))
    .catch(next)

export const getTaxonomyCategories = ({ params }, res, next) => {
  Categories.count({ clientTaxonomyId: params.clientTaxonomyId ? params.clientTaxonomyId : null, status: true })
    .then(count => Categories.find({ clientTaxonomyId: params.clientTaxonomyId ? params.clientTaxonomyId : null })
      .then((categories) => ({
        count,
        rows: categories.map((categories) => categories.view())
      }))
    )
    .then(success(res))
    .catch(next)
}

export const update = ({ bodymen: { body }, params }, res, next) =>
  Categories.findById(params.id)
    .then(notFound(res))
    .then((categories) => categories ? Object.assign(categories, body).save() : null)
    .then((categories) => categories ? categories.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Categories.findById(params.id)
    .then(notFound(res))
    .then((categories) => categories ? categories.remove() : null)
    .then(success(res, 204))
    .catch(next)
