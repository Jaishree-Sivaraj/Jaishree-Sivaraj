import { success, notFound } from '../../services/response/';
import { ChildDp } from '.';

export const create = ({ bodymen: { body } }, res, next) =>
  ChildDp.create(body)
    .then((childDp) => childDp.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ChildDp.count(query)
    .then(count => ChildDp.find(query, select, cursor)
      .then((childDps) => ({
        count,
        rows: childDps.map((childDp) => childDp.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  ChildDp.findById(params.id)
    .then(notFound(res))
    .then((childDp) => childDpdatapointId? childDp.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  ChildDp.findById(params.id)
    .then(notFound(res))
    .then((childDp) => childDp ? Object.assign(childDp, body).save() : null)
    .then((childDp) => childDp ? childDp.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  ChildDp.findById(params.id)
    .then(notFound(res))
    .then((childDp) => childDp ? childDp.remove() : null)
    .then(success(res, 204))
    .catch(next);


