import { Rules } from "../rules";
import _, { add } from 'lodash';
import moment from 'moment'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { Companies } from '../companies'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
// import { companiesAndAnalyst } from "../controversy_tasks/controller";
import { BoardMembers } from "../boardMembers";

export const multiplyCalculation = async function (taskId, companyId, distinctYears, allDatapointsList,categoryId, userDetail) {
    //let multiplyT1 = performance.now();
    let asMultiplyRules = await Rules.find({
      methodName: "Multiply", categoryId: categoryId
    }).populate('datapointId');
    console.log('multiply Calculation');
    for (let i = 0; i < asMultiplyRules.length; i++) {
      let parameters = asMultiplyRules[i].parameter.split(",");;
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = asMultiplyRules[i].datapointId.id;
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        if (ruleResponseObject) {
          if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
            //perform calc
            let firstParameterDpObject = _.filter(allDatapointsList, {
              code: parameters[0]
            });
            let firstParameterDpId = firstParameterDpObject[0] ? firstParameterDpObject[0].id : '';
            let secondParameterDpObject = _.filter(allDatapointsList, {
              code: parameters[1]
            });
            let secondParameterDpId = secondParameterDpObject[0] ? secondParameterDpObject[0].id : '';
            let thirdParameterDpObject = _.filter(allDatapointsList, {
              code: parameters[2]
            });
            let thirdParameterDpId = thirdParameterDpObject[0] ? thirdParameterDpObject[0].id : '';
  
            let firstParameterValue = await StandaloneDatapoints.findOne({
              companyId: companyId,
              datapointId: firstParameterDpId,
              year: year,
              isActive: true,
              status: true
            });
            let secondParameterValue = await StandaloneDatapoints.findOne({
              companyId: companyId,
              datapointId: secondParameterDpId,
              year: year,
              isActive: true,
              status: true
            });
            let multipliedResponse;
            //multiply aidDPLogic
            if (firstParameterValue.response === " " || secondParameterValue.response == 0 || secondParameterValue.response === " ") {
              multipliedResponse = 'NA';
            } else if (firstParameterValue.response == 0) {
              multipliedResponse = 0;
            } else {
              let numerator, denominator;
              if (isNaN(firstParameterValue.response)) {
                numerator = Number(firstParameterValue.response.replace(/[^\d.]/g, '').trim());
                numerator = Number(numerator).toFixed(4);
              } else {
                numerator = Number(firstParameterValue.response);
                numerator = Number(numerator).toFixed(4);
              }
              if (isNaN(secondParameterValue.response)) {
                denominator = Number(secondParameterValue.response.replace(/[^\d.]/g, '').trim());
                denominator = Number(denominator).toFixed(4);
              } else {
                denominator = Number(secondParameterValue.response);
                denominator = Number(denominator).toFixed(4);
              }
              multipliedResponse = (numerator / denominator) * 2000 * 1000000;
              multipliedResponse = Number(multipliedResponse).toFixed(4);
            }
            if (asMultiplyRules[i].methodType == "composite") {
              if (multipliedResponse == 'NA') {
                let thirdParameterValue = await StandaloneDatapoints.findOne({
                  companyId: companyId,
                  datapointId: thirdParameterDpId,
                  year: year,
                  isActive: true,
                  status: true
                });
                await StandaloneDatapoints.updateOne({
                  _id: ruleResponseObject.id
                }, {
                  $set: {
                    response: thirdParameterValue.response
                  }
                });
              } else {
                await StandaloneDatapoints.updateOne({
                  _id: ruleResponseObject.id
                }, {
                  $set: {
                    response: multipliedResponse
                  }
                });
              }
            } else {
              await StandaloneDatapoints.updateOne({
                _id: ruleResponseObject.id
              }, {
                $set: {
                  response: multipliedResponse
                }
              });
            }
  
          }
        }
      }
      if (i == asMultiplyRules.length - 1) {
        // console.log('before asMultiplyRules');
        // let multiplyT2 = performance.now();
        // console.log("Multiply", multiplyT2 - multiplyT1);
        return true;
      }
    }
}
export const matrixPercentageCalculation = async function (taskId, companyId, mergedDetails, distinctYears, allDatapointsList, categoryId, userDetail) {
    // let matrixPercentageT1 = performance.now();
    let allDerivedDatapoints = [];
    let matrixPercentageRules = await Rules.find({
      methodName: "MatrixPercentage",categoryId: categoryId
    }).populate('datapointId');
    console.log(" matrixPercentageRules.length ", matrixPercentageRules.length)
    for (let i = 0; i < matrixPercentageRules.length; i++) {
      if (matrixPercentageRules[i].methodType != "" || matrixPercentageRules[i].methodType == "composite") {
        let parameters = matrixPercentageRules[i].parameter.split(",");
        let numerator = parameters[0] ? parameters[0] : '';
        let denominator = parameters[1] ? parameters[1] : '';
        let numeratorDpObject = _.filter(allDatapointsList, {
          code: numerator
        });
        let denominatorDpObject = _.filter(allDatapointsList, {
          code: denominator
        });
        let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
        let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
        let numeratorValues = [];
        let denominatorValues = [];
        _.filter(mergedDetails, (object, index) => {
          for (let k = 0; k < distinctYears.length; k++) {
            const year = distinctYears[k];
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              numeratorValues.push(object)
            } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              denominatorValues.push(object)
            }
          }
        });
        if (numeratorValues.length > 0 && denominatorValues.length > 0 && numeratorValues.length == denominatorValues.length) {
          for (let j = 0; j < numeratorValues.length; j++) {
            let numeratorResponseValue, denominatorResponseValue, derivedResponse;
            if (numeratorValues[j].response == "" || numeratorValues[j].response == ' ' || numeratorValues[j].response == "NA" || isNaN(numeratorValues[j].response)) {
              derivedResponse = "NA";
            } else if (numeratorValues[j].response == "0" || numeratorValues[j].response == 0) {
              derivedResponse = "0";
            } else {
              if (denominatorValues[j].response == "" || denominatorValues[j].response == " " || denominatorValues[j].response == "NA" || denominatorValues[j].response == '0' || denominatorValues[j].response == 0 || isNaN(denominatorValues[j].response)) {
                derivedResponse = "NA";
              } else {
                numeratorResponseValue = numeratorValues[j].response.toString();
                numeratorResponseValue = numeratorResponseValue.replace(/[^\d.]/g, '');
                denominatorResponseValue = denominatorValues[j].response.toString();
                denominatorResponseValue = denominatorResponseValue.replace(/[^\d.]/g, '');
  
                derivedResponse = (Number(numeratorResponseValue).toFixed(4) / Number(denominatorResponseValue).toFixed(4)) * 100;
                derivedResponse = Number(derivedResponse).toFixed(4);
              }
            }
            let derivedDatapointsObject = {
              companyId: numeratorValues[j].companyId.id,
              datapointId: matrixPercentageRules[i].datapointId.id,
              year: numeratorValues[j].year,
              response: derivedResponse,
              memberName: numeratorValues[j].memberName ? numeratorValues[j].memberName.replace(/[\s\r\n]/g, '') : '',
              memberStatus: true,
              status: true,
              taskId:taskId,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        }
      } else {
        let parameters = matrixPercentageRules[i].parameter.split(",");
        let numerator = parameters[0] ? parameters[0] : '';
        let denominator = parameters[1] ? parameters[1] : '';
        let numeratorDpObject = _.filter(allDatapointsList, {
          code: numerator
        });
        let denominatorDpObject = _.filter(allDatapointsList, {
          code: denominator
        });
        let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
        let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
        let numeratorValues = [];
        let denominatorValue = '';
        for (let k = 0; k < distinctYears.length; k++) {
          const year = distinctYears[k];
          _.filter(mergedDetails, (object, index) => {
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              numeratorValues.push(object)
            } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year) {
              denominatorValue = object.response;
            }
          });
          if (numeratorValues.length > 0) {
            for (let j = 0; j < numeratorValues.length; j++) {
              let numeratorResponseValue, denominatorResponseValue, derivedResponse;
              // numer logic = blank or 'NA' => derivedResponse = 'NA' and 0 => derivedResponse = 0;
              // deno logic = blank, "", NA, 0, '0' => derivedResponse = 'NA';
              if (numeratorValues[j].response == "" || numeratorValues[j].response == ' ' || numeratorValues[j].response == "NA" || isNaN(numeratorValues[j].response)) {
                derivedResponse = "NA";
              } else if (numeratorValues[j].response == "0" || numeratorValues[j].response == 0) {
                derivedResponse = "0";
              } else {
                if (denominatorValue == "" || denominatorValue == " " || denominatorValue == "NA" || denominatorValue == '0' || denominatorValue == 0 || isNaN(denominatorValue)) {
                  derivedResponse = "NA";
                } else {
                  numeratorResponseValue = numeratorValues[j].response.toString();
                  numeratorResponseValue = numeratorResponseValue.replace(/[^\d.]/g, '');
                  denominatorResponseValue = denominatorValue.toString();
                  denominatorResponseValue = denominatorResponseValue.replace(/[^\d.]/g, '');
  
                  derivedResponse = (Number(numeratorResponseValue).toFixed(4) / Number(denominatorResponseValue).toFixed(4)) * 100;
                  derivedResponse = Number(derivedResponse).toFixed(4);
                }
              }
  
              let derivedDatapointsObject = {
                companyId: numeratorValues[j].companyId.id,
                datapointId: matrixPercentageRules[i].datapointId.id,
                year: numeratorValues[j].year,
                response: derivedResponse,
                memberName: numeratorValues[j].memberName ? numeratorValues[j].memberName.replace(/[\s\r\n]/g, '') : '',
                memberStatus: true,
                status: true,
                taskId:taskId,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            }
          } else {
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: matrixPercentageRules[i].datapointId.id,
              year: year,
              response: 'NA',
              memberName: '',
              memberStatus: true,
              status: true,
              taskId:taskId,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        }
      }
      if (i == matrixPercentageRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
}
export const minusCalculation = async function (taskId, companyId, mergedDetails, distinctYears, allDatapointsList, categoryId, userDetail) {
    // let minusT1 = performance.now();
    let allDerivedDatapoints = [];
    console.log('minus Calculation');
    let minusRules = await Rules.find({
      methodName: "Minus", categoryId: categoryId
    }).populate('datapointId');
  
    for (let i = 0; i < minusRules.length; i++) {
      let derivedResponse;
      let boardMemberEq = await BoardMembers.find({companyId: companyId, endDateTimeStamp: 0});
      for (let currentYearIndex = 0; currentYearIndex < distinctYears.length; currentYearIndex++) {
        let yearSplit = distinctYears[currentYearIndex].split('-');
        let endDateString = yearSplit[1]+"-12-31";
        let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
        let boardMemberGt = await BoardMembers.find({companyId: companyId,endDateTimeStamp:{$gt:yearTimeStamp}});
        console.log(1614709800 ,  yearTimeStamp);        
        let companyDetailObject = await Companies.findOne({
          _id: companyId
        })
        let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);
        for (let boardMamberIndex = 0; boardMamberIndex < mergeBoardMemberList.length; boardMamberIndex++) {
          let denominatorConvertedDate = new Date(mergeBoardMemberList[boardMamberIndex].startDate);
          let fiscalYearEndDate = yearSplit[1]+'-'+companyDetailObject.fiscalYearEndMonth+'-'+companyDetailObject.fiscalYearEndMonth;
          let numeratorConvertedDate = new Date(fiscalYearEndDate)
          derivedResponse = moment([numeratorConvertedDate.getUTCFullYear(), numeratorConvertedDate.getUTCMonth(), numeratorConvertedDate.getUTCDate()])
          .diff(moment([denominatorConvertedDate.getUTCFullYear(), denominatorConvertedDate.getUTCMonth(), denominatorConvertedDate.getUTCDate()]), 'years', true)
          console.log("\n\n",denominatorConvertedDate,fiscalYearEndDate,numeratorConvertedDate)
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: minusRules[i].datapointId.id,
            year: distinctYears[currentYearIndex],
            response: derivedResponse ? derivedResponse.toString() : derivedResponse,
            memberName: mergeBoardMemberList[boardMamberIndex].BOSP004 ? mergeBoardMemberList[boardMamberIndex].BOSP004.replace(/[\s\r\n]/g, '') : '',
            memberStatus: true,
            status: true,
            taskId:taskId,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
          
        }
      }
      if (i == minusRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
  }
export const asRatioCalculation = async function (taskId, companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
    //let asRatioT1 = performance.now();
    let asRatioRules = await Rules.find({
      methodName: "AsRatio", categoryId: categoryId
    }).populate('datapointId');
    console.log('asRatio Calculation');
    for (let i = 0; i < asRatioRules.length; i++) {
      let parameters = asRatioRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let derivedResponse;
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = asRatioRules[i].datapointId.id;
        let numeratorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: numeratorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let denominatorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: denominatorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
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
              derivedResponse = Number(numeratorValue.response).toFixed(4) / Number(denominatorValue.response).toFixed(4)
              derivedResponse = Number(derivedResponse).toFixed(4);
            }
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: derivedResponse
              }
            });
          }
        }
      }
      if (i == asRatioRules.length - 1) {
        // console.log('before asRatioRules');
        // let asRatioT2 = performance.now();
        // console.log("AsRatio", asRatioT2 - asRatioT1);
        return true;
      }
    }
}
export const asPercentageCalculation = async function (taskId, companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
    //let asPercentageT1 = performance.now();
    let asPercentageRules = await Rules.find({
      methodName: "AsPercentage", categoryId: categoryId
    }).populate('datapointId');
    console.log('asPercentage Calculation');
    for (let i = 0; i < asPercentageRules.length; i++) {
      let parameters = asPercentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let derivedResponse;
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = asPercentageRules[i].datapointId.id;
        let numeratorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: numeratorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let denominatorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: denominatorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        if (ruleResponseObject) {
          if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
            //perform calc
            if (numeratorValue.response == 0 || numeratorValue.response == '0') {
              derivedResponse = 0;
            } else if (numeratorValue.response == '' || numeratorValue.response == ' ' || numeratorValue.response == 'NA') {
              derivedResponse = 'NA';
            } else if (denominatorValue.response == 0 || denominatorValue.response == '' || denominatorValue.response == ' ' || denominatorValue.response == 'NA') {
              derivedResponse = 'NA';
            } else {
              derivedResponse = (Number(numeratorValue.response).toFixed(4) / Number(denominatorValue.response).toFixed(4)) * 100;
              derivedResponse = Number(derivedResponse).toFixed(4);
            }
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: derivedResponse
              }
            });
          }
        }
      }
      if (i == asPercentageRules.length - 1) {
        // console.log('before asPercentageRules');
        // let asPercentageT2 = performance.now();
        // console.log("AsPercentage", asPercentageT2 - asPercentageT1);
        return true;
      }
    }
}
export const addCalculation = async function (taskId, companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
    //let addT1 = performance.now();
    let addRules = await Rules.find({
      methodName: "ADD", categoryId: categoryId
    }).populate('datapointId');
    console.log('add Calculation');
    for (let i = 0; i < addRules.length; i++) {
      let parameters = addRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let derivedResponse;
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = addRules[i].datapointId.id;
        let numeratorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: numeratorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let denominatorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: denominatorDpId,
          year: year,
          status: true
        });
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
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
              derivedResponse = Number(numeratorValue.response) + Number(denominatorValue.response);
              derivedResponse = Number(derivedResponse).toFixed(4);
            }
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: derivedResponse
              }
            });
          }
        }
      }
      if (i == addRules.length - 1) {
        // console.log('before add rule');
        // let addT2 = performance.now();
        // console.log("Add", addT2 - addT1);
        return true;
      }
    }
}
export const yesNoCalculation = async function (taskId, companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
   // let yesNoT1 = performance.now();
    let allDerivedDatapoints = [];
    let yesNoRules = await Rules.find({
      methodName: "YesNo", categoryId: categoryId
    }).populate('datapointId');
    console.log('yes no Calculation', yesNoRules.length);
    for (let i = 0; i < yesNoRules.length; i++) {
      let parameters = yesNoRules[i].parameter.split(",");
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let sumValue;
        let ruleDatapointId = yesNoRules[i].datapointId.id;
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
  
        let count = 0;
        for (let k = 0; k < parameters.length; k++) {
          let parameterDpObject = _.filter(allDatapointsList, {
            code: parameters[k]
          });
          let parameterDpId = parameterDpObject[0] ? parameterDpObject[0].id : '';
          let dpResponse = await StandaloneDatapoints.findOne({
            companyId: companyId,
            datapointId: parameterDpId,
            year: year,
            status: true
          });
          if (dpResponse.response) {
            let numeratorResponse = dpResponse.response ? dpResponse.response.toString().toLowerCase() : dpResponse.response
            if (numeratorResponse == 'yes' || numeratorResponse == 'y') {
              count++;
            }
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
            taskId:taskId,
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
            taskId:taskId,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
      if (i == yesNoRules.length - 1) {
        // console.log('before yesNoRules');
        // let yesNoT2 = performance.now();
        // console.log("YesNo", yesNoT2 - yesNoT1);
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
}
export const ratioCalculation = async function (taskId, companyId, mergedDetails, distinctYears, allDatapointsList,derivedDatapointsList, categoryId, userDetail) {   
  let allDerivedDatapoints = [];
  let priorityDatapointObjects =  await Rules.find({
    methodName: "Ratio", methodType: "Priority",categoryId: categoryId
  }).populate('datapointId');
  if (priorityDatapointObjects.length > 0) {
    for (let index = 0; index < priorityDatapointObjects.length; index++) {
      let parameters = priorityDatapointObjects[index].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = priorityDatapointObjects[index].datapointId.id;
        let numeratorResponse = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: numeratorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let denominatorResponse = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: denominatorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let derivedResponse;
        if (numeratorResponse && denominatorResponse) {
          if (numeratorResponse.response.toString() == '0') {
            derivedResponse = 0;
          } else if (numeratorResponse.response == '' || numeratorResponse.response == ' ' || numeratorResponse.response == 'NA') {
            derivedResponse = 'NA';
          } else if (denominatorResponse.response.toString() == '0' || denominatorResponse.response == '' || denominatorResponse.response == ' ' || denominatorResponse.response == 'NA') {
            derivedResponse = 'NA';
          } else {
            // derivedResponse = Number(numeratorResponse.response)/Number(denominatorResponse.response)
            derivedResponse = Number(numeratorResponse.response.replace(/[^\d.]/g, '')).toFixed(4) / Number(denominatorResponse.response.replace(/[^\d.]/g, '')).toFixed(4);
            derivedResponse = Number(derivedResponse).toFixed(4);
          }

          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: ruleDatapointId,
            year: year,
            response: derivedResponse ? derivedResponse.toString() : derivedResponse,
            memberName: '',
            memberStatus: true,
            status: true,
            taskId:taskId,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }
  }
  let ratioRules = await Rules.find({
    methodName: "Ratio",
    methodType: {
      $ne: "Priority"
    },
    categoryId: categoryId
  }).populate('datapointId');
  console.log('ratio Calculation');
  mergedDetails = _.concat(mergedDetails, allDerivedDatapoints, derivedDatapointsList);
  if (ratioRules.length > 0) {
    for (let i = 0; i < ratioRules.length; i++) {
      let parameters = ratioRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = '',
        denominatorValues = '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = ratioRules[i].datapointId.id;
        if (ratioRules[i].methodType == "IF") {
          let activeMemberValues = [];
          _.filter(mergedDetails, (object, index) => {
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              activeMemberValues.push(object.response ? object.response.toString() : object.response);
            }
            if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year) {
              denominatorValues = object.response;
            }
            if (object.datapointId == numeratorDpId && object.companyId == companyId && object.year == year) {
              numeratorValues = object.response;
            }
            if (object.datapointId == denominatorDpId && object.companyId == companyId && object.year == year) {
              denominatorValues = object.response;
            }
          });
          let sumValue;
          if (activeMemberValues.length > 0) {
            activeMemberValues = activeMemberValues.filter(e => e.trim());
            activeMemberValues = activeMemberValues.filter(e => e.toLowerCase() != "na");
            if (activeMemberValues.length > 0) {
              sumValue = activeMemberValues.reduce(function (prev, next) {
                if (prev && next) {
                  let prevResponse = prev.replace(/[^\d.]/g, '');
                  let nextResponse = next.replace(/[^\d.]/g, '');
                  let sum = Number(prevResponse) + Number(nextResponse);
                  return sum.toFixed(4);
                }
              });
            }
            let percentValue = 0.5 * Number(denominatorValues ? denominatorValues : '0').toFixed(4);
            if (activeMemberValues.length < percentValue || denominatorValues == " ") {
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: 'NA',
                memberName: '',
                memberStatus: true,
                status: true,
                taskId:taskId,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            } else {
              let resValue;
              if (sumValue === " " || sumValue == "" || sumValue == 'NA') {
                resValue = 'NA';
              } else if (sumValue == 0) {
                resValue = 0;
              } else if (activeMemberValues.length == 0) {
                resValue = 'NA';
              } else {
                let stringValue = sumValue ? sumValue.toString().replace(/[^\d.]/g, '').trim() : 0;
                let divisor = Number(stringValue).toFixed(4);
                let dividend = activeMemberValues.length;
                let answer = divisor / dividend;
                resValue = answer ? answer.toString() : answer;
              }
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: resValue ? resValue.toString() : resValue,
                memberName: '',
                memberStatus: true,
                status: true,
                taskId:taskId,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            }
          } else {
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: ruleDatapointId,
              year: year,
              response: 'NA',
              memberName: '',
              memberStatus: true,
              status: true,
              taskId:taskId,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        } else {
          _.filter(mergedDetails, (object, index) => {
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year) {
              numeratorValues = object.response ? object.response.toString() : object.response;
            } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year) {
              denominatorValues = object.response ? object.response.toString() : object.response;
            }
            if (object.datapointId == numeratorDpId && object.companyId == companyId && object.year == year) {
              numeratorValues = object.response ? object.response.toString() : object.response;
            }
            if (object.datapointId == denominatorDpId && object.companyId == companyId && object.year == year) {
              denominatorValues = object.response ? object.response.toString() : object.response;
            }
          });

          let derivedValue;
          if (numeratorValues == '0') {
            derivedValue = '0';
          } else if (numeratorValues == ' ' || numeratorValues == '' || numeratorValues == 'NA') {
            derivedValue = 'NA';
          } else {
            if (denominatorValues == ' ' || denominatorValues == '' || denominatorValues == 'NA' || denominatorValues == '0' || denominatorValues == 0) {
              derivedValue = 'NA';
            } else {
              if (numeratorValues) {
                numeratorValues = numeratorValues.replace(/[^\d.]/g, '');
              }
              if (denominatorValues) {
                denominatorValues = denominatorValues.replace(/[^\d.]/g, '');
              }
              derivedValue = (Number(numeratorValues).toFixed(4) / Number(denominatorValues).toFixed(4));
              derivedValue = Number(derivedValue).toFixed(4);
            }
          }
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: ruleDatapointId,
            year: year,
            response: derivedValue ? derivedValue.toString() : derivedValue,
            memberName: '',
            memberStatus: true,
            status: true,
            taskId:taskId,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
      if (i == ratioRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
  }
}
export const sumCalculation = async function (taskId, companyId, mergedDetails, distinctYears, allDatapointsList, categoryId, userDetail) {
    // let sumT1 = performance.now();
    let allDerivedDatapoints = [];
    let sumRules = await Rules.find({
      methodName: "Sum", categoryId: categoryId
    }).populate('datapointId');
    console.log('sum Calculation', sumRules.length);
    for (let i = 0; i < sumRules.length; i++) {
      let parameters = sumRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let derivedResponse;
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let sumValue;
        let ruleDatapointId = sumRules[i].datapointId.id;
  
        let ruleResponseObject = await StandaloneDatapoints.find({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        let activeMembers = []
        _.filter(mergedDetails, (object, index) => {
          if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
            activeMembers.push(object.response ? object.response.toString() : '0')
          }
        });
        if (activeMembers.length > 0) {
          sumValue = activeMembers.reduce(function (prev, next) {
            if (prev && next) {
              let prevResponse = prev.trim().replace(/[^\d.]/g, '');
              let nextResponse = next.trim().replace(/[^\d.]/g, '');
              let sum = Number(prevResponse) + Number(nextResponse);
              return sum.toFixed(4);
            } else {
              sumValue = 0;
            }
          });
        } else {
          sumValue = 0;
        }
        let derivedResponse;
        if (sumValue) {
          if (sumValue.response) {
            derivedResponse = sumValue.response.toString();
          } else {
            derivedResponse = sumValue;
          }
        } else {
          derivedResponse = sumValue;
        }
        let derivedDatapointsObject = {
          companyId: companyId,
          datapointId: ruleDatapointId,
          year: year,
          response: derivedResponse ? derivedResponse : 0,
          memberName: '',
          memberStatus: true,
          status: true,
          taskId:taskId,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }
      if (i == sumRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
}
export const countOfCalculation = async function (taskId, companyId, mergedDetails, distinctYears, allDatapointsList, derivedDatapointsList, categoryId, userDetail) {
    // let countOfT1 = performance.now();
    let allDerivedDatapoints = [];
    let countOfRules = await Rules.find({
      methodName: "count of", categoryId: categoryId
    }).populate('datapointId');
    console.log('count of Calculation', countOfRules.length);
    mergedDetails = _.concat(mergedDetails, derivedDatapointsList)
    for (let i = 0; i < countOfRules.length; i++) {
      let parameters = countOfRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let derivedResponse;
      for (let j = 0; j < distinctYears.length; j++) {
        let values = [];
        const year = distinctYears[j];
        let sumValue;
        let ruleDatapointId = countOfRules[i].datapointId.id;
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        if (countOfRules[i].methodType == 'composite') {
          let total = 0;
          let numeratorList = [],
            denominatorList = []
          if (parameters.length == 2) {
            _.filter(mergedDetails, (object, index) => {
              if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
                numeratorList.push(object)
              } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
                denominatorList.push(object)
              }
            });
            // intersection formula
            if (numeratorList.length > 0 && denominatorList.length > 0) {
              let count = 0;
              numeratorList = numeratorList.filter(e => String(e.response).trim());
              denominatorList = denominatorList.filter(e => String(e.response).trim());
              if (countOfRules[i].criteria.toLowerCase() == 'y' || countOfRules[i].criteria.toLowerCase() == 'yes') {
                for (let ix = 0; ix < denominatorList.length; ix++) {
                  for (let jx = 0; jx < numeratorList.length; jx++) {
                    if (denominatorList[ix].memberName == numeratorList[jx].memberName) {
                      if (denominatorList[ix].response && numeratorList[jx].response) {
                        if ((denominatorList[ix].response.toLowerCase() == 'yes' && numeratorList[jx].response.toLowerCase() == 'yes') || (denominatorList[ix].response.toLowerCase() == 'y' && numeratorList[jx].response.toLowerCase() == 'y')) {
                          count++;
                        }
                      }
                    }
                  }
                }
              }
              let derivedDatapointsObject = {
                companyId: companyId,
                datapointId: ruleDatapointId,
                year: year,
                response: count ? count.toString() : count,
                memberName: '',
                memberStatus: true,
                status: true,
                taskId:taskId,
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
                taskId:taskId,
                createdBy: userDetail
              }
              allDerivedDatapoints.push(derivedDatapointsObject);
            }
          } else {
  
            for (let kx = 0; kx < parameters.length; kx++) {
              let parameterDatapointObject = await Datapoints.findOne({
                code: parameters[kx].trim()
              });
              await StandaloneDatapoints.findOne({
                  companyId: companyId,
                  year: year,
                  datapointId: parameterDatapointObject.id,
                  status: true
                }).populate('updatedBy').populate('keyIssueId').populate('functionId')
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
              response: total ? total.toString() : total,
              memberName: '',
              memberStatus: true,
              status: true,
              taskId:taskId,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        } else {
  
          //let values = _.filter(mergedDetails, { year: '2018-2019', datapointId: numeratorDpId, memberStatus: true });
          _.filter(mergedDetails, (object, index) => {
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              values.push(object.response ? object.response.toString().toLowerCase() : object.response);
            } else if (object.datapointId == numeratorDpId && object.companyId == companyId && object.year == year) {
              values.push(object.response ? object.response.toString().toLowerCase() : object.response);
            }
          });
          if (values.length > 0) {
            // let countValue = await count(arr, ruleValue.criteria)
            let finalResponse;
  
            values = values.filter(e => String(e).trim());
            values = values.filter(e => e != 'na');
            if (countOfRules[i].criteria == '2') {
              if (values.length > 0) {
                finalResponse = values.filter(item => Number(item) >= Number(countOfRules[i].criteria)).length;
              } else {
                finalResponse = 'NA';
              }
            } else if (countOfRules[i].criteria.toLowerCase() == 'd') {
              // count of only active members
              if (values.length > 0) {
                finalResponse = values.length;
              } else {
                finalResponse = 'NA';
              }
            } else if (countOfRules[i].criteria.toLowerCase() == 'y' || countOfRules[i].criteria.toLowerCase() == 'yes') {
              if (values.length > 0) {
                if (values.includes('Yes') || values.includes('yes') || values.includes('Y') || values.includes('y')) {
                  finalResponse = values.filter(item => item == 'Yes' || item == 'Y' || item == 'yes' || item == 'y').length;
                } else {
                  finalResponse = '0';
                }
              } else {
                finalResponse = 'NA';
              }
            } else {
              if (values.length > 0) {
                if (values.includes('F') || values.includes('f')) {
                  finalResponse = values.filter(item => item == 'F' || item == 'f').length;
                } else {
                  finalResponse = '0';
                }
              } else {
                finalResponse = 'NA';
              }
            }
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: ruleDatapointId,
              year: year,
              response: finalResponse ? finalResponse.toString() : finalResponse,
              memberName: '',
              memberStatus: true,
              taskId:taskId,
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
              taskId:taskId,
              status: true,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        }
      }
      if (i == countOfRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }

}
export const percentageCalculation = async function (taskId, companyId, mergedDetails, distinctYears, allDatapointsList, allDerivedDatapointsList, categoryId, userDetail) {
    console.log('percentage Calculation');
    let allDerivedDatapoints = [];
    let percentageRules = await Rules.find({
      methodName: "Percentage",categoryId: categoryId
    }).populate('datapointId');
    for (let i = 0; i < percentageRules.length; i++) {
      if (percentageRules[i].methodType == "sum,sum") {
        let parameters = percentageRules[i].parameter.split(",");
        let numerator = parameters[0] ? parameters[0] : '';
        let denominator = parameters[1] ? parameters[1] : '';
        let numeratorDpObject = _.filter(allDatapointsList, {
          code: numerator
        });
        let denominatorDpObject = _.filter(allDatapointsList, {
          code: denominator
        });
        let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
        let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
  
        for (let k = 0; k < distinctYears.length; k++) {
          const year = distinctYears[k];
          let numeratorValues = [];
          let denominatorValues = [];
          let numeratorSum = 0;
          let denominatorSum = 0;
          let derivedResponse;
  
          _.filter(mergedDetails, (object, index) => {
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              numeratorValues.push(object.response)
            } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              denominatorValues.push(object.response)
            }
          });
  
          if (numeratorValues.length > 0) {
            numeratorSum = numeratorValues.reduce(function (prev, next) {
              if (prev && next) {
                let prevResponse = prev.replace(/[^\d.]/g, '');
                let nextResponse = next.replace(/[^\d.]/g, '');
                let sum = Number(prevResponse).toFixed(4) + Number(nextResponse).toFixed(4);
                return sum.toFixed(4);
              }
            });
          } else {
            numeratorSum = 0;
          }
          if (denominatorValues.length > 0) {
            denominatorSum = denominatorValues.reduce(function ( prev, next) {
              if (prev && next) {
                let prevResponse = prev.replace(/[^\d.]/g, '');
                let nextResponse = next.replace(/[^\d.]/g, '');
                let sum = Number(prevResponse).toFixed(4) + Number(nextResponse).toFixed(4);
                return sum.toFixed(4);
              }
            });
          } else {
            denominatorSum = 0;
          }
          derivedResponse = isNaN((numeratorSum / denominatorSum) * 100) ? 0 : (numeratorSum / denominatorSum) * 100;
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: percentageRules[i].datapointId.id,
            year: year,
            response: derivedResponse ? derivedResponse.toString() : derivedResponse,
            memberName: '',
            memberStatus: true,
            taskId:taskId,
            status: true,
            createdBy: userDetail
  
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
  
      } else {
        let parameters = percentageRules[i].parameter.split(",");
        let numerator = parameters[0] ? parameters[0] : '';
        let denominator = parameters[1] ? parameters[1] : '';
        let numeratorDpObject = _.filter(allDatapointsList, {
          code: numerator
        });
        let denominatorDpObject = _.filter(allDatapointsList, {
          code: denominator
        });
        let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
        let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
        let numeratorValues = [];
        let denominatorValues = [];
        for (let k = 0; k < distinctYears.length; k++) {
          const year = distinctYears[k];
          // stan
          let checkNumeratorId = await StandaloneDatapoints.findOne({
            datapointId: numeratorDpId,
            year: year,
            isActive: true,
            companyId: companyId,
            status: true
          })
          let checkDenominatorId = await StandaloneDatapoints.findOne({
            datapointId: denominatorDpId,
            year: year,
            isActive: true,
            companyId: companyId,
            status: true
          })
          if (checkNumeratorId) {
            numeratorValues.push(checkNumeratorId)
          } else {
            let checkNumeratorID = _.filter(allDerivedDatapointsList, {
              datapointId: numeratorDpId,
              year: year,
              companyId: companyId,
              status: true
            });
            numeratorValues.push(checkNumeratorID[0])
          }
          if (checkDenominatorId) {
            denominatorValues.push(checkDenominatorId)
          } else {
            let checkDenomiatorID = _.filter(allDerivedDatapointsList, {
              datapointId: denominatorDpId,
              year: year,
              companyId: companyId,
              status: true
            });
            denominatorValues.push(checkDenomiatorID[0])
          }
        }
  
        if (numeratorValues.length > 0 && denominatorValues.length > 0 && numeratorValues.length == denominatorValues.length) {
          for (let j = 0; j < numeratorValues.length; j++) {
            let derivedResponse;
            if (numeratorValues[j].response == '0' || numeratorValues[j].response == 0) {
              derivedResponse = '0';
            } else if (numeratorValues[j].response == ' ' || numeratorValues[j].response == '' || numeratorValues[j].response == 'NA') {
              derivedResponse = 'NA';
            } else {
              if (denominatorValues[j].response == ' ' || denominatorValues[j].response == '' || denominatorValues[j].response == 'NA' || denominatorValues[j].response == '0' || denominatorValues[j].response == 0) {
                derivedResponse = 'NA';
              } else {
                derivedResponse = (Number(numeratorValues[j].response.replace(/[^\d.]/g, '').toFixed(4)) / Number(denominatorValues[j].response.replace(/[^\d.]/g, '')).toFixed(4)) * 100;
                derivedResponse = Number(derivedResponse).toFixed(4);
              }
            }
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: percentageRules[i].datapointId.id,
              year: numeratorValues[j].year,
              response: derivedResponse ? derivedResponse.toString() : derivedResponse,
              memberName: '',
              memberStatus: true,
              taskId:taskId,
              status: true,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          }
        }
      }
  
      if (i == percentageRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
}
export const ratioAddCalculation = async function (taskId, companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
    // let ratioAddT1 = performance.now();
    let allDerivedDatapoints = [];
    let ratioAddRules = await Rules.find({
      methodName: "RatioADD", categoryId: categoryId
    }).populate('datapointId');
    console.log('ratio add Calculation', ratioAddRules.length);
    for (let i = 0; i < ratioAddRules.length; i++) {
      let parameters = ratioAddRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let denominatorDpObject = _.filter(allDatapointsList, {
        code: denominator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = ratioAddRules[i].datapointId.id;
        let numeratorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: numeratorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let denominatorValue = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: denominatorDpId,
          isActive: true,
          year: year,
          status: true
        });
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        let addResponse, percentResponse;
        if (numeratorValue.response === " " || denominatorValue.response === " ") {
          addResponse = 'NA';
        } else {
          addResponse = Number(numeratorValue.response.replace(/[^\d.]/g, '').trim()) + Number(denominatorValue.response.replace(/[^\d.]/g, '').trim());
          addResponse = Number(addResponse).toFixed(4);
          //  = await percent(numeratorValue.response, addResponse);
          if (numeratorValue.response === " " || numeratorValue.response == 'NA') {
            percentResponse = 'NA';
          } else if (numeratorValue.response == 0) {
            percentResponse = 0;
          } else if (percentResponse == 0 || percentResponse == "" || percentResponse == " ") {
            percentResponse = "NA";
          } else {
            let numeratorNumber;
            if (isNaN(numeratorValue.response)) {
              numeratorNumber = Number(numeratorValue.response.replace(/[^\d.]/g, '').trim()).toFixed(4);
            } else {
              numeratorNumber = Number(numeratorValue.response).toFixed(4);
            }
            percentResponse = (numeratorNumber / addResponse) * 100;
            percentResponse = Number(percentResponse).toFixed(4);
          }
        }
        let derivedDatapointsObject = {
          companyId: companyId,
          datapointId: ruleDatapointId,
          year: year,
          response: percentResponse ? percentResponse.toString() : percentResponse,
          memberName: '',
          memberStatus: true,
          taskId:taskId,
          status: true,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }
      if (i == ratioAddRules.length - 1) {
        return {
          allDerivedDatapoints: allDerivedDatapoints
        };
      }
    }
}
export const asCalculation = async function (taskId,companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
    // let asT1 = performance.now();
    let asRules = await Rules.find({
      methodName: "As",categoryId: categoryId
    }).populate('datapointId');
    console.log('as Calculation');
    for (let i = 0; i < asRules.length; i++) {
      let parameters = asRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let numeratorDpObject = _.filter(allDatapointsList, {
        code: numerator
      });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = asRules[i].datapointId.id;
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        if (ruleResponseObject) {
          if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
            //perform calc
            let numeratorValue = await StandaloneDatapoints.findOne({
              companyId: companyId,
              datapointId: numeratorDpId,
              isActive: true,
              year: year,
              status: true
            });
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: numeratorValue.response
              }
            });
          } else {
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: ruleResponseObject.response
              }
            });
          }
        }
      }
      if (i == asRules.length - 1) {
        return true;
      }
    }
}
export const conditionCalculation = async function (taskId,companyId, distinctYears, allDatapointsList, categoryId, userDetail) {
    // let conditionT1 = performance.now();
    let asConditionRules = await Rules.find({
      methodName: "Condition",categoryId: categoryId
    }).populate('datapointId');
    console.log('condition Calculation');
    for (let i = 0; i < asConditionRules.length; i++) {
      let parameter = asConditionRules[i].parameter;
      let parameterDpObject = _.filter(allDatapointsList, {
        code: parameter
      });
      let parameterDpId = parameterDpObject[0] ? parameterDpObject[0].id : '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = asConditionRules[i].datapointId.id;
        let ruleResponseObject = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: ruleDatapointId,
          isActive: true,
          year: year,
          status: true
        });
        if (ruleResponseObject) {
          if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
            //perform calc
            let numeratorValue = await StandaloneDatapoints.findOne({
              companyId: companyId,
              datapointId: parameterDpId,
              isActive: true,
              year: year,
              status: true
            });
  
            if (Number(numeratorValue.response) >= 50) {
              await StandaloneDatapoints.updateOne({
                _id: ruleResponseObject.id
              }, {
                $set: {
                  response: 'Y'
                }
              });
            } else {
              await StandaloneDatapoints.updateOne({
                _id: ruleResponseObject.id
              }, {
                $set: {
                  response: ruleResponseObject.response
                }
              }).exec();
            }
  
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: numeratorValue.response
              }
            });
          } else {
            await StandaloneDatapoints.updateOne({
              _id: ruleResponseObject.id
            }, {
              $set: {
                response: ruleResponseObject.response
              }
            });
          }
        }
      }
      if (i == asConditionRules.length - 1) {
        return true;
      }
    }
}



 