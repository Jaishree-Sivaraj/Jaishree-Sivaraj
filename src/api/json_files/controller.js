import { success, notFound } from '../../services/response/'
import { JsonFiles } from '.'
import { CompaniesTasks } from "../companies_tasks";
import { ControversyTasks } from "../controversy_tasks"
import * as AWS from 'aws-sdk'
import { DerivedDatapoints } from '../derived_datapoints'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { Companies } from '../companies'

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
    console.log('companiesTasks', JSON.stringify(companiesTasks, null, 3))
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
  }).populate({
    path: 'companyId',
    populate: {
      path: 'clientTaxonomyId'
    }
  }).then(async (files) => {
    console.log('files', files);
    for (let index = 0; index < files.length; index++) {
      var obj = {
        "companyId": files[index].companyId ? files[index].companyId.id : null,
        "companyName": files[index].companyId ? files[index].companyId.companyName : null,
        "generatedDate": files[index].updatedAt,
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




export const generateJson = async ({ bodymen: { body } }, res, next) => {
  if (body.type && body.type === 'data') {
    let companyID = body.companyId ? body.companyId : '';
    let companyDetails = await Companies.findById(companyID).populate('clientTaxonomyId');
    console.log('companyDetails', JSON.stringify(companyDetails, null, 3));
    let requiredDataPoints = await Datapoints.find({ clientTaxonomyId: companyDetails.clientTaxonomyId.id, standaloneOrMatrix: { "$ne": "Matrix" }, functionId: { "$ne": '609bcceb1d64cd01eeda092c' }, status: true }).distinct('_id');
    let jsonResponseObject = {
      companyName: companyDetails.companyName ? companyDetails.companyName : '',
      companyID: companyDetails.cin ? companyDetails.cin : '',
      NIC_CODE: companyDetails.nicCode ? companyDetails.nicCode : '',
      NIC_industry: companyDetails.nicIndustry ? companyDetails.nicIndustry : '',
      fiscalYear: [
        [
          {
            year: body.year,
            Data: []
          }
        ]
      ]
    }
    await StandaloneDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: body.year, status: true, companyId: companyID }).populate('datapointId').then((result) => {
      console.log('StandaloneDatapoints', result);
      if (result.length > 0) {
        for (let index = 0; index < result.length; index++) {
          const element = result[index];
          let objectToPush = {
            Year: element.year,
            DPCode: element.datapointId.code,
            Response: element.response,
            PerformanceResponse: element.performanceResult
          }
          jsonResponseObject.fiscalYear[0][0].Data.push(objectToPush);
        }
      }
    });
    await DerivedDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: body.year, status: true, companyId: companyID }).populate('datapointId').then((result) => {
      console.log('DerivedDatapoints', result);
      if (result.length > 0) {
        for (let index = 0; index < result.length; index++) {
          const element = result[index];
          let objectToPush = {
            Year: element.year,
            DPCode: element.datapointId.code,
            Response: element.response,
            PerformanceResponse: element.performanceResult
          }
          jsonResponseObject.fiscalYear[0][0].Data.push(objectToPush);
        }
      }
    });
    console.log('jsonResponseObject', JSON.stringify(jsonResponseObject, null, 3));
    await storeFileInS3(jsonResponseObject, 'data', body.companyId, body.year).then(function (s3File) {
      console.log('s3', s3File);
      JsonFiles.updateOne({ companyId: companyID }, { $set: { url: s3File.Location } })

    }).catch(function (err) {
      console.log('err', err);
    });
  } if (body.type && body.type === 'controversy') {
    //call api http://65.1.140.116:9010/controversies/json/60cad1c1b09656fa3611490d
  }
}

export const downloadJson = async ({ params }, res, next) => {

}


function storeFileInS3(actualJson, type, companyId, year) {
  return new Promise(function (resolve, reject) {
    var fileName = `${companyId}_${year ? year + '_' : ''}${Date.now()}.json`;
    AWS.config.update({
      accessKeyId: 'AKIA2B53Z7RFPSTPWYOL', //read from env
      secretAccessKey: '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',
      signatureVersion: 'v4',
      region: 'ap-south-1'
    })
    const s3 = new AWS.S3({
      accessKeyId: 'AKIA2B53Z7RFPSTPWYOL',
      secretAccessKey: 'aXk39XeAwJnP/tD5rPp/ei0hRPrRkq1MY9HZqBk7'
    });
    const params = {
      Bucket: 'esgdsdatajsonfiles', // pass your bucket name
      Key: type + '/' + fileName, // file will be saved in <folderName> folder
      Body: Buffer.from(JSON.stringify(actualJson))
    };
    s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err)
      } else {
        console.log(`File uploaded successfully at ${data.Location}`);
        resolve(data);
      }
    });
  })
}