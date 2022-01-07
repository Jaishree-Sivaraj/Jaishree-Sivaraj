import { success, notFound } from '../../services/response/'
import { PlaceValues } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  PlaceValues.create(body)
    .then((placeValues) => placeValues.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  PlaceValues.count(query)
    .then(count => PlaceValues.find(query, select, cursor)
      .then((placeValues) => ({
        count,
        rows: placeValues.map((placeValues) => placeValues.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  PlaceValues.findById(params.id)
    .then(notFound(res))
    .then((placeValues) => placeValues ? placeValues.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  PlaceValues.findById(params.id)
    .then(notFound(res))
    .then((placeValues) => placeValues ? Object.assign(placeValues, body).save() : null)
    .then((placeValues) => placeValues ? placeValues.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  PlaceValues.findById(params.id)
    .then(notFound(res))
    .then((placeValues) => placeValues ? placeValues.remove() : null)
    .then(success(res, 204))
    .catch(next)
