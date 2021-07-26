import { success, notFound } from '../../services/response/'
import { CompanySources } from '.'
import { result } from 'lodash'
var fs=require("fs")
var path=require("path")
import { SourceSubTypes} from '../source_sub_types'
import { SourceTypes} from '../sourceTypes'

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

export const show = async ({params}, res,next) =>{
  let sourceDetails, companySourceDetails = [];
  sourceDetails = await CompanySources.find({"status": true});
  companySourceDetails = await sourceDetails.find((object) => params.id == object.companyId);
  if (companySourceDetails) {
    res.status(200).json({status: ("200"), message: "data retrieved Sucessfully", data: companySourceDetails});
  }else{
    res.status(400).json({status: ("400"), message: "no data present for the companyId..!"});
  }
}

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

export const uploadCompanySource = async ({ bodymen: { body } }, res, next) => {
  const convertedPdf = Buffer.from(body.sourcePDF.split('data:application/pdf;base64,')[1], 'base64');
  let fileName = "file" + Date.now() + ".pdf";
  let fileUrl = path.join(__dirname, "uploads", fileName)
  await fs.writeFile(fileUrl, convertedPdf, error => {
    if (error) {
      //res.status(400).json({ status: ("400"), message: "Unable to write the file" });
    } else {
      console.log("File Stored Sucessfully");
    }
  });
  let sourceDetails = {
    newSourceTypeName: body.newSourceTypeName,
    newSubSourceTypeName: body.newSubSourceTypeName
  }
  let newSubSourceTypeId, newSourceTypeId;
  if (sourceDetails.newSubSourceTypeName != "null") {
    let subTypeName = body.newSubSourceTypeName;
    await SourceSubTypes.create({ subTypeName: subTypeName })
      .then(async (response) => {
        if (response) {
          newSubSourceTypeId = response.id;
        }
      })
      .catch(res.status(400).json({ status: "400", message: "failed to create new sub source type" }));
  }

  if (sourceDetails.newSourceTypeName != 'null') {
    let sourceObject = {
      typeName: body.newSourceTypeName,
      subSourceTypeId: newSubSourceTypeId,
      isMultiYear: body.isMultiYear,
      isMultiSource: body.isMultiSource
    }
    await SourceTypes.create(sourceObject)
      .then(async (sourceResponse) => {
        if (sourceResponse) {
          newSourceTypeId = sourceResponse.id;
        }
      })
  }
  if (body.sourceSubTypeId) {
    newSubSourceTypeId = body.sourceSubTypeId;
  }

  let companySourceDetails = {
    companyId: body.companyId,
    sourceTypeId: newSourceTypeId,
    isMultiYear: body.isMultiYear,
    isMultiSource: body.isMultiSource,
    sourceUrl: body.url,
    sourceSubTypeId: newSubSourceTypeId,
    sourceFile: fileUrl,
    publicationDate: body.publicationDate,
    fiscalYear: body.fiscalYear
  }
  await CompanySources.create(companySourceDetails)
    .then((detail) => {
      res.status(200).json({ status: "200", message: 'data saved sucessfully', data: companySourceDetails })
    });
}