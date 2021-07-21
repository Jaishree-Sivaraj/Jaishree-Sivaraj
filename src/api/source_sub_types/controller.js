import { success, notFound } from '../../services/response/'
import { SourceSubTypes } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  SourceSubTypes.create(body)
    .then((sourceSubTypes) => sourceSubTypes.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  SourceSubTypes.count(query)
    .then(count => SourceSubTypes.find(query, select, cursor)
      .then((sourceSubTypes) => ({
        count,
        rows: sourceSubTypes.map((sourceSubTypes) => sourceSubTypes.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  SourceSubTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceSubTypes) => sourceSubTypes ? sourceSubTypes.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  SourceSubTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceSubTypes) => sourceSubTypes ? Object.assign(sourceSubTypes, body).save() : null)
    .then((sourceSubTypes) => sourceSubTypes ? sourceSubTypes.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  SourceSubTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceSubTypes) => sourceSubTypes ? sourceSubTypes.remove() : null)
    .then(success(res, 204))
    .catch(next)
