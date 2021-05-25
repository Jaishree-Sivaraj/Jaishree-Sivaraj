import _ from 'lodash'
import moment from 'moment'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { DerivedDatapoints } from '.'
import { Rules } from '../rules'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'

export const create = ({ user, bodymen: { body } }, res, next) =>
  DerivedDatapoints.create({ ...body, createdBy: user })
    .then((derivedDatapoints) => derivedDatapoints.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  DerivedDatapoints.count(query)
    .then(count => DerivedDatapoints.find(query, select, cursor)
      .populate('createdBy')
      .populate('companyId')
      .populate('datapointId')
      .then((derivedDatapoints) => ({
        count,
        rows: derivedDatapoints.map((derivedDatapoints) => derivedDatapoints.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  DerivedDatapoints.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('datapointId')
    .then(notFound(res))
    .then((derivedDatapoints) => derivedDatapoints ? derivedDatapoints.view() : null)
    .then(success(res))
    .catch(next)

export const calculateForACompany = async({ user, params }, res, next) => {
  const userDetail = user;
  const companyId = params.companyId ? params.companyId : null;

  await StandaloneDatapoints.find({ companyId: companyId })
  .populate('createdBy')
  .populate('datapointId')
  .populate('companyId')
  .populate('taskId')
  .then(async(companySADPDetails) => {
    //get distrinc year from companySADPDetails
    let distinctYears = _.uniq(_.map(companySADPDetails, 'year'));
    if(distinctYears.length > 0){
      let allStandaloneDetails = [];
      let allBoardMemberMatrixDetails = [];
      let allKmpMatrixDetails = [];
      let allDerivedDatapoints = [];

      let allDatapointsList = await Datapoints.find({ status: true }).populate('updatedBy').populate('keyIssueId').populate('functionId');
      for (let index = 0; index < distinctYears.length; index++) {
        allStandaloneDetails = await StandaloneDatapoints.find({ 
          companyId: companyId,
          year: distinctYears[index],
          status: true
        })
        .populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId')
        
        allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({ 
          companyId: companyId,
          year: distinctYears[index],
          memberStatus: true,
          status: true
        })
        .populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        
        allKmpMatrixDetails = await KmpMatrixDataPoints.find({ 
          companyId: companyId,
          year: distinctYears[index],
          memberStatus: true,
          status: true
        })
        .populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
      }
      let mergedDetails = _.concat(allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails);
      // let distinctRuleMethods = await Rules.distinct('methodName').populate('datapointId');
      let distinctRuleMethods = [ "MatrixPercentage", "Minus", "Sum", "count of", "Ratio", "Percentage", "YesNo", "RatioADD", "As", "ADD", "AsPercentage", "AsRatio", "Condition", "Multiply" ];
      //Process all rules
      for (let ruleIndex = 0; ruleIndex < distinctRuleMethods.length; ruleIndex++) {
        switch (distinctRuleMethods[ruleIndex]) {
          case "ADD":
            await addCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                console.log('result');
              }
            })
            break;
          case "As":
            await asCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "AsPercentage":
            await asPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                console.log('result');
              }
            })
            break;
          case "AsRatio":
            await asRatioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                console.log('AsRatio result');
              }
            })
            break;
          case "Condition":
            await conditionCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "MatrixPercentage":
            await matrixPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "Minus":
            await minusCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "Multiply":
            await multiplyCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "Percentage":
            await percentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "Ratio":
            await ratioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "RatioADD":
            await ratioAddCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "Sum":
            await sumCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "YesNo":
            await yesNoCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
          case "count of":
            await countOfCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
            .then((result) => {
              if(result){
                if(result.allDerivedDatapoints){
                  allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                }
              }
            })
            break;
        
          default:
            break;
        }
        if (ruleIndex == distinctRuleMethods.length-1) {
          await DerivedDatapoints.updateMany({
            "companyId": companyId,
            "year": { $in: distinctYears }
          }, { $set: { status: false } }, {});

          await DerivedDatapoints.insertMany(allDerivedDatapoints)
          .then((err, result) => {
            if (err) {
              console.log('error', err);
            } else {
              //  console.log('result', result);
              return res.status(200).json({message: "Calculation completed successfuly!", derivedDatapoints: allDerivedDatapoints });
            }
          });
        }
      }
      return res.status(200).json({ message: "Retrieved successfully!", allDerivedDatapoints: allDerivedDatapoints })
    } else {
      return res.status(500).json({ message: "No year wise data present for this company!" })
    }
  })
}

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  DerivedDatapoints.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((derivedDatapoints) => derivedDatapoints ? Object.assign(derivedDatapoints, body).save() : null)
    .then((derivedDatapoints) => derivedDatapoints ? derivedDatapoints.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  DerivedDatapoints.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((derivedDatapoints) => derivedDatapoints ? derivedDatapoints.remove() : null)
    .then(success(res, 204))
    .catch(next)

async function matrixPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  let matrixPercentageRules = await Rules.find({ methodName: "MatrixPercentage" }).populate('datapointId');
  for (let i = 0; i < matrixPercentageRules.length; i++) {
    if(matrixPercentageRules[i].methodType != "" || matrixPercentageRules[i].methodType == "composite"){
      let parameters = matrixPercentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = [];
      let denominatorValues = [];
      _.filter(mergedDetails, (object, index) => {
        for (let i = 0; i < distinctYears.length; i++) {
          const year = distinctYears[i];
          if(object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year){
            numeratorValues.push(object)
          } else if(object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year){
            denominatorValues.push(object)
          }
        }
      });
      if(numeratorValues.length > 0 && denominatorValues.length > 0 && numeratorValues.length == denominatorValues.length){
        for (let j = 0; j < numeratorValues.length; j++) {
          let numeratorResponseValue = parseInt(numeratorValues[j].response ? [ isNaN(numeratorValues[j].response) ? '0' : numeratorValues[j].response.replace(',', '') ] : '0');
          let denominatorResponseValue = parseInt(denominatorValues[j].response ? [ isNaN(denominatorValues[j].response) ? '0' : denominatorValues[j].response.replace(',', '') ] : '0');
          let derivedResponse = (numeratorResponseValue/denominatorResponseValue)*100;
          let derivedDatapointsObject = {
            companyId: numeratorValues[j].companyId.id,
            datapointId: matrixPercentageRules[i].datapointId.id,
            year: numeratorValues[j].year,
            response: derivedResponse,
            memberName: numeratorValues[j].memberName ? numeratorValues[j].memberName.replace('\r\n', '') : '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    } else{
      let parameters = matrixPercentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = [];
      let denominatorValues = [];
      _.filter(mergedDetails, (object, index) => {
        for (let i = 0; i < distinctYears.length; i++) {
          const year = distinctYears[i];
          if(object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year){
            numeratorValues.push(object)
          } else if(object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year){
            denominatorValues.push(object)
          }
        }
      });
      if(numeratorValues.length > 0 && denominatorValues.length > 0){
        for (let j = 0; j < numeratorValues.length; j++) {
          let numeratorResponseValue = parseInt(numeratorValues[j].response ? [ isNaN(numeratorValues[j].response) ? '0' : numeratorValues[j].response.replace(',', '') ] : '0');
          let denominatorResponseValue = parseInt(denominatorValues[0].response ? [ isNaN(denominatorValues[0].response) ? '0' : denominatorValues[0].response.replace(',', '') ] : '0');
          let derivedResponse = (numeratorResponseValue/denominatorResponseValue)*100;
          let derivedDatapointsObject = {
            companyId: numeratorValues[j].companyId.id,
            datapointId: matrixPercentageRules[i].datapointId.id,
            year: numeratorValues[j].year,
            response: derivedResponse,
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }
    if(i == matrixPercentageRules.length-1){
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function addCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let addRules = await Rules.find({ methodName: "ADD" }).populate('datapointId');
  console.log('add Calculation');
  for (let i = 0; i < addRules.length; i++) {
    let parameters = addRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    let derivedResponse;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = addRules[i].datapointId.id;
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          if (numeratorValue.response == 0) {
            derivedResponse = 0;
          } else if (numeratorValue.response == '' || numeratorValue.response == ' ' || numeratorValue.response == 'NA') {
            derivedResponse = 'NA';
          } else if (denominatorValue.response == 0 || denominatorValue.response == '' || denominatorValue.response == ' ' || denominatorValue.response == 'NA') {
            derivedResponse = 'NA';
          } else {
            derivedResponse = parseInt(numeratorValue.response)+parseInt(denominatorValue.response);
          }
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: derivedResponse } });
        }
      }
    }
    if (i == addRules.length-1) {
      return true;
    }
  }
}

async function asCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let asRules = await Rules.find({ methodName: "As" }).populate('datapointId');
  console.log('as Calculation');
  for (let i = 0; i < asRules.length; i++) {
    let parameters = asRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: numeratorValue.response } });
        } else {
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: ruleResponseObject.response } });
        }
      }
    }
    if (i == asRules.length-1) {
      return true;
    }
  }
}

async function asPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let asPercentageRules = await Rules.find({ methodName: "AsPercentage" }).populate('datapointId');
  console.log('asPercentage Calculation');
  for (let i = 0; i < asPercentageRules.length; i++) {
    let parameters = asPercentageRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    let derivedResponse;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asPercentageRules[i].datapointId.id;
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          if (numeratorValue.response == 0) {
            derivedResponse = 0;
          } else if (numeratorValue.response == '' || numeratorValue.response == ' ' || numeratorValue.response == 'NA') {
            derivedResponse = 'NA';
          } else if (denominatorValue.response == 0 || denominatorValue.response == '' || denominatorValue.response == ' ' || denominatorValue.response == 'NA') {
            derivedResponse = 'NA';
          } else {
            derivedResponse = (parseInt(numeratorValue.response)/parseInt(denominatorValue.response))*100;
          }
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: derivedResponse } });
        }
      }
    }
    if (i == asPercentageRules.length-1) {
      return true;
    }
  }
}

async function asRatioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let asRatioRules = await Rules.find({ methodName: "AsRatio" }).populate('datapointId');
  console.log('asRatio Calculation');
  for (let i = 0; i < asRatioRules.length; i++) {
    let parameters = asRatioRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    let derivedResponse;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asRatioRules[i].datapointId.id;
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          if (numeratorValue.response == 0) {
            derivedResponse = 0;
          } else if (numeratorValue.response == '' || numeratorValue.response == ' ' || numeratorValue.response == 'NA') {
            derivedResponse = 'NA';
          } else if (denominatorValue.response == 0 || denominatorValue.response == '' || denominatorValue.response == ' ' || denominatorValue.response == 'NA') {
            derivedResponse = 'NA';
          } else {
            derivedResponse = parseInt(numeratorValue.response)/parseInt(denominatorValue.response)
          }
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: derivedResponse } });
        }
      }
    }
    if (i == asRatioRules.length-1) {
      return true;
    }
  }
}

async function conditionCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let asConditionRules = await Rules.find({ methodName: "Condition" }).populate('datapointId');
  console.log('condition Calculation');
  for (let i = 0; i < asConditionRules.length; i++) {
    let parameter = asConditionRules[i].parameter;
    let parameterDpObject = _.filter(allDatapointsList, { code: parameter });
    let parameterDpId = parameterDpObject[0] ? parameterDpObject[0].id : '';
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asConditionRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: parameterDpId, year: year });
          
          if (Number(numeratorValue.response) >= 50) {
            await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: 'Y' } });
          } else {
            await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: ruleResponseObject.response } }).exec();
          }

          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: numeratorValue.response } });
        } else {
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: ruleResponseObject.response } });
        }
      }
    }
    if (i == asConditionRules.length-1) {
      return true;
    }
  }
}

async function minusCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  console.log('minus Calculation');
  let minusRules = await Rules.find({ methodName: "Minus" }).populate('datapointId');  
  for (let i = 0; i < minusRules.length; i++) {
    let parameters = minusRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    let numeratorValues = [];
    let denominatorValues = [];
    let derivedResponse;
    _.filter(mergedDetails, (object, index) => {
      for (let i = 0; i < distinctYears.length; i++) {
        const year = distinctYears[i];
        if(object.memberStatus == true){
          if(object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year){
            numeratorValues.push(object);
          } else if(object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year){
            denominatorValues.push(object);
          }
        }
      }
    })
    if(numeratorValues.length > 0 && denominatorValues.length > 0 && numeratorValues.length == denominatorValues.length){
      for (let j = 0; j < numeratorValues.length; j++) {
        let derivedResponse;
        if(denominatorValues[j].response == ' ' || denominatorValues[j].response == '' || denominatorValues[j].response == 'NA'){
          derivedResponse = 'NA';
        } else {
          let numeratorConvertedDate;
          let denominatorConvertedDate;
          try {
            numeratorConvertedDate = getJsDateFromExcel(numeratorValues[j].fiscalYearEndDate);            
            denominatorConvertedDate = getJsDateFromExcel(denominatorValues[j].response);
          } catch (error) {
            let companyDetail = await Companies.findOne({ _id: companyId}).distinct('companyName');
            return res.status(500).json({ message: `Found invalid date format in ${companyDetail ? companyDetail : 'a company'}, please correct and try again!` })
          }
          derivedResponse = moment([numeratorConvertedDate.getUTCFullYear(), numeratorConvertedDate.getUTCMonth(), numeratorConvertedDate.getUTCDate()])
          .diff(moment([denominatorConvertedDate.getUTCFullYear(), denominatorConvertedDate.getUTCMonth(), denominatorConvertedDate.getUTCDate()]), 'years', true)
        }
        let derivedDatapointsObject = {
          companyId: numeratorValues[j].companyId.id,
          datapointId: minusRules[i].datapointId.id,
          year: numeratorValues[j].year,
          response: derivedResponse,
          memberName: '',
          memberStatus: true,
          status: true,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }
    }
    if(i == minusRules.length-1){
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function multiplyCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let asMultiplyRules = await Rules.find({ methodName: "Multiply" }).populate('datapointId');
  console.log('multiply Calculation');
  for (let i = 0; i < asMultiplyRules.length; i++) {
    let parameters = asMultiplyRules[i].parameter.split(",");;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asMultiplyRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let firstParameterDpObject = _.filter(allDatapointsList, { code: parameters[0] });
          let firstParameterDpId = firstParameterDpObject[0] ? firstParameterDpObject[0].id : '';
          let secondParameterDpObject = _.filter(allDatapointsList, { code: parameters[1] });
          let secondParameterDpId = secondParameterDpObject[0] ? secondParameterDpObject[0].id : '';
          let thirdParameterDpObject = _.filter(allDatapointsList, { code: parameters[2] });
          let thirdParameterDpId = thirdParameterDpObject[0] ? thirdParameterDpObject[0].id : '';

          let firstParameterValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: firstParameterDpId, year: year });
          let secondParameterValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: secondParameterDpId, year: year });
          let multipliedResponse;
          //multiply aidDPLogic
          if (firstParameterValue.response === " " || secondParameterValue.response == 0 || secondParameterValue.response === " ") {
            multipliedResponse = 'NA';
          } else if (firstParameterValue.response == 0) {
            multipliedResponse = 0;
          } else {
            let numerator, denominator;
            if (isNaN(firstParameterValue.response)) {
              numerator = Number(firstParameterValue.response.replace(/,/g, '').trim());
            } else {
              numerator = Number(firstParameterValue.response);
            }
            if (isNaN(secondParameterValue.response)) {
              denominator = Number(secondParameterValue.response.replace(/,/g, '').trim());
            } else {
              denominator = Number(secondParameterValue.response);
            }
            multipliedResponse = (numerator / denominator) * 2000 * 1000000;
          }
          if (asMultiplyRules[i].methodType == "composite") {
            if (multipliedResponse == 'NA') {
              let thirdParameterValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: thirdParameterDpId, year: year });
              await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: thirdParameterValue.response } });
            } else {
              await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: multipliedResponse } });
            }
          } else {
            await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: multipliedResponse } });
          }

        }
      }
    }
    if (i == asMultiplyRules.length-1) {
      return true;
    }
  }
}

async function percentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  console.log('percentage Calculation');
  let allDerivedDatapoints = [];
  let percentageRules = await Rules.find({ methodName: "Percentage" }).populate('datapointId');
  
  for (let i = 0; i < percentageRules.length; i++) {
    if(percentageRules[i].methodType == "sum,sum"){
      let parameters = percentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = [];
      let denominatorValues = [];
      let numeratorSum = 0;
      let denominatorSum = 0;
      let derivedResponse;
      _.filter(mergedDetails, (object, index) => {
        for (let i = 0; i < distinctYears.length; i++) {
          const year = distinctYears[i];
          if(object.memberStatus == true){
            if(object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year){
              if(object.response == 'NA' || object.response == '' || object.response == " "){
                numeratorSum += 0;
              } else {
                numeratorSum += isNaN(object.response) ? 0 : parseInt(object.response.replace(',', ''));
              }
            } else if(object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year){
              if(object.response == 'NA' || object.response == '' || object.response == " "){
                denominatorSum += 0;
              } else {
                denominatorSum += isNaN(object.response) ? 0 : parseInt(object.response.replace(',', ''));
              }
            }
          }
          derivedResponse = isNaN((numeratorSum/denominatorSum)*100) ? 0 : (numeratorSum/denominatorSum)*100;
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: object.datapointId.id,
            year: object.year,
            response: derivedResponse,
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      });
    } else{
      let parameters = percentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = [];
      let denominatorValues = [];
      _.filter(mergedDetails, (object, index) => {
        for (let i = 0; i < distinctYears.length; i++) {
          const year = distinctYears[i];
          if(object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year){
            numeratorValues.push(object)
          } else if(object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year){
            denominatorValues.push(object)
          }
        }
      });
      if(numeratorValues.length > 0 && denominatorValues.length > 0 && numeratorValues.length == denominatorValues.length){
        for (let j = 0; j < numeratorValues.length; j++) {
          let derivedResponse;

          if(numeratorValues[j].response == ' ' || numeratorValues[j] == '' || numeratorValues[j] == 'NA'){
            derivedResponse = 'NA';
          } else if(numeratorValues[j] == '0' || numeratorValues[j] == 0){
            derivedResponse = '0';
          } else {
            if(denominatorValues[j].response == ' ' || denominatorValues[j] == '' || denominatorValues[j] == 'NA' || denominatorValues[j] == '0'){
              derivedResponse = 'NA';
            } else {
              derivedResponse = (parseInt(numeratorValues[j].replace(',', ''))/parseInt(denominatorValues[j].replace(',', '')))*100;
            }
          }
          let derivedDatapointsObject = {
            companyId: numeratorValues[j].companyId.id,
            datapointId: percentageRules[i].datapointId.id,
            year: numeratorValues[j].year,
            response: derivedResponse,
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }
    if(i == percentageRules.length-1){
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function ratioAddCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  let ratioAddRules = await Rules.find({ methodName: "RatioADD" }).populate('datapointId');
  console.log('ratio add Calculation');
  for (let i = 0; i < ratioAddRules.length; i++) {
    let parameters = ratioAddRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = ratioAddRules[i].datapointId.id;
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      let addResponse, percentResponse;
      if (numeratorValue.response === " " || denominatorValue.response === " ") {
        addResponse = 'NA';
      } else {
        addResponse = Number(numeratorValue.response.replace(/,/g, '').trim()) + Number(denominatorValue.response.replace(/,/g, '').trim());
        //  = await percent(numeratorValue.response, addResponse);
        if (numeratorValue.response === " " || numeratorValue.response == 'NA') {
          percentResponse = 'NA';
        } else if (numeratorValue.response == 0) {
          resolve(0)
        } else if (percentResponse == 0 || percentResponse == 'NA') {
          percentResponse = "NA";
        } else {
          let numeratorNumber;          
          if (isNaN(numeratorValue.response)) {
            numeratorNumber = Number(numeratorValue.response.replace(/,/g, '').trim());
          } else {
            numeratorNumber = Number(numeratorValue.response);
          }
          percentResponse = (numeratorNumber / addResponse) * 100;
        }
      }
      let derivedDatapointsObject = {
        companyId: companyId,
        datapointId: ruleDatapointId,
        year: year,
        response: percentResponse,
        memberName: '',
        memberStatus: true,
        status: true,
        createdBy: userDetail
      }
      allDerivedDatapoints.push(derivedDatapointsObject);
    }
    if (i == ratioAddRules.length-1) {
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function sumCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  let sumRules = await Rules.find({ methodName: "Sum" }).populate('datapointId');
  console.log('sum Calculation');
  for (let i = 0; i < sumRules.length; i++) {
    let parameters = sumRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    let derivedResponse;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let sumValue;
      let ruleDatapointId = sumRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.find({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      let activeMembers = _.filter(mergedDetails, {datapointId: numeratorDpObject[0], year: year, memberStatus: true});
      if (activeMembers.length > 0) {
        sumValue = activeMembers.reduce(function (prev, next) {
          return {
            response: Number(prev.response.replace(/,/g, '').trim()) + Number(next.response.replace(/,/g, '').trim()),
          };
        });
      } else {
        sumValue = 0;
      }
      let derivedDatapointsObject = {
        companyId: companyId,
        datapointId: ruleDatapointId,
        year: year,
        response: sumValue,
        memberName: '',
        memberStatus: true,
        status: true,
        createdBy: userDetail
      }
      allDerivedDatapoints.push(derivedDatapointsObject);
    }
    if (i == sumRules.length-1) {
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function yesNoCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  let yesNoRules = await Rules.find({ methodName: "YesNo" }).populate('datapointId');
  console.log('yes no Calculation');
  for (let i = 0; i < yesNoRules.length; i++) {
    let parameters = yesNoRules[i].parameter.split(",");
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let sumValue;
      let ruleDatapointId = yesNoRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      
      let count = 0;
      for (let k = 0; k < parameters.length; k++) {
        let parameterDpObject = _.filter(allDatapointsList, { code: parameters[k] });
        let parameterDpId = parameterDpObject[0] ? parameterDpObject[0].id : '';
          let dpResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: parameterDpId, year: year });
          if (dpResponse.response.trim() == 'Yes' || dpResponse.response == 'Y') {
              count++;
          }
      }
      if (count > 0) {
        let derivedDatapointsObject = {
          companyId: companyId,
          datapointId: ruleDatapointId,
          year: year,
          response: 'Yes',
          memberName: '',
          memberStatus: true,
          status: true,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      } else {
        let derivedDatapointsObject = {
          companyId: companyId,
          datapointId: ruleDatapointId,
          year: year,
          response: 'No',
          memberName: '',
          memberStatus: true,
          status: true,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }
    }
    if (i == yesNoRules.length-1) {
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function countOfCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  let countOfRules = await Rules.find({ methodName: "count of" }).populate('datapointId');
  console.log('count of Calculation');
  for (let i = 0; i < countOfRules.length; i++) {
    let parameters = countOfRules[i].parameter.split(",");
    let numerator = parameters[0] ? parameters[0] : '';
    let denominator = parameters[1] ? parameters[1] : '';
    let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
    let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
    let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
    let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
    let derivedResponse;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let sumValue;
      let ruleDatapointId = countOfRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
      if (countOfRules[i].methodType == 'composite') {
        let total = 0;
        if (parameters.length == 2) {
          let numeratorList = _.filter(mergedDetails, { datapointId: numeratorDpObject[0], year: distinctYears[j], memberStatus: true })
          let denominatorList = _.filter(mergedDetails, { datapointId: denominatorDpObject[0], year: distinctYears[j], memberStatus: true })
          if (numeratorList.length > 0 && denominatorList.length > 0) {
            let count = 0;
            numeratorList = numeratorList.filter(e => String(e.response).trim());
            denominatorList = denominatorList.filter(e => String(e.response).trim());
            if (countOfRules[i].criteria == 'Y') {
              for (let ix = 0; ix < denominatorList.length; ix++) {
                for (let jx = 0; jx < numeratorList.length; jx++) {
                  if (denominatorList[ix].dirName == numeratorList[jx].dirName) {
                    if (denominatorList[ix].value == 'Yes' && numeratorList[jx].value == 'Yes') {
                      count++;
                    }
                  }
                }
              }
            }
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: ruleDatapointId,
              year: year,
              response: count,
              memberName: '',
              memberStatus: true,
              status: true,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        } else {
          for (let kx = 0; kx < parameters.length; kx++) {
            let parameterDatapointObject = await Datapoints.findOne({code: parameters[kx].trim()});
            await StandaloneDatapoints.findOne({ companyId: companyId, year: distinctYears[j], datapointId: parameterDatapointObject.id }).populate('updatedBy').populate('keyIssueId').populate('functionId')
            .then((resp) => {
              if (resp) {
                if (resp.response == 'Yes' || resp.response == 'Y') {
                    total++;
                } else {
                    total;
                }                
              }
            })
          }
            
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: ruleDatapointId,
            year: year,
            response: total,
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      } else {
        let values = _.filter(mergedDetails, { year: distinctYears[j], datapointId: numeratorDpObject, memberStatus: true });
        if (values.length > 0) {
          // let countValue = await count(arr, ruleValue.criteria)
          let finalResponse;
          
          values = values.filter(e => String(e).trim());
          values = values.filter(e => e != 'NA')
          if (countOfRules[i].criteria == '2') {
            if (values.length > 0) {
              finalResponse = values.filter(item => item >= countOfRules[i].criteria).length;
            } else {
              finalResponse = 'NA';
            }
          } else if (countOfRules[i].criteria == 'D') {
            if (values.length > 0) {
              finalResponse = values.length;
            } else {
              finalResponse = 'NA';
            }
          } else if (countOfRules[i].criteria == 'Y') {
            if (values.length > 0) {
              if (values.includes('Yes')) {
                finalResponse = values.filter(item => item == 'Yes').length;
              } else {
                finalResponse = values.filter(item => item == 'Y').length;
              }
            } else {
              finalResponse = 'NA';
            }
          } else {
            if (values.length > 0) {
              finalResponse = values.filter(item => item == countOfRules[i].criteria).length;
            } else {
              finalResponse = 'NA';
            }
          }
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: ruleDatapointId,
            year: year,
            response: finalResponse,
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        } else {
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: ruleDatapointId,
            year: year,
            response: 'NA',
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }
    if (i == countOfRules.length-1) {
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function ratioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail){
  let allDerivedDatapoints = [];
  let priorityDatapoints = ['MACR002', 'MACR007', 'MACR010'];
  let priorityDatapointObjects = await Datapoints.find({ code: { $in: priorityDatapoints } }).populate('updatedBy').populate('keyIssueId').populate('functionId');
  if (priorityDatapointObjects.length > 0) {
    for (let index = 0; index < priorityDatapointObjects.length; index++) {
      let ratioRules = await Rules.find({ datapointId: priorityDatapointObjects[index].id ? priorityDatapointObjects[index].id : null });
      for (let i = 0; i < ratioRules.length; i++) {
        let parameters = ratioRules[i].parameter.split(",");
        let numerator = parameters[0] ? parameters[0] : '';
        let denominator = parameters[1] ? parameters[1] : '';
        let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
        let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
        let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
        let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
        for (let j = 0; j < distinctYears.length; j++) {
          const year = distinctYears[j];
          let ruleDatapointId = ratioRules[i].datapointId.id;
          let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
          if (ratioRules[i].methodType == "IF") {
            let activeMemberValues = _.filter(mergedDetails, { year: year, datapointId: numeratorDpObject, memberStatus: true });
            let sumValue;
            if (activeMemberValues.length > 0) {
              activeMemberValues = activeMemberValues.filter(e => String(e.response).trim());
              activeMemberValues = activeMemberValues.filter(e => e.response != "NA");
              sumValue = activeMemberValues.reduce(function (prev, next) {
                return {
                  response: Number(prev.response.replace(/,/g, '').trim()) + Number(next.response.replace(/,/g, '').trim()),
                };
              });
              let percentValue = 0.5 * Number(denominatorDpObject.response);
              if (isNaN(activeMemberValues.length) || denominatorDpObject.response == " ") {
                let derivedDatapointsObject = {
                  companyId: companyId,
                  datapointId: ruleDatapointId,
                  year: year,
                  response: 'NA',
                  memberName: '',
                  memberStatus: true,
                  status: true,
                  createdBy: userDetail
                }
                allDerivedDatapoints.push(derivedDatapointsObject);
              } else if(activeMemberValues.length < percentValue) {
                
                let derivedDatapointsObject = {
                  companyId: companyId,
                  datapointId: ruleDatapointId,
                  year: year,
                  response: 'NA',
                  memberName: '',
                  memberStatus: true,
                  status: true,
                  createdBy: userDetail
                }
                allDerivedDatapoints.push(derivedDatapointsObject);
              } else {
                let derivedResponse;
                if (sumValue === " " || sumValue == 'Y' || sumValue == 'NA') {
                  derivedResponse = 'NA';
                } else if (sumValue == 0) {
                  derivedResponse = 0;
                } else if (activeMemberValues.length == 0 || activeMemberValues.length === " " || activeMemberValues.length == 'NA') {
                  derivedResponse = 'NA';
                } else {
                  derivedResponse = Number(sumValue.replace(/,/g, '').trim()) / activeMemberValues.length;
                }
                
                let derivedDatapointsObject = {
                  companyId: companyId,
                  datapointId: ruleDatapointId,
                  year: year,
                  response: derivedResponse,
                  memberName: '',
                  memberStatus: true,
                  status: true,
                  createdBy: userDetail
                }
                allDerivedDatapoints.push(derivedDatapointsObject);
              }
            } else {
              sumValue = 0;
            }
          } else {
            let numeratorResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
            let denominatorResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year });
            let derivedResponse;
            if (numeratorResponse && denominatorResponse) {
              if (numeratorResponse.response == 0) {
                derivedResponse = 0;
              } else if (numeratorResponse.response == '' || numeratorResponse.response == ' ' || numeratorResponse.response == 'NA') {
                derivedResponse = 'NA';
              } else if (denominatorResponse.response == 0 || denominatorResponse.response == '' || denominatorResponse.response == ' ' || denominatorResponse.response == 'NA') {
                derivedResponse = 'NA';
              } else {
                // derivedResponse = parseInt(numeratorResponse.response)/parseInt(denominatorResponse.response)
                derivedResponse = Number(numeratorResponse.response)/Number(denominatorResponse.response);
                console.log('derivedResponse', derivedResponse);
              }
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: derivedResponse,
                memberName: '',
                memberStatus: true,
                status: true,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);          
            }
          }
        }
      }
    }
  }
  let ratioRules = await Rules.find({ methodName: "Ratio" }).populate('datapointId');
  console.log('ratio Calculation');
  if (ratioRules.length > 0) {
    for (let i = 0; i < ratioRules.length; i++) {
      let parameters = ratioRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = ratioRules[i].datapointId.id;
        let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year });
        if (ratioRules[i].methodType == "IF") {
          let activeMemberValues = _.filter(mergedDetails, { year: year, datapointId: numeratorDpObject, memberStatus: true });
          let sumValue;
          if (activeMemberValues.length > 0) {
            activeMemberValues = activeMemberValues.filter(e => String(e.response).trim());
            activeMemberValues = activeMemberValues.filter(e => e.response != "NA");
            sumValue = activeMemberValues.reduce(function (prev, next) {
              return {
                response: Number(prev.response.replace(/,/g, '').trim()) + Number(next.response.replace(/,/g, '').trim()),
              };
            });
            let percentValue = 0.5 * Number(denominatorDpObject.response);
            if (isNaN(activeMemberValues.length) || denominatorDpObject.response == " ") {
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: 'NA',
                memberName: '',
                memberStatus: true,
                status: true,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            } else if(activeMemberValues.length < percentValue) {
              
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: 'NA',
                memberName: '',
                memberStatus: true,
                status: true,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            } else {
              let derivedResponse;
              if (sumValue === " " || sumValue == 'Y' || sumValue == 'NA') {
                derivedResponse = 'NA';
              } else if (sumValue == 0) {
                derivedResponse = 0;
              } else if (activeMemberValues.length == 0 || activeMemberValues.length === " " || activeMemberValues.length == 'NA') {
                derivedResponse = 'NA';
              } else {
                derivedResponse = Number(sumValue.replace(/,/g, '').trim()) / activeMemberValues.length;
              }
              
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: derivedResponse,
                memberName: '',
                memberStatus: true,
                status: true,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            }
          } else {
            sumValue = 0;
          }
        } else {
          let numeratorResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year });
          let denominatorResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year });
          let derivedResponse;
          if (numeratorResponse && denominatorResponse) {
            if (numeratorResponse.response == 0) {
              derivedResponse = 0;
            } else if (numeratorResponse.response == '' || numeratorResponse.response == ' ' || numeratorResponse.response == 'NA') {
              derivedResponse = 'NA';
            } else if (denominatorResponse.response == 0 || denominatorResponse.response == '' || denominatorResponse.response == ' ' || denominatorResponse.response == 'NA') {
              derivedResponse = 'NA';
            } else {
              // derivedResponse = parseInt(numeratorResponse.response)/parseInt(denominatorResponse.response)
              derivedResponse = Number(numeratorResponse.response)/Number(denominatorResponse.response);
              console.log('derivedResponse', derivedResponse);
            }
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: ruleDatapointId,
              year: year,
              response: derivedResponse,
              memberName: '',
              memberStatus: true,
              status: true,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);          
          }
        }
      }
      console.log("iteration=", i, "length-1=", ratioRules.length-1);
      if (i == ratioRules.length-1) {
        console.log('allDerivedDatapoints', allDerivedDatapoints);
        return { allDerivedDatapoints: allDerivedDatapoints };
      }
    }    
  }
}