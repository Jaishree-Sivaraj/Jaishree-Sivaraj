import { success, notFound } from '../../services/response/'
import { JsonFiles } from '.'
import { CompaniesTasks } from "../companies_tasks";
import { ControversyTasks } from "../controversy_tasks"

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

export const retrieveJsonFiles = async ({ params }, res, next) => {
  try {
    await JsonFiles.find({
      'type': params.type,
      'status': true
    })
      .then((files) => {
        return res.status(200).json({ status: "200", message: "Json files retrieved successfully!", data: files ? files : [] });
      })
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message : `No ${params.type} type json records available!` });
      });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : `No ${params.type} type json records available!` });
  }
}

export const payLoadGenerationDetails = async ({ params }, res, next) => {
  console.log('params', params);
  let response = { pendingCompaniesData: [], completedCompaniesData: [] };
  if (params.type == 'data') {
    var companiesTasks = await CompaniesTasks.find({ canGenerateJson: true, isJsonGenerated: false, status: true }).populate('categoryId').populate({
      path: 'companyId',
      populate: {
        path: 'clientTaxonomyId'
      }
    });
    for (let index = 0; index < companiesTasks.length; index++) {
      let obj = {
        "companyId": companiesTasks[index].companyId ? companiesTasks[index].companyId.id : null,
        "companyName": companiesTasks[index].companyId ? companiesTasks[index].companyId.companyName : null,
        "modifiedDate": companiesTasks[index].updatedAt,
        "taxonomyId": (companiesTasks[index].companyId && companiesTasks[index].companyId.clientTaxonomyId) ? companiesTasks[index].companyId.clientTaxonomyId.id : null,
        "taxonomyName": (companiesTasks[index].companyId && companiesTasks[index].companyId.clientTaxonomyId) ? companiesTasks[index].companyId.clientTaxonomyId.taxonomyName : null,
        "year": companiesTasks[index].year
      }
      response.pendingCompaniesData.push(obj);
    }
  } else if (params.type == 'controversy') {
    var controversyTasks = await ControversyTasks.find({ canGenerateJson: true, isJsonGenerated: false, status: true }).populate({
      path: 'companyId',
      populate: {
        path: 'clientTaxonomyId'
      }
    });
    for (let index = 0; index < controversyTasks.length; index++) {
      let obj = {
        "companyId": controversyTasks[index].companyId ? controversyTasks[index].companyId.id : null,
        "companyName": controversyTasks[index].companyId ? controversyTasks[index].companyId.companyName : null,
        "modifiedDate": controversyTasks[index].updatedAt,
        "taxonomyId": (controversyTasks[index].companyId && controversyTasks[index].companyId.clientTaxonomyId) ? controversyTasks[index].companyId.clientTaxonomyId.id : null,
        "taxonomyName": (controversyTasks[index].companyId && controversyTasks[index].companyId.clientTaxonomyId) ? controversyTasks[index].companyId.clientTaxonomyId.taxonomyName : null
      }
      response.pendingCompaniesData.push(obj);
    }
  }
  await JsonFiles.find({
    'type': params.type,
    'status': true
  }).sort({ cretedAt: -1 }).populate({
    path: 'companyId',
    populate: {
      path: 'clientTaxonomyId'
    }
  }).then(async (files) => {
    for (let index = 0; index < files.length; index++) {
      var obj = {
        "companyId": files[index].companyId ? files[index].companyId.id : null,
        "companyName": files[index].companyId ? files[index].companyId.companyName : null,
        "modifiedDate": files[index].updatedAt,
        "taxonomyId": (files[index].companyId && files[index].companyId.clientTaxonomyId) ? files[index].companyId.clientTaxonomyId.id : null,
        "taxonomyName": (files[index].companyId && files[index].companyId.clientTaxonomyId) ? files[index].companyId.clientTaxonomyId.taxonomyName : null
      }
      if (params.type == 'data') {
        obj.year = files[index].year
      }
      response.completedCompaniesData.push(obj);
    }
    return res.status(200).json({ status: "200", message: "Json files retrieved successfully!", data: response });
  }).catch((error) => {
    return res.status(500).json({ status: "500", message: error.message ? error.message : `No ${params.type} type json records available!` });
  });
}