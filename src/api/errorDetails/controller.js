import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ErrorDetails } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  ErrorDetails.create({ ...body, createdBy: user })
    .then((errorDetails) => errorDetails.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ErrorDetails.count(query)
    .then(count => ErrorDetails.find(query, select, cursor)
      .populate('createdBy')
      .populate('errorTypeId')
      .populate('taskId')
      .populate('datapointsId')
      .populate('categoryId')
      .populate('companyId')
      .then((errorDetails) => ({
        count,
        rows: errorDetails.map((errorDetails) => errorDetails.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  ErrorDetails.findById(params.id)
    .populate('createdBy')
    .populate('errorTypeId')
    .populate('taskId')
    .populate('datapointsId')
    .populate('categoryId')
    .populate('companyId')
    .then(notFound(res))
    .then((errorDetails) => errorDetails ? errorDetails.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  ErrorDetails.findById(params.id)
    .populate('createdBy')
    .populate('errorTypeId')
    .populate('taskId')
    .populate('datapointsId')
    .populate('categoryId')
    .populate('companyId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((errorDetails) => errorDetails ? Object.assign(errorDetails, body).save() : null)
    .then((errorDetails) => errorDetails ? errorDetails.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  ErrorDetails.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((errorDetails) => errorDetails ? errorDetails.remove() : null)
    .then(success(res, 204))
    .catch(next)
