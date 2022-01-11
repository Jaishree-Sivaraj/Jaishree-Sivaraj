import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Validations } from '.'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { Functions } from '../functions'
import { DerivedDatapoints } from '../derived_datapoints'
import _, { concat, isNumber } from 'lodash'
import { TaskAssignment } from '../taskAssignment'
import { ProjectedValues } from "../projected_values";
import * as fs from 'fs'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp'
import { Ztables } from "../ztables";


export const create = ({ user, bodymen: { body } }, res, next) =>{
  Validations.create({ ...body, createdBy: user })
    .then((validations) => validations.view(true))
    .then(success(res, 201))
    .catch(next)
}

export const includeExtraKeysFromJson = async (req, res, next) => {
  fs.readFile(__dirname + '/data.json', async (err, data) => {
    if (err) throw err;
    let validationsList = JSON.parse(data);
    for (let index = 0; index < validationsList.length; index++) {
      let obj = validationsList[index];
      await Validations.create({
        "datapointId": obj.datapointId,
        "dpCode": obj.dpCode,
        "clientTaxonomyId": obj.clientTaxonomyId,
        "validationRule": obj.validationRule,
        "dataType": obj.dataType,
        "hasDependentCode": obj.hasDependentCode,
        "dependentCodes": obj.dependentCodes,
        "validationType": obj.validationType,
        "percentileThreasholdValue": obj.percentileThreasholdValue, 
        "parameters": obj.parameters,
        "methodName": obj.methodName,
        "checkCondition": obj.checkCondition,
        "criteria": obj.criteria,
        "checkResponse": obj.checkResponse,
        "errorMessage": obj.errorMessage
      })
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message + " for "+ obj.dpCode : "Failed to create validation for "+ obj.dpCode })
      });
    }
    res.status(200).json({
      message: "Validation added successfully!"
    });
  })
}


export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Validations.count(query)
    .then(count => Validations.find(query, select, cursor)
      .populate('createdBy')
      .populate('datapointId')
      .then((validations) => ({
        count,
        rows: validations.map((validations) => validations.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Validations.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then((validations) => validations ? validations.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Validations.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((validations) => validations ? Object.assign(validations, body).save() : null)
    .then((validations) => validations ? validations.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Validations.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((validations) => validations ? validations.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const type8Validation = async ({ user, body }, res, next) => {
  try {
    console.log(body.datapointId, body.companyId, body.clientTaxonomyId, body.currentYear, params.previousYear, body.response);
    let derivedDatapoints = await DerivedDatapoints.find({ companyId: body.companyId, status: true }).populate('datapointId');
    let standalone_datapoints = await StandaloneDatapoints.find({ companyId: body.companyId, isActive: true, status: true }).populate('datapointId');
    let mergedDetails = _.concat(derivedDatapoints, standalone_datapoints);
    let datapointDetails = await Datapoints.findOne({ _id: body.datapointId, clientTaxonomyId: body.clientTaxonomyId });
    if (datapointDetails.methodName.trim() == 'OR') {
      let parameters = datapointDetails.dependentCodes;
      if (parameters.length > 0) {
        for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
          let parameterDPResponse, previousYearResponse;
          _.filter(mergedDetails, (object, index) => {
            if (object.companyId == body.companyId, object.year == body.currentYear, object.datapointId.id == parameters[parameterIndex].id) {
              parameterDPResponse = object;
            } else if (object.companyId == body.companyId, object.year == params.previousYear, object.datapointId.id == body.datapointId) {
              previousYearResponse = object;
            }
          })
          console.log(parameterDPResponse, previousYearResponse)
          if (parameterDPResponse) {
            if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
              if (datapointDetails.checkCondition.trim() == 'greater') {
                let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                if (Number(body.response) > Number(calculatedResponse)) {
                  return res.status(200).json({ message: "Valid Response", isValidResponse: true });
                } else {
                  return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
                }
              } else {
                let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                if (Number(body.response) < Number(calculatedResponse)) {
                  return res.status(200).json({ message: "Valid Response", isValidResponse: true });
                } else {
                  return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
                }
              }
            }
          } else {
            return res.status(404).json({ message: "Response is missing for " + parameters[parameterIndex].code + "year :"+ body.currentYear});
          }
          if (parameterIndex == parameters.length - 1) {
            return res.status(412).json({ message: "Condition Failed" });
          }
        }
      } else {
        return res.status(401).json({ message: "Parameters not found" });
      }
    } else if (datapointDetails.methodName.trim() == 'YES') {
      let parameter = datapointDetails.dependentCodes;
      let parameterDPResponse, previousYearResponse;
      _.filter(mergedDetails, (object, index) => {
        if (object.companyId == body.companyId, object.year == body.currentYear, object.datapointId.id == parameter[0].id) {
          parameterDPResponse = object;
        } else if (object.companyId == body.companyId, object.year == params.previousYear, object.datapointId.id == body.datapointId) {
          previousYearResponse = object;
        }
      })
      if (parameterDPResponse) {
        if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
          if (datapointDetails.checkCondition.trim() == 'greater') {
            let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
            if (Number(body.response) > Number(calculatedResponse)) {
              return res.status(200).json({ message: "Valid Response", isValidResponse: true });
            } else {
              return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
            }
          } else {
            let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
            if (Number(body.response) < Number(calculatedResponse)) {
              return res.status(200).json({ message: "Valid Response", isValidResponse: true });
            } else {
              return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
            }
          }
        } else {
          return res.status(412).json({ message: "Condition Failed" });
        }
      } else {
        return res.status(404).json({ message: "Response is missing for " + parameter[0].code + "year :"+ body.currentYear});
      }
    } else if (datapointDetails.methodName.trim() == 'ANDOR') {
      let parameters = datapointDetails.dependentCodes;
      let param1Value, param2Value, param3Value;
      let previousYearResponse;
      //let year;
      _.filter(mergedDetails, (object, index) => {
        if (object.companyId == body.companyId, object.year == params.previousYear, object.datapointId == body.datapointId) {
          previousYearResponse = object
        } else if (object.datapointId == parameters[0].id, object.year == body.currentYear) {
          param1Value = object.response ? object.response : ''
        } else if (object.datapointId == parameters[1].id, object.year == body.currentYear) {
          param2Value = object.response ? object.response : ''
        } else if (object.datapointId == parameters[2].id, object.year == body.currentYear) {
          param3Value = object.response ? object.response : ''
        }
      })
      //if ((param1Value.toLowerCase() == 'yes' && param2Value.toLowerCase() == 'yes') || param3Value.toLowerCase() == 'yes') {
        if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
        if (datapointDetails.checkCondition.trim() == 'greater') {
          let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
          if (Number(body.response) > Number(calculatedResponse)) {
            return res.status(200).json({ message: "Valid Response", isValidResponse: true });
          } else {
            return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
          }
        } else {
          let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
          if (Number(body.response) < Number(calculatedResponse)) {
            return res.status(200).json({ message: "Valid Response", isValidResponse: true });
          } else {
            return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
          }
        }
      } else {
        return res.status(412).json({ message: "Condition Failed" });
      }
    } else if (datapointDetails.methodName.trim() == 'ANDOR3') {
      console.log('...',datapointDetails);
      let parameters = datapointDetails.dependentCodes;
      let param1Value, param2Value, param3Value, param4Value;
      let previousYearResponse;
      _.filter(mergedDetails, (object, index) => {
        if (object.companyId == body.companyId, object.year == params.previousYear, object.datapointId == body.datapointId) {
          previousYearResponse = object
        } else if (object.datapointId == parameters[0].id, object.year == body.currentYear) {
          param1Value = object.response ? object.response : ''
        } else if (object.datapointId == parameters[1].id, object.year == body.currentYear) {
          param2Value = object.response ? object.response : ''
        } else if (object.datapointId == parameters[2].id, object.year == body.currentYear) {
          param3Value = object.response ? object.response : ''
        } else if (object.datapointId == parameters[3].id, object.year == body.currentYear) {
          param4Value = object.response ? object.response : ''
        }
      })
      //if ((param1Value.toLowerCase() == 'yes' && param2Value.toLowerCase() == 'yes' && param3Value.toLowerCase() == 'yes') || param4Value.toLowerCase() == 'yes') {
        if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes') && (param3Value == 'yes' || param3Value == 'yes') || (param4Value == 'yes' || param4Value == 'Yes'))) {
        if (datapointDetails.checkCondition.trim() == 'greater') {
          let calculatedResponse = (Number(datapointDetails.percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
          if (Number(body.response) > Number(calculatedResponse)) {
            return res.status(200).json({ message: "Valid Response", isValidResponse: true });
          } else {
            return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
          }
        }
      } else {
        return res.status(412).json({ message: "Condition Failed" });
      }
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message })
  }
}
    
export const type3Validation = async ({ user, body }, res, next) => {
  console.log(body.datapointId, body.companyId, body.clientTaxonomyId, params.previousYear, body.response);
  let previousResponse = await StandaloneDatapoints.findOne({ datapointId: body.datapointId, companyId: body.companyId, year: params.previousYear })
  .catch((error) => { return res.status(500).json({ status: "500", message: error.message }) })
  try {
    if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
      if (body.response.toLowerCase() == 'yes' || body.response.toLowerCase() == 'y') {
        return res.status(200).json({ message: "Valid Response", isValidResponse: true });
      } else {
        return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
      }
    } else {
      return res.status(200).json({ message: "Valid Response", isValidResponse: true });
    }
  } catch (error) {
    return res.status(412).json({ message: error.message, isValidResponse: false });
  }
}

export const extraAddKeys = async({params}, res, next)=>{
      try { 
      let validationId = await Validations.find({}).populate({
        path: "datapointId",
        populate: {
          path: "categoryId"
        }
     });
      if(validationId && validationId.length > 0){
        for (let validationIndex = 0; validationIndex < validationId.length; validationIndex++) {
          console.log(validationIndex);
          if(validationId[validationIndex].datapointId !== null){
            await Validations.updateOne({_id: validationId[validationIndex].id},{$set:{categoryId: validationId[validationIndex].datapointId.categoryId.id }})        
          }
      //  const element = validationId[validationIndex].parameters[0].split(",");
      //  if(element[0] != ''){
      //    console.log(validationIndex)
      //  for (let paramterIndex = 0; paramterIndex < element.length; paramterIndex++) {
      //    let dpCodeId = await Datapoints.findOne({code : element[paramterIndex].trim()});
      //    await Validations.updateOne({_id : validationId[validationIndex].id},{$push:{dependentCodes : dpCodeId.id}})
      //  }
      // } 
        }
        return res.status(200).json({ status: "200", message: "Extra-keys added for validations rules!" });
      } else {
        return res.status(404).json({ message: "No validations rules found!" });
      }   
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
    
}


export const getAllValidation =async ({ user, params }, res, next) => {
  try {
    let validationResponse = [], keyIssuesList = [];  
    let boardDpCodesData = {
      boardMemberList: [],
      dpCodesData: []
    };
    let kmpDpCodesData = {
      kmpMemberList: [],
      dpCodesData: []
    };
    let taskDetailsObject = await TaskAssignment.findOne({_id: params.taskId}).populate({
      path: "companyId",
    populate: {
      path: "clientTaxonomyId"
    }}).populate('categoryId');
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });
    // search negative news function 
    let dpTypeValues = await Datapoints.find({
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
      clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id,
      categoryId: taskDetailsObject.categoryId.id,
      status: true
    }).distinct('dpType');
    // let categoryValidationRules = await Validations.find({categoryId: taskDetailsObject.categoryId.id}).populate({
    //   path: "datapointId",
    // populate: {
    //   path: "keyIssueId"
    // }});
    // if (categoryValidationRules.length > 0) {
      if(dpTypeValues.length > 0){
        let previousYear = "";
        let historyYear = await StandaloneDatapoints.distinct('year',{companyId: taskDetailsObject.companyId.id,isActive: true, status: true});
        let distinctYears = taskDetailsObject.year.split(',');
        distinctYears = distinctYears.sort();
        let previousYearIndex = historyYear.indexOf(distinctYears[0])
        if(previousYearIndex > 0){
          previousYear = historyYear[previousYearIndex - 1];
        } else{
          previousYear = "";
        }
        console.log(previousYear)
        let validationRules = await Validations.find({categoryId: taskDetailsObject.categoryId.id}).populate({
          path: "datapointId",
        populate: {
          path: "keyIssueId"
        }});
        let mergedYear  = _.concat(distinctYears,previousYear)
        let derivedDatapoints = await DerivedDatapoints.find({ companyId: taskDetailsObject.companyId.id, year :{$in : mergedYear},status: true })
        .populate('datapointId')
        .populate('companyId');
        let kmpDatapoints = await KmpMatrixDataPoints.find({companyId: taskDetailsObject.companyId.id,isActive: true, year :{$in : mergedYear}, status: true})
        .populate('datapointId')
        .populate('companyId');
        let boardMembersMatrixDataPoints = await BoardMembersMatrixDataPoints.find({companyId: taskDetailsObject.companyId.id,isActive: true, year :{$in : mergedYear}, status: true})
        .populate('datapointId')
        .populate('companyId');
        let standalone_datapoints = await StandaloneDatapoints.find({ companyId: taskDetailsObject.companyId.id,  isActive: true, year :{$in : mergedYear},status: true })
        .populate('datapointId')
        .populate('companyId');
        let projectedValues = await ProjectedValues.find({clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, nic: taskDetailsObject.companyId.nic, year: {$in : distinctYears}})
        .populate('datapointId');
        let mergedDetails = _.concat(boardMembersMatrixDataPoints,kmpDatapoints,derivedDatapoints, standalone_datapoints);
        if(dpTypeValues.length > 1){
          for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
            let keyIssuesCollection = await Datapoints.find({
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
              clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id,
              categoryId: taskDetailsObject.categoryId.id,
              status: true
            }).populate('keyIssueId');      
            let keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
            for (let keyIssueListIndex = 0; keyIssueListIndex < keyIssueListObject.length; keyIssueListIndex++) {
              let keyIssues = {
                label: keyIssueListObject[keyIssueListIndex].keyIssueId.keyIssueName,
                value: keyIssueListObject[keyIssueListIndex].keyIssueId.id
              }
              keyIssuesList.push(keyIssues);
            }   
            let boardMemberEq = await BoardMembers.find({companyId: taskDetailsObject.companyId.id, endDateTimeStamp: 0});
            for (let currentYearIndex = 0; currentYearIndex < distinctYears.length; currentYearIndex++) {
              let yearSplit = distinctYears[currentYearIndex].split('-');
              let endDateString = yearSplit[1]+"-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
              let boardMemberGt = await BoardMembers.find({companyId: taskDetailsObject.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
              console.log(1614709800 ,  yearTimeStamp)
              let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);
    
              for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                let boardNameValue = {
                  label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                  value: mergeBoardMemberList[boardMemberNameListIndex].id,
                  year: distinctYears[currentYearIndex]
                }
                if(boardDpCodesData.boardMemberList.length > 0){
                  let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                    if(boardMemberValues.length > 0){
                      let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                      boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ','+distinctYears[currentYearIndex];
                    } else {
                      boardDpCodesData.boardMemberList.push(boardNameValue);
                    }
                } else {
                  boardDpCodesData.boardMemberList.push(boardNameValue);
                }
              }
            }  
            let kmpMemberEq = await Kmp.find({companyId: taskDetailsObject.companyId.id, endDateTimeStamp: 0});
            for (let currentYearIndex = 0; currentYearIndex < distinctYears.length; currentYearIndex++) {
              let yearSplit = distinctYears[currentYearIndex].split('-');
              let endDateString = yearSplit[1]+"-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
              let kmpMemberGt = await Kmp.find({companyId: taskDetailsObject.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
              console.log(1614709800 ,  yearTimeStamp)
              let mergeKmpMemberList = _.concat(kmpMemberEq,kmpMemberGt);
      
              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                let kmpNameValue = {
                  label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                  value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                  year: distinctYears[currentYearIndex]
                }
                if(kmpDpCodesData.kmpMemberList.length > 0){
                  let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                    if(kmpMemberValues.length > 0){
                      let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                      kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ','+distinctYears[currentYearIndex];
                    } else {
                      kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                    }
                } else {
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                }
              }
            }
            for (let validationIndex = 0; validationIndex < validationRules.length; validationIndex++) {
              let validationDpType = keyIssuesCollection.find(obj => obj._id == validationRules[validationIndex].datapointId.id);
              if(validationDpType){
                if(validationDpType.dpType == 'Board Matrix'){
                  for (let boardMemberIndex = 0; boardMemberIndex < boardDpCodesData.boardMemberList.length; boardMemberIndex++) {
                    for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
                      try {
                        let dpCodeObject = {
                          dpCode: validationRules[validationIndex].datapointId.code,
                          dpCodeId: validationRules[validationIndex].datapointId.id,
                          companyId: taskDetailsObject.companyId.id,
                          companyName: taskDetailsObject.companyId.companyName,
                          keyIssueId: validationRules[validationIndex].datapointId.keyIssueId.id,
                          keyIssue: validationRules[validationIndex].datapointId.keyIssueId.keyIssueName,
                          pillarId: taskDetailsObject.categoryId.id,
                          pillar: taskDetailsObject.categoryId.categoryName,
                          dataType: validationRules[validationIndex].datapointId.dataType,
                          fiscalYear: distinctYears[yearIndex],
                          memberName: boardDpCodesData.boardMemberList[boardMemberIndex].label,
                          memberId: boardDpCodesData.boardMemberList[boardMemberIndex].value,
                          isValidResponse: true,
                          description: []
                        }
                        if(validationRules[validationIndex].validationType == "3"){            
                          let previousResponseIndex = mergedDetails.findIndex((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == previousYear);
                          if(previousResponseIndex > -1){
                            let previousResponse = mergedDetails[previousResponseIndex];
                            try {
                                let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                                if(currentResponse){
                                  if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
                                    if (currentResponse.response.toLowerCase() == 'yes' || currentResponse.response.toLowerCase() == 'y') {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  } else {  
                                    dpCodeObject.isValidResponse = true;
                                  }
                                }
                            } catch (error) {
                              return res.status(412).json({ message: error.message,dpCode :validationRules[validationIndex].datapointId.code  });
                            }
                          } else{
                            dpCodeObject.isValidResponse = true;
                          }
                        } else if(validationRules[validationIndex].validationType == "8"){
                          if (validationRules[validationIndex].methodName.trim() == 'OR') {
                            let parameters = validationRules[validationIndex].dependentCodes;
                            if (parameters.length > 0) {
                                for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                                  let parameterDPResponse, previousYearResponse;
                                  _.filter(mergedDetails, (object, index) => {
                                    if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                      parameterDPResponse = object;
                                    } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                      previousYearResponse = object;
                                    }
                                  })
                                  let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                                  
                                if(previousYearResponse){
                                  if (parameterDPResponse && currentResponse) {
                                    if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                                      if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      } else {
                                        console.log("\n\n\n\n\n",validationRules[validationIndex].datapointId.code)
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      }
                                    }
                                  } else {                  
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                                }
                            }
                          } else if (validationRules[validationIndex].methodName.trim() == 'YES') {
                            let parameter = validationRules[validationIndex].dependentCodes;
                            let parameterDPResponse, previousYearResponse;
                              if(parameter.length > 0){          
                                for (let parameterIndex = 0; parameterIndex < parameter.length; parameterIndex++) {
                                  _.filter(mergedDetails, (object, index) => {
                                    if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameter[parameterIndex].id) {
                                      parameterDPResponse = object;
                                    } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                      previousYearResponse = object;
                                    }
                                  });
                                  let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                                  if(previousYearResponse){
                                  if (parameterDPResponse && currentResponse) {
                                    if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                                      if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      } else {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      }
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);                  }
                                  } else {                                   
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else{
                                  dpCodeObject.isValidResponse = true;                      
                                }              
                                }
                              } 
                          } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR') {
                            let parameters = validationRules[validationIndex].dependentCodes;
                            let param1Value, param2Value, param3Value;
                            let previousYearResponse;
                              _.filter(mergedDetails, (object, index) => {
                                if (object.companyId.id == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  previousYearResponse = object
                                } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                                  param1Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                                  param2Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                                  param3Value = object.response ? object.response : ''
                                }
                              });
                              if(previousYearResponse){
                                let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);  
                                if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
                                  if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  } else {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              } else {
                                dpCodeObject.isValidResponse = true;
                              }
                          } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR3') {
                            let parameters = validationRules[validationIndex].dependentCodes;
                            let param1Value, param2Value, param3Value, param4Value;
                            let previousYearResponse;
                              _.filter(mergedDetails, (object, index) => {
                                if (object.companyId.id == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  previousYearResponse = object
                                } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                                  param1Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                                  param2Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                                  param3Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[3].id, object.year == distinctYears[yearIndex]) {
                                  param4Value = object.response ? object.response : ''
                                }
                              })
                              let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                              if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes') && (param3Value == 'yes' || param3Value == 'yes') || (param4Value == 'yes' || param4Value == 'Yes'))) {
                                if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                  let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                  if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                }
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                              
                            //}
                          } else if(validationRules[validationIndex].methodName.trim() == 'ResponseCheck'){ 
                            let dpResponse ;             
                            _.filter(mergedDetails, (object, index) => {
                              if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                dpResponse = object;
                              }
                            });
                            if(validationRules[validationIndex].checkResponse.includes(dpResponse.response)){           
                              dpCodeObject.isValidResponse = false;
                              let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                              dpCodeObject.description.push(validationResponseObject);
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          // }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'YesCondition'){
                            let dpResponse, dependantCode;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                                  dependantCode = object;
                                }
                              }); 
                              if(dependantCode.response && dpResponse.response){
                                if(dependantCode.response.toLowerCase() == 'yes'){
                                  if(dpResponse.response.toLowerCase() == 'yes'){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'ORYes'){
                            let dpResponse, dependantCode,count = 0 ;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                                _.filter(mergedDetails, (object, index) => {
                                  if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                    dependantCode = object;
                                  }
                                }); 
                                if(dependantCode.response.toLowerCase() == 'yes'){
                                  count ++;
                                }
                              }
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                              }); 
                              if(dpResponse.response){
                                if(count > 0){
                                  if(dpResponse.response.toLowerCase() == 'yes'){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'Rated'){
                            let dpResponse, dependantCode;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                                  dependantCode = object;
                                }
                              }); 
                              if(dependantCode.response && dpResponse.response){
                                if(isNumber(dependantCode.response)){              
                                  if(isNumber(dpResponse.response)){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'ORRated'){
                            let dpResponse, dependantCode,count = 0 ;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                                _.filter(mergedDetails, (object, index) => {
                                  if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                    dependantCode = object;
                                  }
                                }); 
                                if(isNumber(dependantCode.response)){
                                  count ++;
                                }
                              }
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                              }); 
                              if(dpResponse.response){
                                if(count > 0){
                                  if(isNumber(dpResponse.response)){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }
                          
                        } else if(validationRules[validationIndex].validationType == "7"){
                          let zscoreValue ,performanceResult ;
                          let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                            let projectedValue = projectedValues.findIndex(object => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                            console.log(projectedValue)
                          if(projectedValue > -1){
                          if (validationRules[validationIndex].datapointId.polarity == 'Positive') {
                            zscoreValue = (Number(currentResponse.response) - Number(projectedValues[projectedValue].projectedAverage)) / Number(projectedValues[projectedValue].projectedStdDeviation);
                          } else {
                            zscoreValue = (Number(projectedValues[projectedValue].projectedAverage) - Number(currentResponse.response)) / Number(projectedValues[projectedValue].projectedStdDeviation);
                          }
                          if (zscoreValue > 4) {
                            performanceResult = 100
                          } else if (zscoreValue < -4) {
                            performanceResult = 0
                          } else if (zscoreValue == 'NA') {
                            performanceResult = 'NA'
                          } else {
                            //round of zscore value to two digit decimal value
                            if (zscoreValue) {
                              let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                              var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                              let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                              let zValues = ztableValue.values[0].split(",");
                              let zScore = zValues[Number(lastDigit)]
                              performanceResult = zScore * 100;
                            } else {
                              performanceResult = 'NA'
                            }
                          }
                          if(performanceResult == 'NA'){
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - Percentile value is NA" 
                            dpCodeObject.description.push(validationResponseObject);
                          } else {
                            if (Number(performanceResult) < Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', ''))){
                              
                              dpCodeObject.isValidResponse = true;
                            } else {
                              dpCodeObject.isValidResponse = false; 
                              let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                              dpCodeObject.description.push(validationResponseObject);
                            }
                          }
                        }
                        }       
                        if(boardDpCodesData.dpCodesData.length > 0) {
                          let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCodeId == validationRules[validationIndex].datapointId.id && obj.fiscalYear == distinctYears[yearIndex] && obj.memberId == boardDpCodesData.boardMemberList[boardMemberIndex].value);
                          if(yearfind > -1){
                            boardDpCodesData.dpCodesData[yearfind].description  = _.concat(boardDpCodesData.dpCodesData[yearfind].description,dpCodeObject.description);
                            if(boardDpCodesData.dpCodesData[yearfind].description.length > 0){
                              dpCodeObject.isValidResponse = false; 
                            } else{
                              dpCodeObject.isValidResponse = true; 
                            }
                          }else {
                            boardDpCodesData.dpCodesData.push(dpCodeObject)
                            }
                        } else {
                          boardDpCodesData.dpCodesData.push(dpCodeObject)
                        }
                      } catch (error) {
                        return res.status(500).json({ status: "500", message: error.message });
                      }
                    }                
                  }  
                } else if(validationDpType.dpType == 'Kmp Matrix'){
                  for (let kmpMemberIndex = 0; kmpMemberIndex < kmpDpCodesData.kmpMemberList.length; kmpMemberIndex++) {
                    for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
                      try {
                        let dpCodeObject = {
                        dpCode: validationRules[validationIndex].datapointId.code,
                        dpCodeId: validationRules[validationIndex].datapointId.id,
                        companyId: taskDetailsObject.companyId.id,
                        companyName: taskDetailsObject.companyId.companyName,
                        keyIssueId: validationRules[validationIndex].datapointId.keyIssueId.id,
                        keyIssue: validationRules[validationIndex].datapointId.keyIssueId.keyIssueName,
                        pillarId: taskDetailsObject.categoryId.id,
                        pillar: taskDetailsObject.categoryId.categoryName,
                        dataType: validationRules[validationIndex].datapointId.dataType,
                        fiscalYear: distinctYears[yearIndex],
                        memberName: kmpDpCodesData.kmpMemberList[kmpMemberIndex].label,
                        memberId: kmpDpCodesData.kmpMemberList[kmpMemberIndex].value,
                        isValidResponse: true,
                        description: []
                        }
                        if(validationRules[validationIndex].validationType == "3"){            
                          let previousResponseIndex = mergedDetails.findIndex((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == previousYear);
                        if(previousResponseIndex > -1){
                          let previousResponse = mergedDetails[previousResponseIndex];
                        try {
                            let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                            if(currentResponse){
                              if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
                                if (currentResponse.response.toLowerCase() == 'yes' || currentResponse.response.toLowerCase() == 'y') {
                                  dpCodeObject.isValidResponse = true;
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              } else {  
                                dpCodeObject.isValidResponse = true;
                              }
                            }
                        } catch (error) {
                          return res.status(412).json({ message: error.message,dpCode :validationRules[validationIndex].datapointId.code  });
                        }
                        } else{
                          dpCodeObject.isValidResponse = true;
                        }
                        } else if(validationRules[validationIndex].validationType == "8"){
                          if (validationRules[validationIndex].methodName.trim() == 'OR') {
                            let parameters = validationRules[validationIndex].dependentCodes;
                            if (parameters.length > 0) {
                                for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                                  let parameterDPResponse, previousYearResponse;
                                  _.filter(mergedDetails, (object, index) => {
                                    if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                      parameterDPResponse = object;
                                    } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                      previousYearResponse = object;
                                    }
                                  })
                                  let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && year == distinctYears[yearIndex]);
                                
                                if(previousYearResponse){
                                  if (parameterDPResponse) {
                                    if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                                      if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      } else {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      }
                                    }
                                  } else {
                                    return res.status(404).json({ message: "Response is missing for " + parameters[parameterIndex].code + "year :"+ distinctYears[yearIndex]});
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                                }
                            }
                          } else if (validationRules[validationIndex].methodName.trim() == 'YES') {
                            let parameter = validationRules[validationIndex].dependentCodes;
                            let parameterDPResponse, previousYearResponse;
                              if(parameter.length > 0){          
                                for (let parameterIndex = 0; parameterIndex < parameter.length; parameterIndex++) {
                                  _.filter(mergedDetails, (object, index) => {
                                    if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameter[parameterIndex].id) {
                                      parameterDPResponse = object;
                                    } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                      previousYearResponse = object;
                                    }
                                  });
                                  let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                                if(previousYearResponse){
                                  if (parameterDPResponse) {
                                    if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                                      if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      } else {
                                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                        if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                          dpCodeObject.isValidResponse = true;
                                        } else {
                                          dpCodeObject.isValidResponse = false;
                                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                          dpCodeObject.description.push(validationResponseObject);
                                        }
                                      }
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);                  }
                                  } else {
                                    return res.status(404).json({ message: "Response is missing for " + parameter[parameterIndex].code + "year :"+ distinctYears[yearIndex]});
                                  }
                                } else{
                                  dpCodeObject.isValidResponse = true;                      
                                }              
                                }
                              } 
                          } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR') {
                            let parameters = validationRules[validationIndex].dependentCodes;
                            let param1Value, param2Value, param3Value;
                            let previousYearResponse;
                              _.filter(mergedDetails, (object, index) => {
                                if (object.companyId.id == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  previousYearResponse = object
                                } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                                  param1Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                                  param2Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                                  param3Value = object.response ? object.response : ''
                                }
                              });
                              if(previousYearResponse){
                                let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);  
                                if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
                                  if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  } else {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              } else {
                                dpCodeObject.isValidResponse = true;
                              }
                          } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR3') {
                            let parameters = validationRules[validationIndex].dependentCodes;
                            let param1Value, param2Value, param3Value, param4Value;
                            let previousYearResponse;
                              _.filter(mergedDetails, (object, index) => {
                                if (object.companyId.id == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  previousYearResponse = object
                                } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                                  param1Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                                  param2Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                                  param3Value = object.response ? object.response : ''
                                } else if (object.datapointId.id == parameters[3].id, object.year == distinctYears[yearIndex]) {
                                  param4Value = object.response ? object.response : ''
                                }
                              })
                              let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                              if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes') && (param3Value == 'yes' || param3Value == 'yes') || (param4Value == 'yes' || param4Value == 'Yes'))) {
                                if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                  let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                  if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                }
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                              
                            //}
                          } else if(validationRules[validationIndex].methodName.trim() == 'ResponseCheck'){ 
                            let dpResponse ;             
                            _.filter(mergedDetails, (object, index) => {
                              if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                dpResponse = object;
                              }
                            });
                            if(validationRules[validationIndex].checkResponse.includes(dpResponse.response)){           
                              dpCodeObject.isValidResponse = false;
                              let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                              dpCodeObject.description.push(validationResponseObject);
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                        // }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'YesCondition'){
                            let dpResponse, dependantCode;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                                  dependantCode = object;
                                }
                              }); 
                              if(dependantCode.response && dpResponse.response){
                                if(dependantCode.response.toLowerCase() == 'yes'){
                                  if(dpResponse.response.toLowerCase() == 'yes'){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'ORYes'){
                            let dpResponse, dependantCode,count = 0 ;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                                _.filter(mergedDetails, (object, index) => {
                                  if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                    dependantCode = object;
                                  }
                                }); 
                                if(dependantCode.response.toLowerCase() == 'yes'){
                                  count ++;
                                }
                              }
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                              }); 
                              if(dpResponse.response){
                                if(count > 0){
                                  if(dpResponse.response.toLowerCase() == 'yes'){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'Rated'){
                            let dpResponse, dependantCode;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                                  dependantCode = object;
                                }
                              }); 
                              if(dependantCode.response && dpResponse.response){
                                if(isNumber(dependantCode.response)){              
                                  if(isNumber(dpResponse.response)){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }  else if(validationRules[validationIndex].methodName.trim() == 'ORRated'){
                            let dpResponse, dependantCode,count = 0 ;
                              let parameters = validationRules[validationIndex].dependentCodes;
                              if(parameters.length > 0){
                              for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                                _.filter(mergedDetails, (object, index) => {
                                  if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                    dependantCode = object;
                                  }
                                }); 
                                if(isNumber(dependantCode.response)){
                                  count ++;
                                }
                              }
                              _.filter(mergedDetails, (object, index) => {
                                if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                  dpResponse = object;
                                }
                              }); 
                              if(dpResponse.response){
                                if(count > 0){
                                  if(isNumber(dpResponse.response)){
                                    dpCodeObject.isValidResponse = true;
                                  } else {
                                    dpCodeObject.isValidResponse = false;
                                    let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                    dpCodeObject.description.push(validationResponseObject);
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = true;
                                }
                              }
                            }
                          }
                          
                        } else if(validationRules[validationIndex].validationType == "7"){
                          let zscoreValue ,performanceResult ;
                          let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                           let projectedValue = projectedValues.find(object => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                          if (validationRules[validationIndex].datapointId.polarity == 'Positive') {
                            zscoreValue = (Number(currentResponse.response) - Number(projectedValue.projectedAverage)) / Number(projectedValue.projectedStdDeviation);
                          } else {
                            zscoreValue = (Number(projectedValue.projectedAverage) - Number(currentResponse.response)) / Number(projectedValue.projectedStdDeviation);
                          }
                          if (zscoreValue > 4) {
                            performanceResult = 100
                          } else if (zscoreValue < -4) {
                            performanceResult = 0
                          } else if (zscoreValue == 'NA') {
                            performanceResult = 'NA'
                          } else {
                            //round of zscore value to two digit decimal value
                            if (zscoreValue) {
                              let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                              var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                              let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                              let zValues = ztableValue.values[0].split(",");
                              let zScore = zValues[Number(lastDigit)]
                              performanceResult = zScore * 100;
                            } else {
                              performanceResult = 'NA'
                            }
                          }
                          if(performanceResult == 'NA'){
                           dpCodeObject.isValidResponse = false;
                           let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - Percentile value is NA" 
                           dpCodeObject.description.push(validationResponseObject);
                          } else {
                            if (Number(performanceResult) < Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', ''))){
                            
                             dpCodeObject.isValidResponse = true;
                            } else {
                             dpCodeObject.isValidResponse = false; 
                             let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                             dpCodeObject.description.push(validationResponseObject);
                            }
                          }
                        }     
                        if(kmpDpCodesData.dpCodesData.length > 0) {
                          let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCodeId == validationRules[validationIndex].datapointId.id && obj.fiscalYear == distinctYears[yearIndex] && obj.memberId == kmpDpCodesData.kmpMemberList[kmpMemberIndex].value);
                          if(yearfind > -1){
                            kmpDpCodesData.dpCodesData[yearfind].description  = _.concat(kmpDpCodesData.dpCodesData[yearfind].description,dpCodeObject.description);
                            if(kmpDpCodesData.dpCodesData[yearfind].description.length > 0){
                              dpCodeObject.isValidResponse = false; 
                            } else{
                              dpCodeObject.isValidResponse = true;
                            }
                          }else {
                            kmpDpCodesData.dpCodesData.push(dpCodeObject)
                            }
                        } else {
                          kmpDpCodesData.dpCodesData.push(dpCodeObject)
                        }
                      } catch (error) {
                        return res.status(500).json({ status: "500", message: error.message })
                      }
                    }                
                  }
                } else if (validationDpType.dpType == 'Standalone') {
                  for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
                    let dpCodeObject = {
                      dpCode: validationRules[validationIndex].datapointId.code,
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      companyId: taskDetailsObject.companyId.id,
                      companyName: taskDetailsObject.companyId.companyName,
                      keyIssueId: validationRules[validationIndex].datapointId.keyIssueId.id,
                      keyIssue: validationRules[validationIndex].datapointId.keyIssueId.keyIssueName,
                      pillarId: taskDetailsObject.categoryId.id,
                      pillar: taskDetailsObject.categoryId.categoryName,
                      dataType: validationRules[validationIndex].datapointId.dataType,
                      fiscalYear: distinctYears[yearIndex],
                      isValidResponse: true,
                      description: []
                    }
                    if (validationRules[validationIndex].validationType == "3") {
                      let previousResponseIndex = mergedDetails.findIndex((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == previousYear);
                      if (previousResponseIndex > -1) {
                        let previousResponse = mergedDetails[previousResponseIndex];
                        try {
                          let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                          if (currentResponse) {
                            if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
                              if (currentResponse.response.toLowerCase() == 'yes' || currentResponse.response.toLowerCase() == 'y') {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        } catch (error) {
                          return res.status(412).json({ message: error.message, dpCode: validationRules[validationIndex].datapointId.code });
                        }
                      } else {
                        dpCodeObject.isValidResponse = true;
                      }
                    } else if (validationRules[validationIndex].validationType == "8") {
                      if (validationRules[validationIndex].methodName.trim() == 'OR') {
                        let parameters = validationRules[validationIndex].dependentCodes;
                        if (parameters.length > 0) {
                          for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                            let parameterDPResponse, previousYearResponse;
                            _.filter(mergedDetails, (object, index) => {
                              if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                parameterDPResponse = object;
                              } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                previousYearResponse = object;
                              }
                            })
                            let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
  
                            if (previousYearResponse) {
                              if (parameterDPResponse && currentResponse) {
                                if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                                  if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  } else {
                                    console.log("\n\n\n\n\n", validationRules[validationIndex].datapointId.code)
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  }
                                }
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        }
                      } else if (validationRules[validationIndex].methodName.trim() == 'YES') {
                        let parameter = validationRules[validationIndex].dependentCodes;
                        let parameterDPResponse, previousYearResponse;
                        if (parameter.length > 0) {
                          for (let parameterIndex = 0; parameterIndex < parameter.length; parameterIndex++) {
                            _.filter(mergedDetails, (object, index) => {
                              if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameter[parameterIndex].id) {
                                parameterDPResponse = object;
                              } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                                previousYearResponse = object;
                              }
                            });
                            let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                            if (previousYearResponse) {
                              if (parameterDPResponse && currentResponse) {
                                if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                                  if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  } else {
                                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                    if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                      dpCodeObject.isValidResponse = true;
                                    } else {
                                      dpCodeObject.isValidResponse = false;
                                      let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                      dpCodeObject.description.push(validationResponseObject);
                                    }
                                  }
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        }
                      } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR') {
                        let parameters = validationRules[validationIndex].dependentCodes;
                        let param1Value, param2Value, param3Value;
                        let previousYearResponse;
                        _.filter(mergedDetails, (object, index) => {
                          if (object.companyId.id == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                            previousYearResponse = object
                          } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                            param1Value = object.response ? object.response : ''
                          } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                            param2Value = object.response ? object.response : ''
                          } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                            param3Value = object.response ? object.response : ''
                          }
                        });
                        if (previousYearResponse) {
                          let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                          if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
                            if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                              let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                              if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                              if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            }
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR3') {
                        let parameters = validationRules[validationIndex].dependentCodes;
                        let param1Value, param2Value, param3Value, param4Value;
                        let previousYearResponse;
                        _.filter(mergedDetails, (object, index) => {
                          if (object.companyId.id == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                            previousYearResponse = object
                          } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                            param1Value = object.response ? object.response : ''
                          } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                            param2Value = object.response ? object.response : ''
                          } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                            param3Value = object.response ? object.response : ''
                          } else if (object.datapointId.id == parameters[3].id, object.year == distinctYears[yearIndex]) {
                            param4Value = object.response ? object.response : ''
                          }
                        })
                        let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                        if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes') && (param3Value == 'yes' || param3Value == 'yes') || (param4Value == 'yes' || param4Value == 'Yes'))) {
                          if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                            let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                            if (Number(currentResponse.response) > Number(calculatedResponse)) {
                              dpCodeObject.isValidResponse = true;
                            } else {
                              dpCodeObject.isValidResponse = false;
                              let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                              dpCodeObject.description.push(validationResponseObject);
                            }
                          }
                        } else {
                          dpCodeObject.isValidResponse = false;
                          let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                          dpCodeObject.description.push(validationResponseObject);
                        }
  
                        //}
                      } else if (validationRules[validationIndex].methodName.trim() == 'ResponseCheck') {
                        let dpResponse;
                        _.filter(mergedDetails, (object, index) => {
                          if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                            dpResponse = object;
                          }
                        });
                        if (validationRules[validationIndex].checkResponse.includes(dpResponse.response)) {
                          dpCodeObject.isValidResponse = false;
                          let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                          dpCodeObject.description.push(validationResponseObject);
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                        // }
                      } else if (validationRules[validationIndex].methodName.trim() == 'YesCondition') {
                        let dpResponse, dependantCode;
                        let parameters = validationRules[validationIndex].dependentCodes;
                        if (parameters.length > 0) {
                          _.filter(mergedDetails, (object, index) => {
                            if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                              dpResponse = object;
                            }
                            if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                              dependantCode = object;
                            }
                          });
                          if (dependantCode.response && dpResponse.response) {
                            if (dependantCode.response.toLowerCase() == 'yes') {
                              if (dpResponse.response.toLowerCase() == 'yes') {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        }
                      } else if (validationRules[validationIndex].methodName.trim() == 'ORYes') {
                        let dpResponse, dependantCode, count = 0;
                        let parameters = validationRules[validationIndex].dependentCodes;
                        if (parameters.length > 0) {
                          for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                            _.filter(mergedDetails, (object, index) => {
                              if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                dependantCode = object;
                              }
                            });
                            if (dependantCode.response.toLowerCase() == 'yes') {
                              count++;
                            }
                          }
                          _.filter(mergedDetails, (object, index) => {
                            if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                              dpResponse = object;
                            }
                          });
                          if (dpResponse.response) {
                            if (count > 0) {
                              if (dpResponse.response.toLowerCase() == 'yes') {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        }
                      } else if (validationRules[validationIndex].methodName.trim() == 'Rated') {
                        let dpResponse, dependantCode;
                        let parameters = validationRules[validationIndex].dependentCodes;
                        if (parameters.length > 0) {
                          _.filter(mergedDetails, (object, index) => {
                            if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                              dpResponse = object;
                            }
                            if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                              dependantCode = object;
                            }
                          });
                          if (dependantCode.response && dpResponse.response) {
                            if (isNumber(dependantCode.response)) {
                              if (isNumber(dpResponse.response)) {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        }
                      } else if (validationRules[validationIndex].methodName.trim() == 'ORRated') {
                        let dpResponse, dependantCode, count = 0;
                        let parameters = validationRules[validationIndex].dependentCodes;
                        if (parameters.length > 0) {
                          for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                            _.filter(mergedDetails, (object, index) => {
                              if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                                dependantCode = object;
                              }
                            });
                            if (isNumber(dependantCode.response)) {
                              count++;
                            }
                          }
                          _.filter(mergedDetails, (object, index) => {
                            if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                              dpResponse = object;
                            }
                          });
                          if (dpResponse.response) {
                            if (count > 0) {
                              if (isNumber(dpResponse.response)) {
                                dpCodeObject.isValidResponse = true;
                              } else {
                                dpCodeObject.isValidResponse = false;
                                let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                                dpCodeObject.description.push(validationResponseObject);
                              }
                            } else {
                              dpCodeObject.isValidResponse = true;
                            }
                          }
                        }
                      }
  
                    } else if (validationRules[validationIndex].validationType == "7") {
                      let zscoreValue, performanceResult;
                      let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                      let projectedValue = projectedValues.findIndex(object => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                      console.log(projectedValue)
                      if (projectedValue > -1) {
                        if (validationRules[validationIndex].datapointId.polarity == 'Positive') {
                          zscoreValue = (Number(currentResponse.response) - Number(projectedValues[projectedValue].projectedAverage)) / Number(projectedValues[projectedValue].projectedStdDeviation);
                        } else {
                          zscoreValue = (Number(projectedValues[projectedValue].projectedAverage) - Number(currentResponse.response)) / Number(projectedValues[projectedValue].projectedStdDeviation);
                        }
                        if (zscoreValue > 4) {
                          performanceResult = 100
                        } else if (zscoreValue < -4) {
                          performanceResult = 0
                        } else if (zscoreValue == 'NA') {
                          performanceResult = 'NA'
                        } else {
                          //round of zscore value to two digit decimal value
                          if (zscoreValue) {
                            let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                            var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                            let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                            let zValues = ztableValue.values[0].split(",");
                            let zScore = zValues[Number(lastDigit)]
                            performanceResult = zScore * 100;
                          } else {
                            performanceResult = 'NA'
                          }
                        }
                        if (performanceResult == 'NA') {
                          dpCodeObject.isValidResponse = false;
                          let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - Percentile value is NA"
                          dpCodeObject.description.push(validationResponseObject);
                        } else {
                          if (Number(performanceResult) < Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', ''))) {
  
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type " + validationRules[validationIndex].validationType + " - " + validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        }
                      }
                    }
                    if (validationResponse.length > 0) {
                      let yearfind = validationResponse.findIndex(obj => obj.dpCodeId == validationRules[validationIndex].datapointId.id && obj.fiscalYear == distinctYears[yearIndex]);
                      if (yearfind > -1) {
                        validationResponse[yearfind].description = _.concat(validationResponse[yearfind].description, dpCodeObject.description);
                        if (validationResponse[yearfind].description.length > 0) {
                          dpCodeObject.isValidResponse = false;
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      } else {
                        validationResponse.push(dpCodeObject)
                      }
                    } else {
                      validationResponse.push(dpCodeObject)
                    }
                  }
                }
              }
              console.log(validationResponse, boardDpCodesData)
              if(validationIndex == validationRules.length - 1){
                return res.status(200).send({
                  status: "200",
                  message: "Data correction dp codes retrieved successfully!",
                  keyIssuesList: keyIssuesList,
                  standalone: {            
                    dpCodesData: validationResponse
                  },
                  boardMatrix: boardDpCodesData,
                  kmpMatrix: kmpDpCodesData
                })
              }
            }
          }
        } else {
          let keyIssuesCollection = await Datapoints.find({
            dataCollection: 'Yes',
            functionId: {
              "$ne": functionId.id
            },
            clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id,
            categoryId: taskDetailsObject.categoryId.id,
            status: true
          }).populate('keyIssueId');      
          let keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
          for (let keyIssueListIndex = 0; keyIssueListIndex < keyIssueListObject.length; keyIssueListIndex++) {
            let keyIssues = {
              label: keyIssueListObject[keyIssueListIndex].keyIssueId.keyIssueName,
              value: keyIssueListObject[keyIssueListIndex].keyIssueId.id
            }
            keyIssuesList.push(keyIssues);
          }
          for(let validationIndex = 0; validationIndex < validationRules.length; validationIndex++){
            for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
              try {
                let dpCodeObject = {
                dpCode: validationRules[validationIndex].datapointId.code,
                dpCodeId: validationRules[validationIndex].datapointId.id,
                companyId: taskDetailsObject.companyId.id,
                companyName: taskDetailsObject.companyId.companyName,
                keyIssueId: validationRules[validationIndex].datapointId.keyIssueId.id,
                keyIssue: validationRules[validationIndex].datapointId.keyIssueId.keyIssueName,
                pillarId: taskDetailsObject.categoryId.id,
                pillar: taskDetailsObject.categoryId.categoryName,
                dataType: validationRules[validationIndex].datapointId.dataType,
                fiscalYear: distinctYears[yearIndex],
                isValidResponse: true,
                description: []
                }
                if(validationRules[validationIndex].validationType == "3"){            
                  let previousResponseIndex = mergedDetails.findIndex((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == previousYear);
                  if(previousResponseIndex > -1){
                    let previousResponse = mergedDetails[previousResponseIndex];
                    try {
                        let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                        if(currentResponse){
                          if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
                            if (currentResponse.response.toLowerCase() == 'yes' || currentResponse.response.toLowerCase() == 'y') {
                              dpCodeObject.isValidResponse = true;
                            } else {
                              dpCodeObject.isValidResponse = false;
                              let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                              dpCodeObject.description.push(validationResponseObject);
                            }
                          } else {  
                            dpCodeObject.isValidResponse = true;
                          }
                        }
                    } catch (error) {
                      return res.status(412).json({ message: error.message,dpCode :validationRules[validationIndex].datapointId.code  });
                    }
                  } else{
                    dpCodeObject.isValidResponse = true;
                  }
                } else if(validationRules[validationIndex].validationType == "8"){
                  if (validationRules[validationIndex].methodName.trim() == 'OR') {
                    let parameters = validationRules[validationIndex].dependentCodes;
                    if (parameters.length > 0) {
                      for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                        let parameterDPResponse, previousYearResponse;
                        _.filter(mergedDetails, (object, index) => {
                          if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                            parameterDPResponse = object;
                          } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                            previousYearResponse = object;
                          }
                        })
                        let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                      
                        if(previousYearResponse){
                          if (parameterDPResponse && currentResponse) {
                            if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                              if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                  dpCodeObject.isValidResponse = true;
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              } else {
                                console.log("\n\n\n\n\n",validationRules[validationIndex].datapointId.code)
                                let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                  dpCodeObject.isValidResponse = true;
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              }
                            }
                          } else {                  
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      }
                    }
                  } else if (validationRules[validationIndex].methodName.trim() == 'YES') {
                    let parameter = validationRules[validationIndex].dependentCodes;
                    let parameterDPResponse, previousYearResponse;
                    if(parameter.length > 0){          
                      for (let parameterIndex = 0; parameterIndex < parameter.length; parameterIndex++) {
                        _.filter(mergedDetails, (object, index) => {
                          if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameter[parameterIndex].id) {
                            parameterDPResponse = object;
                          } else if (object.companyId == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                            previousYearResponse = object;
                          }
                        });
                        let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                        if(previousYearResponse){
                          if (parameterDPResponse && currentResponse) {
                            if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                              if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                                let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                if (Number(currentResponse.response) > Number(calculatedResponse)) {
                                  dpCodeObject.isValidResponse = true;
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              } else {
                                let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                                if (Number(currentResponse.response) < Number(calculatedResponse)) {
                                  dpCodeObject.isValidResponse = true;
                                } else {
                                  dpCodeObject.isValidResponse = false;
                                  let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                                  dpCodeObject.description.push(validationResponseObject);
                                }
                              }
                            } else {
                              dpCodeObject.isValidResponse = false;
                              let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                              dpCodeObject.description.push(validationResponseObject);
                            }
                          } else {                                   
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else{
                          dpCodeObject.isValidResponse = true;
                        }
                      }
                    }
                  } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR') {
                    let parameters = validationRules[validationIndex].dependentCodes;
                    let param1Value, param2Value, param3Value;
                    let previousYearResponse;
                    _.filter(mergedDetails, (object, index) => {
                      if (object.companyId.id == taskDetailsObject.companyId.id, object.year == previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                        previousYearResponse = object
                      } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                        param1Value = object.response ? object.response : ''
                      } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                        param2Value = object.response ? object.response : ''
                      } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                        param3Value = object.response ? object.response : ''
                      }
                    });
                    if(previousYearResponse){
                      let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);  
                      if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
                        if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                          let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                          if (Number(currentResponse.response) > Number(calculatedResponse)) {
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                          if (Number(currentResponse.response) < Number(calculatedResponse)) {
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        }
                      } else {
                        dpCodeObject.isValidResponse = false;
                        let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                        dpCodeObject.description.push(validationResponseObject);
                      }
                    } else {
                      dpCodeObject.isValidResponse = true;
                    }
                  } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR3') {
                    let parameters = validationRules[validationIndex].dependentCodes;
                    let param1Value, param2Value, param3Value, param4Value;
                    let previousYearResponse;
                    _.filter(mergedDetails, (object, index) => {
                      if (object.companyId.id == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                        previousYearResponse = object
                      } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
                        param1Value = object.response ? object.response : ''
                      } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
                        param2Value = object.response ? object.response : ''
                      } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
                        param3Value = object.response ? object.response : ''
                      } else if (object.datapointId.id == parameters[3].id, object.year == distinctYears[yearIndex]) {
                        param4Value = object.response ? object.response : ''
                      }
                    })
                    let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
                    if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes') && (param3Value == 'yes' || param3Value == 'yes') || (param4Value == 'yes' || param4Value == 'Yes'))) {
                      if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                        let calculatedResponse = (Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                        if (Number(currentResponse.response) > Number(calculatedResponse)) {
                          dpCodeObject.isValidResponse = true;
                        } else {
                          dpCodeObject.isValidResponse = false;
                          let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                          dpCodeObject.description.push(validationResponseObject);
                        }
                      }
                    } else {
                      dpCodeObject.isValidResponse = false;
                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                      dpCodeObject.description.push(validationResponseObject);
                    }
                  } else if(validationRules[validationIndex].methodName.trim() == 'ResponseCheck'){
                    let dpResponse ;             
                    _.filter(mergedDetails, (object, index) => {
                      if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                        dpResponse = object;
                      }
                    });
                    if(validationRules[validationIndex].checkResponse.includes(dpResponse.response)){           
                      dpCodeObject.isValidResponse = false;
                      let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                      dpCodeObject.description.push(validationResponseObject);
                    } else {
                      dpCodeObject.isValidResponse = true;
                    }
                  } else if(validationRules[validationIndex].methodName.trim() == 'YesCondition'){
                    let dpResponse, dependantCode;
                    let parameters = validationRules[validationIndex].dependentCodes;
                    if(parameters.length > 0){
                      _.filter(mergedDetails, (object, index) => {
                        if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                          dpResponse = object;
                        }
                        if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                          dependantCode = object;
                        }
                      }); 
                      if(dependantCode.response && dpResponse.response){
                        if(dependantCode.response.toLowerCase() == 'yes'){
                          if(dpResponse.response.toLowerCase() == 'yes'){
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      }
                    }
                  } else if(validationRules[validationIndex].methodName.trim() == 'ORYes'){
                    let dpResponse, dependantCode,count = 0 ;
                    let parameters = validationRules[validationIndex].dependentCodes;
                    if(parameters.length > 0){
                      for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                        _.filter(mergedDetails, (object, index) => {
                          if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                            dependantCode = object;
                          }
                        }); 
                        if(dependantCode.response.toLowerCase() == 'yes'){
                          count ++;
                        }
                      }
                      _.filter(mergedDetails, (object, index) => {
                        if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                          dpResponse = object;
                        }
                      }); 
                      if(dpResponse.response){
                        if(count > 0){
                          if(dpResponse.response.toLowerCase() == 'yes'){
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      }
                    }
                  } else if(validationRules[validationIndex].methodName.trim() == 'Rated'){
                    let dpResponse, dependantCode;
                    let parameters = validationRules[validationIndex].dependentCodes;
                    if(parameters.length > 0){
                      _.filter(mergedDetails, (object, index) => {
                        if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                          dpResponse = object;
                        }
                        if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[0].id) {
                          dependantCode = object;
                        }
                      }); 
                      if(dependantCode.response && dpResponse.response){
                        if(isNumber(dependantCode.response)){              
                          if(isNumber(dpResponse.response)){
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      }
                    }
                  } else if(validationRules[validationIndex].methodName.trim() == 'ORRated'){
                    let dpResponse, dependantCode,count = 0 ;
                    let parameters = validationRules[validationIndex].dependentCodes;
                    if(parameters.length > 0){
                      for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                        _.filter(mergedDetails, (object, index) => {
                          if (object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                            dependantCode = object;
                          }
                        }); 
                        if(isNumber(dependantCode.response)){
                          count ++;
                        }
                      }
                      _.filter(mergedDetails, (object, index) => {
                        if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                          dpResponse = object;
                        }
                      }); 
                      if(dpResponse.response){
                        if(count > 0){
                          if(isNumber(dpResponse.response)){
                            dpCodeObject.isValidResponse = true;
                          } else {
                            dpCodeObject.isValidResponse = false;
                            let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                            dpCodeObject.description.push(validationResponseObject);
                          }
                        } else {
                          dpCodeObject.isValidResponse = true;
                        }
                      }
                    }
                  }
                }else if(validationRules[validationIndex].validationType == "7"){
                  let zscoreValue ,performanceResult ;
                  let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                   let projectedValue = projectedValues.findIndex(object => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.year == distinctYears[yearIndex]);
                   console.log(projectedValue)
                  if(projectedValue > -1){
                  if (validationRules[validationIndex].datapointId.polarity == 'Positive') {
                    zscoreValue = (Number(currentResponse.response) - Number(projectedValues[projectedValue].projectedAverage)) / Number(projectedValues[projectedValue].projectedStdDeviation);
                  } else {
                    zscoreValue = (Number(projectedValues[projectedValue].projectedAverage) - Number(currentResponse.response)) / Number(projectedValues[projectedValue].projectedStdDeviation);
        
                  }
                  if (zscoreValue > 4) {
                    performanceResult = 100
                  } else if (zscoreValue < -4) {
                    performanceResult = 0
    
                  } else if (zscoreValue == 'NA') {
                    performanceResult = 'NA'
                  } else {
                    //round of zscore value to two digit decimal value
                    if (zscoreValue) {
                      let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                      var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                      let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                      let zValues = ztableValue.values[0].split(",");
                      let zScore = zValues[Number(lastDigit)]
                      performanceResult = zScore * 100;
                    } else {
                      performanceResult = 'NA'
                    }
                  }
                  if(performanceResult == 'NA'){
                   dpCodeObject.isValidResponse = false;
                   let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - Percentile value is NA" 
                   dpCodeObject.description.push(validationResponseObject);
                  } else {
                    if (Number(performanceResult) < Number(validationRules[validationIndex].percentileThreasholdValue.replace('%', ''))){
                    
                     dpCodeObject.isValidResponse = true;
                    } else {
                     dpCodeObject.isValidResponse = false; 
                     let validationResponseObject = "Type "+validationRules[validationIndex].validationType+" - " +validationRules[validationIndex].errorMessage
                     dpCodeObject.description.push(validationResponseObject);
                    }
                  }
                }
                }      
                if(validationResponse.length > 0) {
                  let yearfind = validationResponse.findIndex(obj => obj.dpCodeId == validationRules[validationIndex].datapointId.id && obj.fiscalYear == distinctYears[yearIndex] );
                  if(yearfind > -1){
                    let descriptionDetails = _.concat(validationResponse[yearfind].description,dpCodeObject.description); 
                    validationResponse[yearfind].description = _.concat(validationResponse[yearfind].description,dpCodeObject.description);         
                    if(validationResponse[yearfind].description.length > 0){
                      dpCodeObject.isValidResponse = false;
                    } else {
                      dpCodeObject.isValidResponse = true;
                    }
                  } else {
                    validationResponse.push(dpCodeObject)
                  }
                } else {
                  validationResponse.push(dpCodeObject)
                }
              } catch (error) {
                return res.status(500).json({ status: "500", message: error.message })
              }
            }
            if(validationIndex == validationRules.length - 1){
              return res.status(200).send({
                status: "200",
                message: "Data correction dp codes retrieved successfully!",
                keyIssuesList: keyIssuesList,
                standalone: {
                  dpCodesData: validationResponse
                }
              })
            }
          }
        }
      } else {
        return res.status(200).json({
          status: "200",
          message: "No dp codes available",
          dpCodeData: dpCodesData
        });
      }
    // } else {
    //   return res.status(200).json({
    //     status: "200",
    //     message: "Validation success as no validation added!"
    //   });
    // }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message })
  }
}