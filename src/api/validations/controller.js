import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Validations } from '.'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { DerivedDatapoints } from '../derived_datapoints'
import _, { concat, isNumber } from 'lodash'
import { TaskAssignment } from '../taskAssignment'
import { ProjectedValues } from "../projected_values";

export const create = ({ user, bodymen: { body } }, res, next) =>
  Validations.create({ ...body, createdBy: user })
    .then((validations) => validations.view(true))
    .then(success(res, 201))
    .catch(next)

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

export const type8Validation = async ({ user, body }, res, next) => {
  console.log(body.datapointId, body.companyId, body.clientTaxonomyId, body.currentYear, params.previousYear, body.response);
  let derivedDatapoints = await DerivedDatapoints.find({ companyId: body.companyId, status: true }).populate('datapointId');
  let standalone_datapoints = await StandaloneDatapoints.find({ companyId: body.companyId, status: true }).populate('datapointId');
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
              let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
              if (Number(body.response) > Number(calculatedResponse)) {
                return res.status(200).json({ message: "Valid Response", isValidResponse: true });
              } else {
                return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
              }
            } else {
              let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
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
          let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
          if (Number(body.response) > Number(calculatedResponse)) {
            return res.status(200).json({ message: "Valid Response", isValidResponse: true });
          } else {
            return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
          }
        } else {
          let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
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
        let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
        if (Number(body.response) > Number(calculatedResponse)) {
          return res.status(200).json({ message: "Valid Response", isValidResponse: true });
        } else {
          return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
        }
      } else {
        let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
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
        let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
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
}

export const type3Validation = async ({ user, body }, res, next) => {
  console.log(body.datapointId, body.companyId, body.clientTaxonomyId, params.previousYear, body.response);
  let previousResponse = await StandaloneDatapoints.findOne({ datapointId: body.datapointId, companyId: body.companyId, year: params.previousYear });
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

export const getAllValidation =async ({ user, params }, res, next) => {
 
  let validationResponse = [];
  let taskDetailsObject = await TaskAssignment.findOne({_id: params.taskId}).populate({
    path: "companyId",
  populate: {
    path: "clientTaxonomyId"
  }}).populate('categoryId');
  
  let distinctYears = taskDetailsObject.year.split(',');
  let validationRules = await Validations.find({categoryId: taskDetailsObject.categoryId.id}).populate('datapointId');
  let derivedDatapoints = await DerivedDatapoints.find({ companyId: taskDetailsObject.companyId.id, status: true }).populate('datapointId').populate('companyId');
  let standalone_datapoints = await StandaloneDatapoints.find({ companyId: taskDetailsObject.companyId.id, status: true }).populate('datapointId').populate('companyId');
 // let projectedValues = await ProjectedValues.find({clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, nic: taskDetailsObject.companyId.nic, year: {$in : distinctYears}}).populate('datapointId');
  let mergedDetails = _.concat(derivedDatapoints, standalone_datapoints);
  for (let validationIndex = 0; validationIndex < validationRules.length; validationIndex++) {
    if(validationRules[validationIndex].validationType == "3"){
      
      let previousResponseIndex = mergedDetails.findIndex((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == params.previousYear);
    if(previousResponseIndex > -1){
      let previousResponse = mergedDetails[previousResponseIndex];
    try {
      for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
        let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
        if(currentResponse){
          if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
            if (currentResponse.response.toLowerCase() == 'yes' || currentResponse.response.toLowerCase() == 'y') {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: true,
                year: distinctYears[yearIndex],
                validationType: validationRules[validationIndex].validationType
              }
              validationResponse.push(validationResponseObject);
            } else {
                    let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: false,
                      year: distinctYears[yearIndex],                
                      errorMessage : validationRules[validationIndex].errorMessage,
                      validationType: validationRules[validationIndex].validationType
                    }
              validationResponse.push(validationResponseObject);
            }
          } else {
            let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: true,
            year: distinctYears[yearIndex],
            validationType: validationRules[validationIndex].validationType
          }
            validationResponse.push(validationResponseObject);
          }
        }
      }
    } catch (error) {
      return res.status(412).json({ message: error.message,dpCode :validationRules[validationIndex].datapointId.code  });
    }
  }
    } else if(validationRules[validationIndex].validationType == "8"){
      let previousResponseIndex = mergedDetails.findIndex((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == params.previousYear);
      if(previousResponseIndex > -1){

      if (validationRules[validationIndex].methodName.trim() == 'OR') {
        let parameters = validationRules[validationIndex].dependentCodes;
        if (parameters.length > 0) {
          for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
            for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
              let parameterDPResponse, previousYearResponse;
              _.filter(mergedDetails, (object, index) => {
                if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameters[parameterIndex].id) {
                  parameterDPResponse = object;
                } else if (object.companyId == taskDetailsObject.companyId.id, object.year == params.previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                  previousYearResponse = object;
                }
              })
              let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && year == distinctYears[yearIndex]);
             
              console.log(parameterDPResponse, previousYearResponse)
              if (parameterDPResponse) {
                if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                  if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                    if (Number(currentResponse.response) > Number(calculatedResponse)) {
                      let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: true,
                      year: distinctYears[yearIndex],
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    } else {
                    let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: false,
                      year: distinctYears[yearIndex],                
                      errorMessage : validationRules[validationIndex].errorMessage,
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    }
                  } else {
                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                    if (Number(currentResponse.response) < Number(calculatedResponse)) {
                      let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: true,
                      year: distinctYears[yearIndex],
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    } else {
                    let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: false,
                      year: distinctYears[yearIndex],                
                      errorMessage : validationRules[validationIndex].errorMessage,
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    }
                  }
                }
              } else {
                return res.status(404).json({ message: "Response is missing for " + parameters[parameterIndex].code + "year :"+ distinctYears[yearIndex]});
              }
              // if (parameterIndex == parameters.length - 1) {
              //   return res.status(412).json({ message: "Condition Failed" });
              // }
            }
            
          }
        } else {
          return res.status(404).json({ message: "Parameters not found" });
        }
      } else if (validationRules[validationIndex].methodName.trim() == 'YES') {
        let parameter = validationRules[validationIndex].dependentCodes;
        let parameterDPResponse, previousYearResponse;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          if(parameter.length > 0){          
            for (let parameterIndex = 0; parameterIndex < parameter.length; parameterIndex++) {
              _.filter(mergedDetails, (object, index) => {
                if (object.companyId == taskDetailsObject.companyId.id, object.year == distinctYears[yearIndex], object.datapointId.id == parameter[parameterIndex].id) {
                  parameterDPResponse = object;
                } else if (object.companyId == taskDetailsObject.companyId.id, object.year == params.previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
                  previousYearResponse = object;
                }
              });
              let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
             
              if (parameterDPResponse) {
                if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
                  if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                    if (Number(currentResponse.response) > Number(calculatedResponse)) {
                      let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: true,
                      year: distinctYears[yearIndex],
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    } else {
                    let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: false,
                      year: distinctYears[yearIndex],                
                      errorMessage : validationRules[validationIndex].errorMessage,
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    }
                  } else {
                    let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
                    if (Number(currentResponse.response) < Number(calculatedResponse)) {
                      let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: true,
                      year: distinctYears[yearIndex],
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    } else {
                    let validationResponseObject = {
                      dpCodeId: validationRules[validationIndex].datapointId.id,
                      dpCode: validationRules[validationIndex].datapointId.code,
                      isValidResponse: false,
                      year: distinctYears[yearIndex],                
                      errorMessage : validationRules[validationIndex].errorMessage,
                      validationType: validationRules[validationIndex].validationType
                    }
                      validationResponse.push(validationResponseObject);
                    }
                  }
                } else {
                  return res.status(412).json({ message: "Condition Failed" });
                }
              } else {
                return res.status(404).json({ message: "Response is missing for " + parameter[parameterIndex].code + "year :"+ distinctYears[yearIndex]});
              }
              
            }
          }
          
        }
      } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR') {
        let parameters = validationRules[validationIndex].dependentCodes;
        let param1Value, param2Value, param3Value;
        let previousYearResponse;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          //let year;
          _.filter(mergedDetails, (object, index) => {
            if (object.companyId.id == taskDetailsObject.companyId.id, object.year == params.previousYear, object.datapointId.id == validationRules[validationIndex].datapointId.id) {
              previousYearResponse = object
            } else if (object.datapointId.id == parameters[0].id, object.year == distinctYears[yearIndex]) {
              param1Value = object.response ? object.response : ''
            } else if (object.datapointId.id == parameters[1].id, object.year == distinctYears[yearIndex]) {
              param2Value = object.response ? object.response : ''
            } else if (object.datapointId.id == parameters[2].id, object.year == distinctYears[yearIndex]) {
              param3Value = object.response ? object.response : ''
            }
          })
          let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && object.year == distinctYears[yearIndex]);
         
          //if ((param1Value.toLowerCase() == 'yes' && param2Value.toLowerCase() == 'yes') || param3Value.toLowerCase() == 'yes') {
            if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
            if (validationRules[validationIndex].checkCondition.trim() == 'greater') {
              let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
              if (Number(currentResponse.response) > Number(calculatedResponse)) {
                  let validationResponseObject = {
                  dpCodeId: validationRules[validationIndex].datapointId.id,
                  dpCode: validationRules[validationIndex].datapointId.code,
                  isValidResponse: true,
                  year: distinctYears[yearIndex],
                  validationType: validationRules[validationIndex].validationType
                }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            } else {
              let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
              if (Number(currentResponse.response) < Number(calculatedResponse)) {
                let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: true,
                year: distinctYears[yearIndex],
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            }
          } else {
            let validationResponseObject = {
              dpCodeId: validationRules[validationIndex].datapointId.id,
              dpCode: validationRules[validationIndex].datapointId.code,
              isValidResponse: false,
              year: distinctYears[yearIndex],                
              errorMessage : validationRules[validationIndex].errorMessage,
              validationType: validationRules[validationIndex].validationType
            }
            validationResponse.push(validationResponseObject);
          }
          
        }
      } else if (validationRules[validationIndex].methodName.trim() == 'ANDOR3') {
        let parameters = validationRules[validationIndex].dependentCodes;
        let param1Value, param2Value, param3Value, param4Value;
        let previousYearResponse;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
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
              let calculatedResponse = (Number(validationRules[validationIndex].percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
              if (Number(currentResponse.response) > Number(calculatedResponse)) {
            let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: true,
            year: distinctYears[yearIndex],
            validationType: validationRules[validationIndex].validationType
          }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            }
          } else {
            let validationResponseObject = {
              dpCodeId: validationRules[validationIndex].datapointId.id,
              dpCode: validationRules[validationIndex].datapointId.code,
              isValidResponse: false,
              year: distinctYears[yearIndex],                
              errorMessage : validationRules[validationIndex].errorMessage,
              validationType: validationRules[validationIndex].validationType
            }
            validationResponse.push(validationResponseObject);
          }
          
        }
      } else if(validationRules[validationIndex].methodName.trim() == 'ResponseCheck'){ 
        let dpResponse ;          
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {     
        _.filter(mergedDetails, (object, index) => {
          if (object.year == distinctYears[yearIndex], object.datapointId.id == validationRules[validationIndex].datapointId.id) {
            dpResponse = object;
          }
        });
        if(validationRules[validationIndex].checkResponse.includes(dpResponse.response)){
          let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: false,
            year: distinctYears[yearIndex],                
            errorMessage : validationRules[validationIndex].errorMessage,
            validationType: validationRules[validationIndex].validationType
          }
          validationResponse.push(validationResponseObject);
        } else {
          let validationResponseObject = {
          dpCodeId: validationRules[validationIndex].datapointId.id,
          dpCode: validationRules[validationIndex].datapointId.code,
          isValidResponse: true,
          year: distinctYears[yearIndex],
          validationType: validationRules[validationIndex].validationType
        }
          validationResponse.push(validationResponseObject);
        }
      }
      }  else if(validationRules[validationIndex].methodName.trim() == 'YesCondition'){
        let dpResponse, dependantCode;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          let parameters = validationRules[validationIndex].dependentCodes;
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
            let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: true,
            year: distinctYears[yearIndex],
            validationType: validationRules[validationIndex].validationType
          }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            } else {
              let validationResponseObject = {
              dpCodeId: validationRules[validationIndex].datapointId.id,
              dpCode: validationRules[validationIndex].datapointId.code,
              isValidResponse: true,
              year: distinctYears[yearIndex],
              validationType: validationRules[validationIndex].validationType
            }
              validationResponse.push(validationResponseObject);
            }
          }
    
        }
      }  else if(validationRules[validationIndex].methodName.trim() == 'ORYes'){
        let dpResponse, dependantCode,count = 0 ;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          let parameters = validationRules[validationIndex].dependentCodes;
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
            let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: true,
            year: distinctYears[yearIndex],
            validationType: validationRules[validationIndex].validationType
          }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            } else {
              let validationResponseObject = {
              dpCodeId: validationRules[validationIndex].datapointId.id,
              dpCode: validationRules[validationIndex].datapointId.code,
              isValidResponse: true,
              year: distinctYears[yearIndex],
              validationType: validationRules[validationIndex].validationType
            }
              validationResponse.push(validationResponseObject);
            }
          }
    
        }
      }  else if(validationRules[validationIndex].methodName.trim() == 'Rated'){
        let dpResponse, dependantCode;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          let parameters = validationRules[validationIndex].dependentCodes;
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
            let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: true,
            year: distinctYears[yearIndex],
            validationType: validationRules[validationIndex].validationType
          }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            } else {
              let validationResponseObject = {
              dpCodeId: validationRules[validationIndex].datapointId.id,
              dpCode: validationRules[validationIndex].datapointId.code,
              isValidResponse: true,
              year: distinctYears[yearIndex],
              validationType: validationRules[validationIndex].validationType
            }
              validationResponse.push(validationResponseObject);
            }
          }
    
        }
      }  else if(validationRules[validationIndex].methodName.trim() == 'ORRated'){
        let dpResponse, dependantCode,count = 0 ;
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          let parameters = validationRules[validationIndex].dependentCodes;
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
            let validationResponseObject = {
            dpCodeId: validationRules[validationIndex].datapointId.id,
            dpCode: validationRules[validationIndex].datapointId.code,
            isValidResponse: true,
            year: distinctYears[yearIndex],
            validationType: validationRules[validationIndex].validationType
          }
                validationResponse.push(validationResponseObject);
              } else {
              let validationResponseObject = {
                dpCodeId: validationRules[validationIndex].datapointId.id,
                dpCode: validationRules[validationIndex].datapointId.code,
                isValidResponse: false,
                year: distinctYears[yearIndex],                
                errorMessage : validationRules[validationIndex].errorMessage,
                validationType: validationRules[validationIndex].validationType
              }
                validationResponse.push(validationResponseObject);
              }
            } else {
              let validationResponseObject = {
              dpCodeId: validationRules[validationIndex].datapointId.id,
              dpCode: validationRules[validationIndex].datapointId.code,
              isValidResponse: true,
              year: distinctYears[yearIndex],
              validationType: validationRules[validationIndex].validationType
            }
              validationResponse.push(validationResponseObject);
            }
          }
    
        }
      }
    }
    } 
    //else if(validationRules[validationIndex].validationType == "7"){
  //  let zscoreValue ,performanceResult ;
  //  for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
  //   //let projectedValues = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && year == params.previousYear);
  //   let currentResponse = mergedDetails.find((object, index) => object.datapointId.id == validationRules[validationIndex].datapointId.id && object.companyId.id == taskDetailsObject.companyId.id && year == distinctYears[yearIndex]);
  //   let projectedValue = projectedValues.find(object => object.datapointId.id == percentileDataPointsList[pdpIndex].id && year == distinctYears[yearIndex]);
  //  if (validationRules[validationIndex].datapointId.polarity == 'Positive') {
  //    zscoreValue = (Number(currentResponse.response) - Number(projectedValue.average)) / Number(projectedValue.standardDeviation);
  //  } else {
  //    zscoreValue = (Number(currentResponse.average) - Number(projectedValue.response)) / Number(projectedValue.standardDeviation);
  //  }
  //  if (zscoreValue > 4) {
  //    performanceResult = 100
  //  } else if (zscoreValue < -4) {
  //    performanceResult = 0
  //  } else if (zscoreValue == 'NA') {
  //    performanceResult = 'NA'
  //  } else {
  //    //round of zscore value to two digit decimal value
  //    if (zscoreValue) {
  //      let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
  //      var lastDigit = twoDigitZscoreValue.toString().slice(-1);
  //      let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
  //      let zValues = ztableValue.values[0].split(",");
  //      let zScore = zValues[Number(lastDigit)]
  //      performanceResult = zScore * 100;
  //    } else {
  //      performanceResult = 'NA'
  //    }
  //  }
  //  if(performanceResult == 'NA'){
  //   validationResponseObject.dpCode = validationRules[validationIndex].datapointId.code
  //   validationResponseObject.dpCodeId = validationRules[validationIndex].datapointId.id
  //   validationResponseObject.isValidResponse = false
  //   validationResponseObject.validationType = validationRules[validationIndex].validationType
  //   validationResponseObject.errorMessage = "Percentile value is NA"
  //   validationResponse.push(validationResponseObject);
  //  } else {
  //    if (Number(performanceResult) < Number(validationRules[validationIndex].percentileThresholdValue.replace('%', ''))){
  //     validationResponseObject.dpCode = validationRules[validationIndex].datapointId.code
  //     validationResponseObject.dpCodeId = validationRules[validationIndex].datapointId.id
  //     validationResponseObject.isValidResponse = true
  //     validationResponseObject.validationType = validationRules[validationIndex].validationType
  //     validationResponse.push(validationResponseObject);
  //    } else {
  //     validationResponseObject.dpCode = validationRules[validationIndex].datapointId.code
  //     validationResponseObject.dpCodeId = validationRules[validationIndex].datapointId.id
  //     validationResponseObject.isValidResponse = false
  //     validationResponseObject.validationType = validationRules[validationIndex].validationType
  //     validationResponseObject.errorMessage = validationRules[validationIndex].errorMessage
  //     validationResponse.push(validationResponseObject);
  //    }
  //  }
     
  //  }
  //   }
    
  if (validationIndex == validationRules.length - 1) {
    return res.status(200).json({ message: "Valid Response", Response: validationResponse });

  }
  }

}