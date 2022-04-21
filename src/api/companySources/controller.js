import { success, notFound } from '../../services/response/'
import { CompanySources } from '.'
import { result } from 'lodash'
var fs = require("fs")
var path = require("path")
import { SourceSubTypes } from '../source_sub_types'
import { SourceTypes } from '../sourceTypes'
import { storeFileInS3, fetchFileFromS3 } from "../../services/utils/aws-s3"

export const create = ({ user, bodymen: { body } }, res, next) =>
  CompanySources.create({ ...body, createdBy: user })
    .then((companySources) => companySources.view(true))
    .then(success(res, 201))
    .catch(next)


export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  CompanySources.count(query)
    .then(count => CompanySources.find(query, select, cursor)
      .then((companySources) => ({
        count,
        rows: companySources.map((companySources) => companySources.view())
      }))
    )
    .then(success(res))
    .catch(next)

// export const show = ({ params }, res, next) =>
//   CompanySources.findById(params.id)
//     .populate('companyId')
//     .then(notFound(res))
//     .then((companySources) => companySources ? companySources.view() : null)
//     console.log();

export const show = async ({ params }, res, next) => {
  let sourceDetails, companySourceDetails = [];
  sourceDetails = await CompanySources.find({ "status": true });
  companySourceDetails = await sourceDetails.find((object) => params.id == object.companyId);
  if (companySourceDetails) {
    res.status(200).json({ status: "200", message: "data retrieved Sucessfully", data: companySourceDetails });
  } else {
    res.status(400).json({ status: "400", message: "no data present for the companyId..!" });
  }
}

export const update = async (req, res, next) => {
  try {
    const { companyId, sourcePDF, name, url, sourceTitle, publicationDate, fileName } = req.body;
    const { id } = req.params;
    let fileUrl;
    if (sourcePDF !== '') {
      let fileType = sourcePDF.split(';')[0].split('/')[1];
      if (fileType == 'plain') {
        fileType = 'txt'
      } else if(fileType == 'vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        fileType = 'xlsx'
      } else if (fileType == 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'docx'
      }
      fileUrl = companyId + '_' + Date.now() + '.' + fileType;
      await storeFileInS3(process.env.COMPANY_SOURCES_BUCKET_NAME, fileUrl, sourcePDF);
    }

    const companydata = await CompanySources.findOne({ _id: id });
    const updatedData = {
      fileName: fileName ? fileName : companydata?.fileName,
      sourceFile: fileUrl ? fileUrl : companydata?.sourceFile,
      name: name ? name : companydata?.name,
      sourceUrl: url ? url : companydata?.url,
      sourceTitle: sourceTitle ? sourceTitle : companydata?.sourceTitle,
      publicationDate: publicationDate ? publicationDate : companydata?.publicationDate
    }

    const updateCompanyDetails = await CompanySources.findOneAndUpdate({ _id: id }, {
      $set: updatedData
    }, {
      new: true
    });
    if (!updateCompanyDetails) {
      return res.status(409).json({
        status: 409,
        message: 'Failed to updated company source data'
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Update Successfully',
      data: updateCompanyDetails
    });

  } catch (error) {
    return res.status(409).json({ message: error?.message ? error?.message : 'Failed to update' });
  }
}
// CompanySources.findById(params.id)
//   .populate('sourceTypeId')
//   .then(notFound(res))
//   .then((companySources) => companySources ? Object.assign(companySources, body).save() : null)
//   .then((companySources) => companySources ? companySources.view(true) : null)
//   .then(success(res))
//   .catch(next)

export const destroy = ({ params }, res, next) =>
  CompanySources.findById(params.id)
    .then(notFound(res))
    .then((companySources) => companySources ? companySources.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const getDocumentsByCompanyId = async ({ params }, res, next) =>
  await CompanySources.find({ companyId: params.companyId }).populate('sourceTypeId').then(async (result) => {
    let sourceList = [];
    for (let index = 0; index < result.length; index++) {
      sourceList.push({
        "sourceName": result[index]?.name ? result[index]?.name : "",
        "value": result[index]?._id ? result[index]?._id : "",
        "url": result[index]?.sourceUrl ? result[index]?.sourceUrl : "",
        "isPublicationDateRequired": result[index]?.sourceTypeId?.typeName == "Webpages" ? false : true,
        "publicationDate": result[index]?.publicationDate ? result[index]?.publicationDate : null,
        "sourceFile": result[index]?.sourceFile ? result[index]?.sourceFile : "",
        "title": result[index]?.sourceTitle ? result[index]?.sourceTitle : ""
      })
    }
    res.status(200).json({ status: "200", message: "Company Sources retrieved successfully!", sourceList });
  }).catch(next)

export const uploadCompanySource = async ({ bodymen: { body } }, res, next) => {
  // const convertedPdf = Buffer.from(body.sourcePDF.split('data:application/pdf;base64,')[1], 'base64');
  // let fileName = "file" + Date.now() + ".pdf";
  // let fileUrl = path.join(__dirname, "uploads", fileName)
  // await fs.writeFile(fileUrl, convertedPdf, error => {
  //   if (error) {
  //     //res.status(400).json({ status: "400", message: "Unable to write the file" });
  //   } else {
  //   }
  // });
  try {
    var fileUrl = '';
    if (body.sourcePDF) {
      let fileType = body.sourcePDF.split(';')[0].split('/')[1];
      if (fileType == 'plain') {
        fileType = 'txt'
      } else if(fileType == 'vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        fileType = 'xlsx'
      } else if (fileType == 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'docx'
      }
      fileUrl = body.companyId + '_' + Date.now() + '.' + fileType;
      await storeFileInS3(process.env.COMPANY_SOURCES_BUCKET_NAME, fileUrl, body.sourcePDF);

    }
    let sourceDetails = {
      newSourceTypeName: body.newSourceTypeName,
      newSubSourceTypeName: body.newSubSourceTypeName
    }
    let newSubSourceTypeId, newSourceTypeId;
    if (sourceDetails.newSubSourceTypeName != null && sourceDetails.newSubSourceTypeName != "") {
      let subTypeName = body.newSubSourceTypeName;
      await SourceSubTypes.create({ subTypeName: subTypeName })
        .then((response) => {
          if (response) {
            newSubSourceTypeId = response.id;
          }
        })
      // .catch(res.status(400).json({ status: "400", message: "failed to create new sub source type" }));
    } else if (body.sourceSubTypeId != null && body.sourceSubTypeId != ""){
      newSubSourceTypeId = body.sourceSubTypeId
    }
    if (sourceDetails.newSourceTypeName != 'null' && sourceDetails.newSourceTypeName != "") {
      let sourceObject = {
        typeName: body.newSourceTypeName,
        subSourceTypeId: newSubSourceTypeId,
        isMultiYear: body.isMultiYear,
        isMultiSource: body.isMultiSource
      }
      await SourceTypes.create(sourceObject).then(async (sourceResponse) => {
        if (sourceResponse) {
          newSourceTypeId = sourceResponse.id;
        }
      })
    } else if (body.sourceTypeId != null && body.sourceTypeId != "") {
      newSourceTypeId = body.sourceTypeId;
    }
    let companySourceDetails = {
      companyId: body.companyId,
      sourceTypeId: newSourceTypeId,
      isMultiYear: body.isMultiYear,
      isMultiSource: body.isMultiSource,
      sourceUrl: body.url,
      sourceSubTypeId: newSubSourceTypeId,
      sourceFile: fileUrl,
      publicationDate: body.publicationDate == 'NA' ? null : body.publicationDate,
      fiscalYear: body.fiscalYear,
      name: body.name,
      sourceTitle: body.sourceTitle,
      fileName: body.fileName
    }
    await CompanySources.create(companySourceDetails).then((detail) => {
      res.status(200).json({ status: "200", message: 'data saved sucessfully', data: companySourceDetails })
    });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : " Failed to upload the company source" })
  }
}