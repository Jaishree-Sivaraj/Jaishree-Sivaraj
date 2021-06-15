import { success, notFound } from '../../services/response/'
import { SourceTypes } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  SourceTypes.create(body)
    .then((sourceTypes) => sourceTypes.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  SourceTypes.count(query)
    .then(count => SourceTypes.find(query, select, cursor)
      .then((sourceTypes) => ({
        count,
        rows: sourceTypes.map((sourceTypes) => sourceTypes.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  SourceTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceTypes) => sourceTypes ? sourceTypes.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  SourceTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceTypes) => sourceTypes ? Object.assign(sourceTypes, body).save() : null)
    .then((sourceTypes) => sourceTypes ? sourceTypes.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  SourceTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceTypes) => sourceTypes ? sourceTypes.remove() : null)
    .then(success(res, 204))
    .catch(next)
