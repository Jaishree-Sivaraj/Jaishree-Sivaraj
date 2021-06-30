import { success, notFound } from '../../services/response/'
import { BatchWisePillarAssignment } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  BatchWisePillarAssignment.create(body)
    .then((batchWisePillarAssignment) => batchWisePillarAssignment.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  BatchWisePillarAssignment.count(query)
    .then(count => BatchWisePillarAssignment.find(query, select, cursor)
      .then((batchWisePillarAssignments) => ({
        count,
        rows: batchWisePillarAssignments.map((batchWisePillarAssignment) => batchWisePillarAssignment.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  BatchWisePillarAssignment.findById(params.id)
    .then(notFound(res))
    .then((batchWisePillarAssignment) => batchWisePillarAssignment ? batchWisePillarAssignment.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  BatchWisePillarAssignment.findById(params.id)
    .then(notFound(res))
    .then((batchWisePillarAssignment) => batchWisePillarAssignment ? Object.assign(batchWisePillarAssignment, body).save() : null)
    .then((batchWisePillarAssignment) => batchWisePillarAssignment ? batchWisePillarAssignment.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  BatchWisePillarAssignment.findById(params.id)
    .then(notFound(res))
    .then((batchWisePillarAssignment) => batchWisePillarAssignment ? batchWisePillarAssignment.remove() : null)
    .then(success(res, 204))
    .catch(next)
