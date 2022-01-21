import { success, notFound } from '../../services/response/'
import { Conversiontypes } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  Conversiontypes.create(body)
    .then((conversiontypes) => conversiontypes.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Conversiontypes.count(query)
    .then(count => Conversiontypes.find(query, select, cursor)
      .then((conversiontypes) => ({
        count,
        rows: conversiontypes.map((conversiontypes) => conversiontypes.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Conversiontypes.findById(params.id)
    .then(notFound(res))
    .then((conversiontypes) => conversiontypes ? conversiontypes.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  Conversiontypes.findById(params.id)
    .then(notFound(res))
    .then((conversiontypes) => conversiontypes ? Object.assign(conversiontypes, body).save() : null)
    .then((conversiontypes) => conversiontypes ? conversiontypes.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Conversiontypes.findById(params.id)
    .then(notFound(res))
    .then((conversiontypes) => conversiontypes ? conversiontypes.remove() : null)
    .then(success(res, 204))
    .catch(next)
