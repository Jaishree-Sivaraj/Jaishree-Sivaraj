import { success, notFound, authorOrAdmin } from '../../services/response/'
import { UserPillarAssignments } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  UserPillarAssignments.create({ ...body, createdBy: user })
    .then((userPillarAssignments) => userPillarAssignments.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  UserPillarAssignments.count(query)
    .then(count => UserPillarAssignments.find(query, select, cursor)
    .populate('clientTaxonomyId')
    .populate('primaryPillar')
    .populate('secondaryPillar')
    .populate('userId')
    .populate('createdBy')
      .then((userPillarAssignments) => ({
        count,
        rows: userPillarAssignments.map((userPillarAssignments) => userPillarAssignments.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  UserPillarAssignments.findById(params.id)
  .populate('clientTaxonomyId')
  .populate('primaryPillar')
  .populate('secondaryPillar')
  .populate('userId')
  .populate('createdBy')
    .then(notFound(res))
    .then((userPillarAssignments) => userPillarAssignments ? userPillarAssignments.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  UserPillarAssignments.findById(params.id)
  .populate('clientTaxonomyId')
  .populate('primaryPillar')
  .populate('secondaryPillar')
  .populate('userId')
  .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((userPillarAssignments) => userPillarAssignments ? Object.assign(userPillarAssignments, body).save() : null)
    .then((userPillarAssignments) => userPillarAssignments ? userPillarAssignments.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  UserPillarAssignments.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((userPillarAssignments) => userPillarAssignments ? userPillarAssignments.remove() : null)
    .then(success(res, 204))
    .catch(next)
