import _ from 'lodash'
import XLSX from 'xlsx'
import * as fs from 'fs'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Datapoints } from '.'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { ClientTaxonomy } from '../clientTaxonomy'
import { Categories } from '../categories'
import { KeyIssues } from '../key_issues'
import { Functions } from '../functions'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Datapoints.create({ ...body, updatedBy: user })
    .then((datapoints) => datapoints.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Datapoints.count(query)
    .then(count => Datapoints.find(query, select, cursor)
      .populate('updatedBy')
      .populate('categoryId')
      .populate('keyIssueId')
      .populate('functionId')
      .then((datapoints) => ({
        count,
        rows: datapoints.map((datapoints) => datapoints.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Datapoints.findById(params.id)
    .populate('updatedBy')
    .populate('categoryId')
    .populate('keyIssueId')
    .populate('functionId')
    .then(notFound(res))
    .then((datapoints) => datapoints ? datapoints.view() : null)
    .then(success(res))
    .catch(next)

export const includePolarityFromJson = async (req, res, next) => {
  fs.readFile(__dirname + '/datapoints-master-values.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    let allDatapoints = await Datapoints.find({});
    for (let index = 0; index < allDatapoints.length; index++) {
      const element = allDatapoints[index];
      console.log(element.code);
      let foundObject = datapointsList.find(obj => obj.code == element.code);
      console.log('foundObject', foundObject);
      await Datapoints.updateOne({ _id: element.id }, { $set: { polarity: foundObject.polarity ? foundObject.polarity : '' } });
      if (index == allDatapoints.length - 1) {
        return res.status(200).json({ message: "Polarity value added!" });
      }
    }
  })
}

export const includeCategoryIdsFromJson = async (req, res, next) => {
  fs.readFile(__dirname + '/dpcodes-categoryIds.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    let allDatapoints = await Datapoints.find({});
    for (let index = 0; index < allDatapoints.length; index++) {
      const element = allDatapoints[index];
      console.log(element.code);
      let foundObject = datapointsList.find(obj => obj.code == element.code);
      console.log('foundObject', foundObject);
      await Datapoints.updateOne({ _id: element.id }, { $set: { categoryId: foundObject.categoryId ? foundObject.categoryId : null } });
      if (index == allDatapoints.length - 1) {
        return res.status(200).json({ message: "CategoryId value added!" });
      }
    }
  })
}

export const includeExtraKeysFromJson = async (req, res, next) => {
  var clientTaxonomyId = req.params.clientTaxonomyId;
  fs.readFile(__dirname + '/extra.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    console.log('datapointsList', datapointsList.length)
    for (let index = 0; index < datapointsList.length; index++) {
      var obj = {
        "clientTaxonomyId": clientTaxonomyId,
        "validationRule": datapointsList[index].validationRule,
        "dataType": datapointsList[index].dataType,
        "dependentCodes": datapointsList[index].dependentCodes ? JSON.parse(datapointsList[index].dependentCodes) : [],
        "hasDependentCode": datapointsList[index].hasDependentCode,
        "validationTypes": datapointsList[index].validationTypes ? JSON.parse(datapointsList[index].validationTypes) : [],
        "percentileThresholdValue": datapointsList[index].percentileThresholdValue,
        "DPCODE": datapointsList[index].DPCODE,
        "parameters": datapointsList[index].parameters,
        "methodName": datapointsList[index].methodName,
        "checkCondition": datapointsList[index].checkCondition,
        "criteria": datapointsList[index].criteria,
        "collectionOrderNumber": datapointsList[index].collectionOrderNumber,
      }
      console.log('obj', obj, index + 1);
      await Datapoints.updateOne({ _id: datapointsList[index]._id }, { $set: obj });
    }
    res.status(200).json({ message: "extra cloums added" });
  })
}

export const getCategorywiseDatapoints = async (req, res, next) => {
  let categoryDatapoints = await Datapoints.find({ clientTaxonomyId: req.params.clientTaxonomyId, categoryId: req.params.categoryId, status: true }).sort({ collectionOrderNumber: 1 }).populate('clientTaxonomyId');
  let dpDetailsList = [];
  let allStandaloneDetails = [];
  let allBoardMemberMatrixDetails = [];
  let allKmpMatrixDetails = [];
  allStandaloneDetails = await StandaloneDatapoints.find({
    companyId: req.params.companyId,
    status: true
  }).populate('createdBy')
    .populate('datapointId')
    .populate('companyId')
    .populate('taskId')

  allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
    companyId: req.params.companyId,
    status: true
  }).populate('createdBy')
    .populate('datapointId')
    .populate('companyId')

  allKmpMatrixDetails = await KmpMatrixDataPoints.find({
    companyId: req.params.companyId,
    status: true
  }).populate('createdBy')
    .populate('datapointId')
    .populate('companyId')
  let mergeDetails = _.concat(allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails);
  for (let index = 0; index < categoryDatapoints.length; index++) {
    let dpObject = categoryDatapoints[index];
    let datapointHistory = [], dpDetails = [];
    let mockYears = ['2018-2019', '2019-2020'];
    for (let year = 0; year < mockYears.length; year++) {
      let objectToPush = {};
      objectToPush = dpObject.toObject();
      objectToPush['year'] = mockYears[year];
      dpDetails.push(objectToPush);
      console.log(dpDetails);
    }
    // let histories = await StandaloneDatapoints.find({datapointId: dpObject.id, clientTaxonomyId: req.params.clientTaxonomyId, categoryId: req.params.categoryId, year: { $ne: "2020-2021" }, status: true}).populate('createdBy')
    let histories = mergeDetails.filter(obj => obj.datapointId.id == dpObject.id)
    if (histories.length > 0) {
      for (let hIndex = 0; hIndex < histories.length; hIndex++) {
        const object = histories[hIndex];
        // datapointHistory.push({ year: object.year, response: object.response, performanceResponse: object.performanceResult, sourceUrl: object.sourceUrl ? object.sourceUrl : '', standardDeviation: object.standaradDeviation ? object.standaradDeviation : '', average: object.average ? object.average : '' });
        datapointHistory.push(object);
      }
    }
    dpDetailsList.push({ dpDetails: dpDetails, datapointHistory: datapointHistory });
  }
  res.status(200).json({ count: dpDetailsList.length, rows: dpDetailsList });
}

export const uploadTaxonomyDatapoints = async (req, res, next) => {
  if (req.body.clientTaxonomyId && req.file) {
    try {
      let allSheetsObject = [];
      const filePath = req.file.path;
      var workbook = XLSX.readFile(filePath, { sheetStubs: false, defval: '' });
      var sheet_name_list = workbook.SheetNames;
      sheet_name_list.forEach(function (currentSheetName) {
        var worksheet = workbook.Sheets[currentSheetName];
        try {
          var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: " " });
          allSheetsObject.push(sheetAsJson);
        } catch (error) {
          return res.status(400).json({ message: error.message })
        }
      });
      let newDatapoints = [], headerNameList = [];
      let allCategories = [], allKeyIssues = [], allFunctions = [];
      allCategories = await Categories.find({ status: true });
      allKeyIssues = await KeyIssues.find({ status: true });
      allFunctions = await Functions.find({ status: true });
      await ClientTaxonomy.findOne({ _id: req.body.clientTaxonomyId })
      .populate('fields.id')
      .then((clientTaxonomies) => {
        if (clientTaxonomies) {
          for (let nameIndex = 0; nameIndex < clientTaxonomies.fields.length; nameIndex++) {
            const fieldNameObject = clientTaxonomies.fields[nameIndex];
            headerNameList.push({ 
              "aliasName": fieldNameObject.name ? fieldNameObject.name : '', 
              "masterName": fieldNameObject.id.name ? fieldNameObject.id.name : '', 
              "headerId": fieldNameObject.id.id ? fieldNameObject.id.id : '', 
              "fieldName": fieldNameObject.id.fieldName ? fieldNameObject.id.fieldName : '' 
            });
          }
        }
      });
      if (headerNameList.length >= 22) {
        if (allSheetsObject.length > 0) {
          for (let objIndex = 0; objIndex < allSheetsObject.length; objIndex++) {
            const rowObjects = allSheetsObject[objIndex];
            if (rowObjects.length > 0) {
              let newDpObjectToPush = {};
              newDpObjectToPush["clientTaxonomyId"] = req.body.clientTaxonomyId;
              newDpObjectToPush["createdAt"] = Date.now();
              newDpObjectToPush["updatedAt"] = Date.now();
              newDpObjectToPush["updatedBy"] = req.user ? req.user : null;
              for (let rindex = 0; rindex < rowObjects.length; rindex++) {
                const rowObject = rowObjects[rindex];
                for (let hIndex = 0; hIndex < headerNameList.length; hIndex++) {
                  const headerObject = headerNameList[hIndex];
                  if (headerObject.fieldName == "categoryId") {
                    //find in allCategories
                    let categoryObject = allCategories.find((rec) => rec.categoryName === rowObject[headerObject.aliasName])
                    if (categoryObject && categoryObject.id) {
                      newDpObjectToPush[headerObject.fieldName] = categoryObject.id;
                    } else {
                      return res.status(400).json({ status: "400", message: `Invalid value for ${headerObject.aliasName} as ${rowObject[headerObject.aliasName]}, please check!` });
                    }
                  } else if (headerObject.fieldName == "functionId") {
                    //find in allFunctions
                    let functionObject = allFunctions.find((rec) => rec.functionType === rowObject[headerObject.aliasName])
                    if (functionObject && functionObject.id) {
                      newDpObjectToPush[headerObject.fieldName] = functionObject.id;
                    } else {
                      return res.status(400).json({ status: "400", message: `Invalid value for ${headerObject.aliasName} as ${rowObject[headerObject.aliasName]}, please check!` });
                    }
                  } else if (headerObject.fieldName == "keyIssueId") {
                    //find in allKeyIssues
                    let keyIssueObject = allKeyIssues.find((rec) => rec.keyIssueName === rowObject[headerObject.aliasName])
                    if (keyIssueObject && keyIssueObject.id) {
                      newDpObjectToPush[headerObject.fieldName] = keyIssueObject.id;
                    } else {
                      return res.status(400).json({ status: "400", message: `Invalid value for ${headerObject.aliasName} as ${rowObject[headerObject.aliasName]}, please check!` });
                    }
                  } else {
                    newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.aliasName];
                  }
                }
                newDatapoints.push(newDpObjectToPush);              
              }
              await Datapoints.insertMany(newDatapoints)
                .then((err, result) => {
                  if (err) {
                    console.log('error', err);
                  } else {
                    //  console.log('result', result);
                  }
                });
              return res.status(200).json({ status: "200", message: "Datapoint uploaded successfully!", data: newDatapoints });
            } else {
              return res.status(400).json({ status: "400", message: "No values present in the uploaded file, please check!" });
            }
          }
        } else {
          return res.status(400).json({ status: "400", message: "No values present in the uploaded file, please check!" }); 
        }
      } else {
        return res.status(400).json({ status: "400", message: "Missing mandatory fields, please check!" }); 
      }
    } catch (error) {
      return res.status(500).json({ status: "500", message: error.message });
    }
  } else {
    return res.status(400).json({ status: "400", message: "Missing fields in payload" });
  }
}

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Datapoints.findById(params.id)
    .populate('updatedBy')
    .populate('categoryId')
    .populate('keyIssueId')
    .populate('functionId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'updatedBy'))
    .then((datapoints) => datapoints ? Object.assign(datapoints, body).save() : null)
    .then((datapoints) => datapoints ? datapoints.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Datapoints.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'updatedBy'))
    .then((datapoints) => datapoints ? datapoints.remove() : null)
    .then(success(res, 204))
    .catch(next)
