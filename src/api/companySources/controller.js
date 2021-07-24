import { success, notFound } from '../../services/response/'
import { CompanySources } from '.'
import { result } from 'lodash'
var fs=require("fs")
var path=require("path")

export const create = ({ user, bodymen: { body } }, res, next) =>
  CompanySources.create({ ...body, createdBy: user })
    .then((companySources) => companySources.view(true))
    .then(success(res, 201))
    .catch(next)

// var storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//       cb(null, '../uploads/sources')
//   },
//   filename: (req, file, cb) => {
//       cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
//   }
// });

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
  // const convertedPdf = Buffer.from(body.sourcePDF.toString('utf-8'), 'base64');data:application/pdf;base64
  // convertedWorkbook = read(body.sourcePDF.replace(/^data:application\/pdf;base64,/, ""));
  var buf = Buffer.from(body.sourcePDF, 'base64');
  let converted = buf.toString();
  // console.log("Converted",converted);
  let fileName = "file" + Date.now() + ".pdf";
  let fileUrl = path.join(__dirname, "uploads", fileName)
  await fs.writeFile(fileUrl, converted, error => {
    if (error) {
      //res.status(400).json({ status: ("400"), message: "Unable to write the file" });
    }
  });
  let companySourceDetails = {
    companyId: body.companyId,
    sourceTypeId: body.sourceTypeId,
    isMultiYear: body.isMultiYear,
    isMultiSource: body.isMultiSource,
    sourceUrl: body.url,
    sourceSubTypeId: body.sourceSubTypeId,
    sourceFile: fileUrl,
    publicationDate: body.publicationDate,
    fiscalYear: body.fiscalYear,
    newSourceTypeName: body.newSourceTypeName,
    newSubSourceTypeName: body.newSubSourceTypeName
  } 
  let sourceDetails = await CompanySources.find({"status": true});
  let isCompanyExisting = await sourceDetails.find(object => (companySourceDetails.companyId == object.companyId));
  if (isCompanyExisting) {
        await CompanySources.updateOne({ companyId: companySourceDetails.companyId }, { $set: companySourceDetails }, { upsert: true })
          .then((res.status(200).json({ status: ("200"), message: "data updated sucessfully...!", data: companySourceDetails })))
  }else{
    await CompanySources.create(companySourceDetails)
      .then((res.status(200).json({ status: ("200"), message: 'data saved sucessfully', data: companySourceDetails })))
  }
}