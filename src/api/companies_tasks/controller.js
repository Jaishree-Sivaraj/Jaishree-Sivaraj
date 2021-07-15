import { success, notFound, authorOrAdmin } from '../../services/response/'
import { CompaniesTasks } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  CompaniesTasks.create({ ...body, createdBy: user })
    .then((companiesTasks) => companiesTasks.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  CompaniesTasks.count(query)
    .then(count => CompaniesTasks.find(query, select, cursor)
    .populate('taskId')
    .populate('companyId')
    .populate('categoryId')
    .populate('createdBy')
      .then((companiesTasks) => ({
        count,
        rows: companiesTasks.map((companiesTasks) => companiesTasks.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  CompaniesTasks.findById(params.id)
  .populate('taskId')
  .populate('companyId')
  .populate('categoryId')
  .populate('createdBy')
    .then(notFound(res))
    .then((companiesTasks) => companiesTasks ? companiesTasks.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  CompaniesTasks.findById(params.id)
  .populate('taskId')
  .populate('companyId')
  .populate('categoryId')
  .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companiesTasks) => companiesTasks ? Object.assign(companiesTasks, body).save() : null)
    .then((companiesTasks) => companiesTasks ? companiesTasks.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  CompaniesTasks.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companiesTasks) => companiesTasks ? companiesTasks.remove() : null)
    .then(success(res, 204))
    .catch(next)
