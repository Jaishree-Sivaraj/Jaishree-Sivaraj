import { success, notFound } from '../../services/response/'
import { CompanySources } from '.'
import { result } from 'lodash'

export const create = ({ user, bodymen: { body } }, res, next) =>
  CompanySources.create({ ...body, createdBy: user })
    .then((companySources) => companySources.view(true))
    .then(success(res, 201))
    .catch(next)

/*var storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, '../uploads/sources')
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});*/

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  CompanySources.count(query)
    .then(count => CompanySources.find(query, select, cursor)
      //.populate('sourceTypeId')  
      .then((companySources) => ({
        count,
        rows: companySources.map((companySources) => companySources.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  CompanySources.findById(params.id)
    .populate('sourceTypeId')
    .then(notFound(res))
    .then((companySources) => companySources ? companySources.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  CompanySources.findById(params.id)
    .populate('sourceTypeId')
    .then(notFound(res))
    .then((companySources) => companySources ? Object.assign(companySources, body).save() : null)
    .then((companySources) => companySources ? companySources.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  CompanySources.findById(params.id)
    .then(notFound(res))
    .then((companySources) => companySources ? companySources.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const getDocumentsByCompanyId = ({ params }, res, next) =>
  CompanySources.find({ companyId: params.companyId }).then((result) => {
    res.send(result, 200);
  }).catch(next)