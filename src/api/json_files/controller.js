import { success, notFound } from '../../services/response/'
import { JsonFiles } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  JsonFiles.create(body)
    .then((jsonFiles) => jsonFiles.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  JsonFiles.count(query)
    .then(count => JsonFiles.find(query, select, cursor)
      .populate('companyId')
      .then((jsonFiles) => ({
        count,
        rows: jsonFiles.map((jsonFiles) => jsonFiles.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  JsonFiles.findById(params.id)
    .populate('companyId')
    .then(notFound(res))
    .then((jsonFiles) => jsonFiles ? jsonFiles.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  JsonFiles.findById(params.id)
    .populate('companyId')
    .then(notFound(res))
    .then((jsonFiles) => jsonFiles ? Object.assign(jsonFiles, body).save() : null)
    .then((jsonFiles) => jsonFiles ? jsonFiles.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  JsonFiles.findById(params.id)
    .then(notFound(res))
    .then((jsonFiles) => jsonFiles ? jsonFiles.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const retrieveJsonFiles = async ( {params}, res, next) => {
  try {
    await JsonFiles.find({
      'type': params.type, 
      'status': true})
      .then((files) => {
        return res.status(200).json({ status: "200", message: "Json files retrieved successfully!", data: files ? files : [] });
      })
      .catch((error) => { 
        return res.status(500).json({ status: "500", message: error.message ? error.message : `No ${params.type} type json records available!` }) ;
      });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : `No ${params.type} type json records available!` }) ;    
  }
}