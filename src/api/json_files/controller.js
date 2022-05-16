import { success, notFound } from '../../services/response/'
import { JsonFiles } from '.'
import { CompaniesTasks } from "../companies_tasks";
import { Controversy } from "../controversy"
import _ from 'lodash'
import { ControversyTasks } from "../controversy_tasks"
import * as AWS from 'aws-sdk'
import { DerivedDatapoints } from '../derived_datapoints'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { Companies } from '../companies'
import { Cron } from "./cron"

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'ap-south-1'
});

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
  let response = { pendingCompaniesData: [], completedCompaniesData: [] };
  if (params.type == 'data') {
    var companiesTasks = await CompaniesTasks.find({ canGenerateJson: true, isJsonGenerated: false, status: true, overAllCompanyTaskStatus: true }).populate('categoryId').populate({
      path: 'companyId',
      populate: {
        path: 'clientTaxonomyId',
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
      var companyFound = response.pendingCompaniesData.find(function (rec) {
        return (rec.companyId === obj.companyId && rec.year === obj.year)
      })
      if (!companyFound) {
        response.pendingCompaniesData.push(obj);
      }
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
  await JsonFiles.find({ 'type': params.type, 'status': true }).populate({
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
        "taxonomyName": (files[index].companyId && files[index].companyId.clientTaxonomyId) ? files[index].companyId.clientTaxonomyId.taxonomyName : null,
        "fileName": files[index].fileName
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
    let requiredDataPoints = await Datapoints.find({ clientTaxonomyId: companyDetails.clientTaxonomyId.id, isRequiredForJson: true, functionId: { "$ne": '609bcceb1d64cd01eeda092c' }, status: true }).distinct('_id');
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
    await StandaloneDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: body.year, isActive: true, status: true, companyId: companyID }).populate('datapointId').then((result) => {
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
    await DerivedDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: body.year, isActive: true, status: true, companyId: companyID }).populate('datapointId').then((result) => {
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
    await storeFileInS3({ "message": "Success.", "status": 200, "data": jsonResponseObject }, 'data', body.companyId, body.year).then(async function (s3Data) {
      console.log('se', s3Data);
      let jsonFileObject = {
        companyId: companyID,
        year: body.year,
        url: s3Data.data.Location,
        type: 'data',
        fileName: s3Data.fileName,
        status: true
      }
      await JsonFiles.updateOne({ companyId: companyID, year: body.year }, { $set: jsonFileObject }, { upsert: true })
        .then(async (updatedJsonfiles) => {
          await CompaniesTasks.updateMany({ companyId: companyID, year: body.year }, { $set: { canGenerateJson: false, isJsonGenerated: true } })
            .then(async (updatedCompaniesTasks) => {
              return res.status(200).json({ status: "200", message: body.type.toUpperCase() + " Json generated successfully!" });
            }).catch(function (err) {
              return res.status(500).json({ status: "500", message: err.message ? err.message : `errror while updating compines tasks ` });
            })
        }).catch(function (err) {
          return res.status(500).json({ status: "500", message: err.message ? err.message : `errror while updating json files ` });
        })
    }).catch(function (err) {
      return res.status(500).json({ status: "500", message: err.message ? err.message : `errror while storing json files ` });
    });
  } else if (body.type && body.type === 'controversy') {
    let companyDetails = await Companies.findOne({ _id: body.companyId, status: true }).populate('clientTaxonomyId');
    if (companyDetails) {
      let controversyJsonDatapoints = await Datapoints.find({ clientTaxonomyId: companyDetails.clientTaxonomyId.id, functionId: { $eq: "609bcceb1d64cd01eeda092c" }, isRequiredForJson: true, status: true }).distinct('_id');
      let companyControversyYears = await Controversy.find({ companyId: body.companyId, isActive: true, status: true }).distinct('year');
      let responseObject = {
        companyName: companyDetails.companyName,
        CIN: companyDetails.cin,
        data: [],
        status: 200
      };
      if (companyControversyYears.length > 0) {
        for (let yearIndex = 0; yearIndex < companyControversyYears.length; yearIndex++) {
          const year = companyControversyYears[yearIndex];
          let yearwiseData = {
            year: year,
            companyName: companyDetails.companyName,
            Data: []
          };
          let companyControversiesYearwise = await Controversy.find({ companyId: body.companyId, year: year, datapointId: { $in: controversyJsonDatapoints }, isActive: true, status: true })
            .populate('createdBy')
            .populate('companyId')
            .populate('datapointId');
          if (companyControversiesYearwise.length > 0) {
            let uniqDatapoints = _.uniqBy(companyControversiesYearwise, 'datapointId');
            for (let index = 0; index < uniqDatapoints.length; index++) {
              let element = uniqDatapoints[index];
              let singleControversyDetail = companyControversiesYearwise.find((obj) => obj.datapointId.id == element.datapointId.id)
              let datapointControversies = _.filter(companyControversiesYearwise, { datapointId: element.datapointId });
              let dataObject = {
                Dpcode: singleControversyDetail.datapointId.code,
                Year: singleControversyDetail.year,
                ResponseUnit: singleControversyDetail.response,
                controversy: []
              }
              let currentResponseValue;
              if (singleControversyDetail.response == 'Very High') {
                currentResponseValue = 4;
              } else if (singleControversyDetail.response == 'High') {
                currentResponseValue = 3;
              } else if (singleControversyDetail.response == 'Medium') {
                currentResponseValue = 2;
              } else if (singleControversyDetail.response == 'Low') {
                currentResponseValue = 1;
              } else {
                currentResponseValue = 0;
              }
              if (datapointControversies.length > 0) {
                for (let dpControIndex = 0; dpControIndex < datapointControversies.length; dpControIndex++) {
                  if (singleControversyDetail.response != '' && singleControversyDetail.response != ' ') {
                    let dpObj = datapointControversies[dpControIndex];
                    let responseValue;
                    dataObject.controversy.push({
                      sourceName: dpObj.sourceName,
                      sourceURL: dpObj.sourceURL,
                      Textsnippet: dpObj.textSnippet,
                      sourcePublicationDate: dpObj.sourcePublicationDate
                    })
                    if (dpObj.response == 'Very High') {
                      responseValue = 4;
                    } else if (dpObj.response == 'High') {
                      responseValue = 3;
                    } else if (dpObj.response == 'Medium') {
                      responseValue = 2;
                    } else if (dpObj.response == 'Low') {
                      responseValue = 1;
                    } else {
                      responseValue = 0;
                    }
                    if (responseValue > currentResponseValue) {
                      if (responseValue == 4) {
                        dataObject.ResponseUnit = 'Very High';
                      } else if (responseValue == 3) {
                        dataObject.ResponseUnit = 'High';
                      } else if (responseValue == 2) {
                        dataObject.ResponseUnit = 'Medium';
                      } else if (responseValue == 1) {
                        dataObject.ResponseUnit = 'Low';
                      }
                    }
                  }
                }
              }
              yearwiseData.Data.push(dataObject);
            }
          }
          responseObject.data.push(yearwiseData)
        }
      }
      await storeFileInS3(responseObject, 'controversy', body.companyId).then(async function (s3Data) {
        let jsonFileObject = {
          companyId: body.companyId,
          url: s3Data.data.Location,
          type: 'controversy',
          fileName: s3Data.fileName,
          status: true
        }
        await JsonFiles.updateOne({ companyId: body.companyId }, { $set: jsonFileObject }, { upsert: true })
          .then(async (updatedJsonfiles) => {
            await ControversyTasks.updateOne({ companyId: body.companyId }, { $set: { canGenerateJson: false, isJsonGenerated: true } })
              .then(async (updatedControversyTasks) => {
                return res.status(200).json({ status: "200", message: body.type.toUpperCase() + " Json generated successfully!" });
              }).catch(function (err) {
                return res.status(500).json({ status: "500", message: err.message ? err.message : `error while updating compines tasks` });
              })
          }).catch(function (err) {
            return res.status(500).json({ status: "500", message: err.message ? err.message : `error while updating json files` });
          })
      }).catch(function (err) {
        return res.status(500).json({ status: "500", message: err.message ? err.message : `error while storing json files` });
      });
    }
  } else {
    return res.status(500).json({ status: "500", message: 'Type should be either data or controversy' });
  }
}

export const downloadJson = async ({ bodymen: { body } }, res, next) => {
  const myBucket = process.env.JSON_FILES_BUCKET_NAME
  const myKey = body.fileName;
  const signedUrlExpireSeconds = 60 * 5 // your expiry time in seconds.
  const url = s3.getSignedUrl('getObject', {
    Bucket: myBucket,
    Key: myKey,
    Expires: signedUrlExpireSeconds
  })
  return res.status(200).json({ status: "200", message: "Json downloaded successfully!", signedUrl: url });
}

async function storeFileInS3(actualJson, type, companyId, year) {
  console.log('type', type)
  return new Promise(function (resolve, reject) {
    var fileName = `${companyId}_${year ? year + '_' : ''}${Date.now()}.json`;
    const params = {
      Bucket: process.env.JSON_FILES_BUCKET_NAME, // pass your bucket name
      Key: type + '/' + fileName, // file will be saved in <folderName> folder
      Body: Buffer.from(JSON.stringify(actualJson))
    };
    s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err)
      } else {
        resolve({ data, fileName: type + '/' + fileName });
      }
    });
  })
}
