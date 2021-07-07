import _ from 'lodash'
import moment from 'moment'
import { performance, PerformanceObserver } from 'perf_hooks';
import { getJsDateFromExcel } from 'excel-date-to-js'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { DerivedDatapoints } from '.'
import { PolarityRules } from '../polarity_rules'
import { Rules } from '../rules'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { Companies } from '../companies'

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

export const calculateForACompany = async ({ user, params }, res, next) => {
  let timingDetails = [];
  let overAll1 = performance.now();
  const userDetail = user;
  const companyId = params.companyId ? params.companyId : null;

  await StandaloneDatapoints.find({ companyId: companyId })
    .populate('createdBy')
    .populate('datapointId')
    .populate('companyId')
    .populate('taskId')
    .then(async (companySADPDetails) => {
      //get distinct year from companySADPDetails
      let distinctYears = _.uniq(_.map(companySADPDetails, 'year'));
      if (distinctYears.length > 0) {
        let allStandaloneDetails = [];
        let allBoardMemberMatrixDetails = [];
        let allKmpMatrixDetails = [];
        let allDerivedDatapoints = [];
        let mergedDetails

        let allDatapointsList = await Datapoints.find({ status: true }).populate('updatedBy').populate('keyIssueId').populate('functionId');
        allStandaloneDetails = await StandaloneDatapoints.find({
          companyId: companyId,
          year: { "$in": distinctYears },
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId')

        allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          companyId: companyId,
          year: { "$in": distinctYears },
          memberStatus: true,
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')

        allKmpMatrixDetails = await KmpMatrixDataPoints.find({
          companyId: companyId,
          year: { "$in": distinctYears },
          memberStatus: true,
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')


        mergedDetails = _.concat(allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails);

        // let distinctRuleMethods = await Rules.distinct('methodName').populate('datapointId');
        let distinctRuleMethods = ["MatrixPercentage", "Minus", "Sum", "count of", "Ratio", "Percentage", "YesNo", "RatioADD", "As", "ADD", "AsPercentage", "AsRatio", "Condition", "Multiply"];
        //Process all rules
        for (let ruleIndex = 0; ruleIndex < distinctRuleMethods.length; ruleIndex++) {
          switch (distinctRuleMethods[ruleIndex]) {
            case "ADD":
              await addCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    console.log('result');
                  }
                })
              break;
            case "As":
              await asCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    // if(result.allDerivedDatapoints){
                    //   allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    // }
                  }
                })
              break;
            case "AsPercentage":
              await asPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    console.log('result');
                  }
                })
              break;
            case "AsRatio":
              await asRatioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    console.log('AsRatio result');
                  }
                })
              break;
            case "Condition":
              await conditionCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    // if(result.allDerivedDatapoints){
                    //   allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    // }
                  }
                })
              break;
            case "MatrixPercentage":
              await matrixPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);

                    }
                  }
                })
              break;
            case "Minus":
              await minusCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  } else if (result.error) {
                    return res.status(500).json({ message: "Wrong date input format for " + result.error })
                  }
                })
              break;
            case "Multiply":
              await multiplyCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    // if(result.allDerivedDatapoints){
                    //   allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    // }
                  }
                })
              break;
            case "Percentage":
              await percentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, allDerivedDatapoints, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  }
                })
              break;
            case "Ratio":
              await ratioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, allDerivedDatapoints, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  }
                })
              break;
            case "RatioADD":
              await ratioAddCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  }
                })
              break;
            case "Sum":
              await sumCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  }
                })
              break;
            case "YesNo":
              await yesNoCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  }
                })
              break;
            case "count of":
              await countOfCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, allDerivedDatapoints, userDetail)
                .then((result) => {
                  if (result) {
                    if (result.allDerivedDatapoints) {
                      allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                    }
                  }
                })
              break;

            default:
              break;
          }
          if (ruleIndex == distinctRuleMethods.length - 1) {
            // await DerivedDatapoints.updateMany({
            //   "companyId": companyId,
            //   "year": { $in: distinctYears }
            // }, { $set: { status: false } }, {});

            // await DerivedDatapoints.insertMany(allDerivedDatapoints)
            //   .then((err, result) => {
            //     if (err) {
            //       console.log('error', err);
            //     } else {
            //       //  console.log('result', result);
            //       return res.status(200).json({ message: "Calculation completed successfuly!", derivedDatapoints: allDerivedDatapoints });
            //     }
            //   });
          }
        }
        let fullStandaloneDetails = await StandaloneDatapoints.find({
          companyId: companyId,
          year: { "$in": distinctYears },
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId')
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          let polarityTime1 = performance.now();
          const year = distinctYears[yearIndex];
          // for (let companyIndex = 0; companyIndex < nicCompaniesList.length; companyIndex++) {
          let dataPointsIdList = await Datapoints.find({ standaloneOrMatrix: { "$ne": "Matrix" }, percentile: { "$ne": "Yes" }, relevantForIndia: "Yes" })
          let polarityRulesList = await PolarityRules.find({}).populate('datapointId')

          for (let polarityRulesIndex = 0; polarityRulesIndex < polarityRulesList.length; polarityRulesIndex++) {
            let datapointDetail = polarityRulesList[polarityRulesIndex].datapointId;
            if (datapointDetail.relevantForIndia == "Yes") {
              let polarityRuleDetails = polarityRulesList[polarityRulesIndex];
              if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
                let foundResponseIndex = fullStandaloneDetails.findIndex((object, index) => object.companyId.id == companyId && object.datapointId.id == polarityRuleDetails.datapointId.id && object.year == year);
                if (foundResponseIndex > -1) {
                  let foundResponse = fullStandaloneDetails[foundResponseIndex];
                  if (foundResponse) {
                    if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA') {
                      await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { response: 'NA', performanceResult: 'NA' } });
                    } else {
                      if (Number(foundResponse.response) >= Number(polarityRuleDetails.polarityValue)) {
                        if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Positive' } });
                        } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Negative' } });
                        }
                      } else if (Number(foundResponse.response) <= Number(polarityRuleDetails.polarityValue)) {
                        if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Negative' } });
                        }
                        else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Positive' } });
                        }
                      } else {
                        if (polarityRuleDetails.condition == 'range') {
                          let param = polarityRuleDetails.polarityValue.split(',');
                          if (Number(foundResponse.response) >= Number(param[0]) && Number(foundResponse.response) <= Number(param[1])) {
                            await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Positive' } });
                          } else {
                            await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Negative' } });
                          }
                        }
                      }
                    }
                  }
                } else {
                  if (polarityRuleDetails.datapointId.relevantForIndia == "Yes" && polarityRuleDetails.datapointId.standaloneOrMatrix != "Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
                    return res.status(500).json({ message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year` });
                  }
                }
              } else {
                let foundResponseIndex = allDerivedDatapoints.findIndex((object, index) => object.companyId == companyId && object.datapointId == polarityRuleDetails.datapointId.id && object.year == year);
                if (foundResponseIndex > -1) {
                  let foundResponse = allDerivedDatapoints[foundResponseIndex];
                  if (foundResponse) {
                    if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA') {
                      allDerivedDatapoints[foundResponseIndex].response = 'NA';
                      allDerivedDatapoints[foundResponseIndex].performanceResult = 'NA';
                    } else {
                      if (Number(foundResponse.response) >= Number(polarityRuleDetails.polarityValue)) {
                        if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'Positive';
                        }
                        else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                        }
                      } else if (Number(foundResponse.response) <= Number(polarityRuleDetails.polarityValue)) {
                        if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                        }
                        else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'Positive';
                        }
                      } else {
                        if (polarityRuleDetails.condition == 'range') {
                          let param = polarityRuleDetails.polarityValue.split(',');
                          if (Number(foundResponse.response) >= Number(param[0]) && Number(foundResponse.response) <= Number(param[1])) {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = 'Positive';
                          } else {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                          }
                        }
                      }
                    }
                  }
                } else {
                  if (polarityRuleDetails.datapointId.relevantForIndia == "Yes" && polarityRuleDetails.datapointId.standaloneOrMatrix != "Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
                    return res.status(500).json({ message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year` });
                  }
                }
              }
            }
          }
          for (let dataPointIndex = 0; dataPointIndex < dataPointsIdList.length; dataPointIndex++) {
            
            let isDpExistInPolarityRule = polarityRulesList.findIndex((object, index) => object.datapointId.id == dataPointsIdList[dataPointIndex].id);
            if (isDpExistInPolarityRule <= -1) {
              let datapointDetail = dataPointsIdList[dataPointIndex];
              if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
                let foundResponseIndex = fullStandaloneDetails.findIndex((object, index) => object.companyId.id == companyId && object.datapointId.id == dataPointsIdList[dataPointIndex].id && object.year == year);
                if (foundResponseIndex > -1) {
                  let foundResponse = fullStandaloneDetails[foundResponseIndex];
                  if (foundResponse) {
                    if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA' || foundResponse.response.toLowerCase() == 'nan') {
                      await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { response: 'NA', performanceResult: 'NA' } });
                    } else {
                      if (datapointDetail.code == 'BUSP009' || datapointDetail.code == 'BUSP008') {
                        if (foundResponse.response == 'No' || foundResponse.response == 'N') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Positive' } });
                        } else if (foundResponse.response == 'Yes' || foundResponse.response == 'Y') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Negative' } });
                        }
                      } else if (foundResponse.response == "Yes" || foundResponse.response == "Y" || foundResponse.response == "yes" || foundResponse.response == "y") {
                        if (datapointDetail.polarity == 'Positive') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Yes' } });
                        } else if (datapointDetail.polarity == 'Negative') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'No' } });
                        } else {
                          if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                            await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: foundResponse.response } });
                          }
                        }
                      } else if (foundResponse.response == "No" || foundResponse.response == "N" || foundResponse.response == "no" || foundResponse.response == "n") {
                        if (datapointDetail.polarity == 'Positive') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'No' } });
                        } else if (datapointDetail.polarity == 'Negative') {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'Yes' } });
                        } else {
                          if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                            await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: foundResponse.response } });
                          }
                        }
                      } else if (datapointDetail.finalUnit === 'Number' || datapointDetail.finalUnit === 'Number (Tonne)' || datapointDetail.finalUnit === 'Number (tCO2e)' || datapointDetail.finalUnit.trim() === 'Currency' || datapointDetail.finalUnit === 'Days' || datapointDetail.finalUnit === 'Hours' || datapointDetail.finalUnit === 'Miles' || datapointDetail.finalUnit === 'Million Hours Worked' || datapointDetail.finalUnit === 'No/Low/Medium/High/Very High' || datapointDetail.finalUnit === 'Number (tCFCe)' || datapointDetail.finalUnit === 'Number (Cubic meter)' || datapointDetail.finalUnit === 'Number (KWh)' || datapointDetail.finalUnit === 'Percentage' && datapointDetail.signal == 'No') {
                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: foundResponse.response } });
                      }
                    }
                  }
                }
              } else if (datapointDetail.dataCollection.toLowerCase() == "no" || datapointDetail.dataCollection.toLowerCase() == "nc") {
                let foundResponseIndex = allDerivedDatapoints.findIndex((object, index) => object.companyId == companyId && object.datapointId == dataPointsIdList[dataPointIndex].id && object.year == year);
                if (foundResponseIndex > -1) {
                  let foundResponse = allDerivedDatapoints[foundResponseIndex];
                  if (foundResponse) {
                    if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA' || foundResponse.response == 'NaN') {
                      allDerivedDatapoints[foundResponseIndex].response = 'NA';
                      allDerivedDatapoints[foundResponseIndex].performanceResult = 'NA';
                    } else {
                      if (datapointDetail.code == 'BUSP009' || datapointDetail.code == 'BUSP008') {
                        if (foundResponse) {
                          if (foundResponse.response == 'No' || foundResponse.response == 'N') {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = 'Positive';
                          } else if (foundResponse.response == 'Yes' || foundResponse.response == 'Y') {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                          }
                        }
                      } else if (foundResponse.response == "Yes" || foundResponse.response == "Y" || foundResponse.response == "yes" || foundResponse.response == "y") {
                        if (datapointDetail.polarity == 'Positive') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'Yes';
                        } else if (datapointDetail.polarity == 'Negative') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'No';
                        } else {
                          if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = foundResponse.response;
                          }
                        }
                      } else if (foundResponse.response == "No" || foundResponse.response == "N" || foundResponse.response == "no" || foundResponse.response == "n") {
                        if (datapointDetail.polarity == 'Positive') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'No';
                        } else if (datapointDetail.polarity == 'Negative') {
                          allDerivedDatapoints[foundResponseIndex].performanceResult = 'Yes';
                        } else {
                          if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = foundResponse.response;
                          }
                        }
                      } else if (datapointDetail.finalUnit === 'Number' || datapointDetail.finalUnit === 'Number (Tonne)' || datapointDetail.finalUnit === 'Number (tCO2e)' || datapointDetail.finalUnit.trim() === 'Currency' || datapointDetail.finalUnit === 'Days' || datapointDetail.finalUnit === 'Hours' || datapointDetail.finalUnit === 'Miles' || datapointDetail.finalUnit === 'Million Hours Worked' || datapointDetail.finalUnit === 'No/Low/Medium/High/Very High' || datapointDetail.finalUnit === 'Number (tCFCe)' || datapointDetail.finalUnit === 'Number (Cubic meter)' || datapointDetail.finalUnit === 'Number (KWh)' || datapointDetail.finalUnit === 'Percentage' && datapointDetail.signal == 'No') {
                        allDerivedDatapoints[foundResponseIndex].performanceResult = foundResponse.response;
                      }
                    }
                  }
                }
              }
            }
          }
          if (distinctYears.length - 1 == yearIndex) {
            let polarityTime2 = performance.now();
            timingDetails.push({ action: "polarity", timeTaken: polarityTime2 - polarityTime1 })
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
                  let overAll2 = performance.now();
                  console.log('overall time taken=', overAll2 - overAll1);
                  timingDetails.push({ action: "overall", timeTaken: overAll2 - overAll1 })
                  return res.status(200).json({ message: "Calculation completed successfuly!", timingDetails: timingDetails, derivedDatapoints: allDerivedDatapoints });
                }
              });
          }
        }
        return res.status(200).json({ message: "Retrieved successfully!", timingDetails: timingDetails, allDerivedDatapoints: allDerivedDatapoints })
      } else {
        return res.status(500).json({ message: "No year wise data present for this company!" })
      }
    })
}


export const jsonGeneration = async ({ user, params }, res, next) => {
  let requiredDataPoints = await Datapoints.find({ relevantForIndia: "Yes", standaloneOrMatrix: { "$ne": "Matrix" }, functionId: { "$ne": '609bcceb1d64cd01eeda092c' } }).distinct('_id')
  let companyID = params.companyId ? params.companyId : '';
  let responseList1 = [], responseList2 = [];
  let companyDetails = await Companies.findOne({ _id: companyID });
  let distinctYears = await StandaloneDatapoints.find({ companyId: companyID, status: true }).distinct('year');
  let jsonResponseObject = {
    companyName: companyDetails.companyName ? companyDetails.companyName : '',
    companyID: companyDetails.cin ? companyDetails.cin : '',
    NIC_CODE: companyDetails.nicCode ? companyDetails.nicCode : '',
    NIC_industry: companyDetails.nicIndustry ? companyDetails.nicIndustry : '',
    fiscalYear: [
      {
        year: distinctYears[0],
        Data: []
      },
      {
        year: distinctYears[1],
        Data: []
      }
    ]
  }
  for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
    await StandaloneDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: distinctYears[yearIndex], status: true, companyId: companyID })
      .populate('datapointId')
      .then((result) => {
        if (result.length > 0) {
          for (let index = 0; index < result.length; index++) {
            const element = result[index];
            if (yearIndex == 0) {
              let objectToPush = {
                Year: element.year,
                DPCode: element.datapointId.code,
                Response: element.response,
                PerformanceResponse: element.performanceResult
              }
              // responseList1 = _.concat(responseList1, result);
              jsonResponseObject.fiscalYear[0].Data.push(objectToPush);
            } else {
              let objectToPush = {
                Year: element.year,
                DPCode: element.datapointId.code,
                Response: element.response,
                PerformanceResponse: element.performanceResult
              }
              // responseList2 = _.concat(responseList2, result);
              jsonResponseObject.fiscalYear[1].Data.push(objectToPush);
            }
          }
        }
      });
    await DerivedDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: distinctYears[yearIndex], status: true, companyId: companyID })
      .populate('datapointId')
      .then((result) => {
        if (result.length > 0) {
          for (let index = 0; index < result.length; index++) {
            const element = result[index];
            if (yearIndex == 0) {
              let objectToPush = {
                Year: element.year,
                DPCode: element.datapointId.code,
                Response: element.response,
                PerformanceResponse: element.performanceResult
              }
              // responseList1 = _.concat(responseList1, result);
              jsonResponseObject.fiscalYear[0].Data.push(objectToPush);
            } else {
              let objectToPush = {
                Year: element.year,
                DPCode: element.datapointId.code,
                Response: element.response,
                PerformanceResponse: element.performanceResult
              }
              // responseList2 = _.concat(responseList2, result);
              jsonResponseObject.fiscalYear[1].Data.push(objectToPush);
            }
          }
        }
      });
    // await StandaloneDatapoints.aggregate([
    //   { "$match": { datapointId: { "$in": requiredDataPoints }, year: distinctYears[yearIndex], status: true, companyId:companyID} },
    //   {
    //     $lookup:
    //     {
    //       from: "datapoints",
    //       localField: "datapointId",
    //       foreignField: "_id",
    //       as: "dpCode"
    //     }
    //   },
    //   {
    //     $unwind: '$dpCode'
    //   },
    //   { $project: { dpCode: '$dpCode.code', year: 1, performanceResult: 1, response: 1, _id: 0 } }

    // ]).then((result) => {
    //   if (yearIndex == 0) {
    //     responseList1 = _.concat(responseList1, result);
    //   } else {
    //     responseList2 = _.concat(responseList2, result);
    //   }
    // });
    // await DerivedDatapoints.aggregate([
    //   { "$match": { datapointId: { "$in": requiredDataPoints }, year: distinctYears[yearIndex], status: true, companyId:companyID } },
    //   {
    //     $lookup:
    //     {
    //       from: "datapoints",
    //       localField: "datapointId",
    //       foreignField: "_id",
    //       as: "dpCode"
    //     }
    //   },
    //   {
    //     $unwind: '$dpCode'
    //   },
    //   { $project: { dpCode: '$dpCode.code', year: 1, performanceResult: 1, response: 1, _id: 0 } }

    // ]).then((result) => {
    //   if (yearIndex == 0) {
    //     responseList1 = _.concat(responseList1, result);
    //   } else {
    //     responseList2 = _.concat(responseList2, result);
    //   }
    // });


  }
  // [ year:20{} ,{}]

  return res.status(200).json({ message: "Success.", status: 200, data: jsonResponseObject })

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

async function matrixPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let matrixPercentageT1 = performance.now();
  let allDerivedDatapoints = [];
  let matrixPercentageRules = await Rules.find({ methodName: "MatrixPercentage" }).populate('datapointId');
  console.log(" matrixPercentageRules.length ", matrixPercentageRules.length)
  for (let i = 0; i < matrixPercentageRules.length; i++) {
    if (matrixPercentageRules[i].methodType != "" || matrixPercentageRules[i].methodType == "composite") {
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
              numeratorResponseValue = numeratorResponseValue.replace(/,/g, '');
              denominatorResponseValue = denominatorValues[j].response.toString();
              denominatorResponseValue = denominatorResponseValue.replace(/,/g, '');

              derivedResponse = (Number(numeratorResponseValue) / Number(denominatorResponseValue)) * 100;
            }
          }
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
    } else {
      let parameters = matrixPercentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
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
                numeratorResponseValue = numeratorResponseValue.replace(/,/g, '');
                denominatorResponseValue = denominatorValue.toString();
                denominatorResponseValue = denominatorResponseValue.replace(/,/g, '');

                derivedResponse = (Number(numeratorResponseValue) / Number(denominatorResponseValue)) * 100;
              }
            }

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
        } else {
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: matrixPercentageRules[i].datapointId.id,
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
    if (i == matrixPercentageRules.length - 1) {
      mergedDetails = _.concat(mergedDetails, allDerivedDatapoints)
      let matrixPercentageT2 = performance.now();
      console.log("MatrixPercentage", matrixPercentageT2 - matrixPercentageT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function addCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let addT1 = performance.now();
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
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year, status: true });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year, status: true });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
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
          }
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: derivedResponse } });
        }
      }
    }
    if (i == addRules.length - 1) {
      console.log('before add rule');
      let addT2 = performance.now();
      console.log("Add", addT2 - addT1);
      return true;
    }
  }
}

async function asCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let asT1 = performance.now();
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
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year, status: true });
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: numeratorValue.response } });
        } else {
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: ruleResponseObject.response } });
        }
      }
    }
    if (i == asRules.length - 1) {
      console.log('before As calculation');
      let asT2 = performance.now();
      console.log("As", asT2 - asT1);
      return true;
    }
  }
}

async function asPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let asPercentageT1 = performance.now();
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
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year, status: true });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year, status: true });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
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
            derivedResponse = (Number(numeratorValue.response) / Number(denominatorValue.response)) * 100;
          }
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: derivedResponse } });
        }
      }
    }
    if (i == asPercentageRules.length - 1) {
      console.log('before asPercentageRules');
      let asPercentageT2 = performance.now();
      console.log("AsPercentage", asPercentageT2 - asPercentageT1);
      return true;
    }
  }
}

async function asRatioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let asRatioT1 = performance.now();
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
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year, status: true });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year, status: true });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
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
            derivedResponse = Number(numeratorValue.response) / Number(denominatorValue.response)
          }
          await StandaloneDatapoints.updateOne({ _id: ruleResponseObject.id }, { $set: { response: derivedResponse } });
        }
      }
    }
    if (i == asRatioRules.length - 1) {
      console.log('before asRatioRules');
      let asRatioT2 = performance.now();
      console.log("AsRatio", asRatioT2 - asRatioT1);
      return true;
    }
  }
}

async function conditionCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let conditionT1 = performance.now();
  let asConditionRules = await Rules.find({ methodName: "Condition" }).populate('datapointId');
  console.log('condition Calculation');
  for (let i = 0; i < asConditionRules.length; i++) {
    let parameter = asConditionRules[i].parameter;
    let parameterDpObject = _.filter(allDatapointsList, { code: parameter });
    let parameterDpId = parameterDpObject[0] ? parameterDpObject[0].id : '';
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asConditionRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: parameterDpId, year: year, status: true });

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
    if (i == asConditionRules.length - 1) {
      console.log('before asConditionRules');
      let conditionT2 = performance.now();
      console.log("Condition", conditionT2 - conditionT1);
      return true;
    }
  }
}

async function minusCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let minusT1 = performance.now();
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
      for (let k = 0; k < distinctYears.length; k++) {
        const year = distinctYears[k];
        if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
          numeratorValues.push(object);
        } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
          denominatorValues.push(object);
        }
      }
    })
    if (numeratorValues.length > 0 && denominatorValues.length > 0 && numeratorValues.length == denominatorValues.length) {
      for (let j = 0; j < numeratorValues.length; j++) {
        let derivedResponse;
        if (denominatorValues[j].response == ' ' || denominatorValues[j].response == '' || denominatorValues[j].response == 'NA') {
          derivedResponse = 'NA';
        } else {
          let numeratorConvertedDate;
          let denominatorConvertedDate;
          try {
            numeratorConvertedDate = getJsDateFromExcel(numeratorValues[j].fiscalYearEndDate);
            denominatorConvertedDate = getJsDateFromExcel(denominatorValues[j].response);
          } catch (error) {
            let companyDetail = await Companies.findOne({ _id: companyId }).distinct('companyName');
            return { error: `${companyDetail ? companyDetail : 'a company, please check'}` };
            // return res.status(500).json({ message: `Found invalid date format in ${companyDetail ? companyDetail : 'a company'}, please correct and try again!` })
          }
          derivedResponse = moment([numeratorConvertedDate.getUTCFullYear(), numeratorConvertedDate.getUTCMonth(), numeratorConvertedDate.getUTCDate()])
            .diff(moment([denominatorConvertedDate.getUTCFullYear(), denominatorConvertedDate.getUTCMonth(), denominatorConvertedDate.getUTCDate()]), 'years', true)
        }
        let derivedDatapointsObject = {
          companyId: numeratorValues[j].companyId.id,
          datapointId: minusRules[i].datapointId.id,
          year: numeratorValues[j].year,
          response: derivedResponse ? derivedResponse.toString() : derivedResponse,
          memberName: numeratorValues[j].memberName ? numeratorValues[j].memberName.replace('\r\n', '') : '',
          memberStatus: true,
          status: true,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }
    }
    if (i == minusRules.length - 1) {
      mergedDetails = _.concat(mergedDetails, allDerivedDatapoints)
      let minusT2 = performance.now();
      console.log("Minus", minusT2 - minusT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function multiplyCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let multiplyT1 = performance.now();
  let asMultiplyRules = await Rules.find({ methodName: "Multiply" }).populate('datapointId');
  console.log('multiply Calculation');
  for (let i = 0; i < asMultiplyRules.length; i++) {
    let parameters = asMultiplyRules[i].parameter.split(",");;
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let ruleDatapointId = asMultiplyRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let firstParameterDpObject = _.filter(allDatapointsList, { code: parameters[0] });
          let firstParameterDpId = firstParameterDpObject[0] ? firstParameterDpObject[0].id : '';
          let secondParameterDpObject = _.filter(allDatapointsList, { code: parameters[1] });
          let secondParameterDpId = secondParameterDpObject[0] ? secondParameterDpObject[0].id : '';
          let thirdParameterDpObject = _.filter(allDatapointsList, { code: parameters[2] });
          let thirdParameterDpId = thirdParameterDpObject[0] ? thirdParameterDpObject[0].id : '';

          let firstParameterValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: firstParameterDpId, year: year, status: true });
          let secondParameterValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: secondParameterDpId, year: year, status: true });
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
              let thirdParameterValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: thirdParameterDpId, year: year, status: true });
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
    if (i == asMultiplyRules.length - 1) {
      console.log('before asMultiplyRules');
      let multiplyT2 = performance.now();
      console.log("Multiply", multiplyT2 - multiplyT1);
      return true;
    }
  }
}

async function percentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, allDerivedDatapointsList, userDetail) {
  let percentageT1 = performance.now();
  console.log('percentage Calculation');
  let allDerivedDatapoints = [];
  let percentageRules = await Rules.find({ methodName: "Percentage" }).populate('datapointId');
  for (let i = 0; i < percentageRules.length; i++) {
    if (percentageRules[i].methodType == "sum,sum") {
      let parameters = percentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
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
              let prevResponse = prev.replace(/,/g, '');
              let nextResponse = next.replace(/,/g, '');
              let sum = Number(prevResponse) + Number(nextResponse);
              return sum.toString();
            }
          });
        } else {
          numeratorSum = 0;
        }
        if (denominatorValues.length > 0) {
          denominatorSum = denominatorValues.reduce(function (prev, next) {
            if (prev && next) {
              let prevResponse = prev.replace(/,/g, '');
              let nextResponse = next.replace(/,/g, '');
              let sum = Number(prevResponse) + Number(nextResponse);
              return sum.toString();
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
          status: true,
          createdBy: userDetail

        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }

    } else {
      let parameters = percentageRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = [];
      let denominatorValues = [];
      for (let k = 0; k < distinctYears.length; k++) {
        const year = distinctYears[k];
        // stan
        let checkNumeratorId = await StandaloneDatapoints.findOne({ datapointId: numeratorDpId, year: year, companyId: companyId, status: true })
        let checkDenominatorId = await StandaloneDatapoints.findOne({ datapointId: denominatorDpId, year: year, companyId: companyId, status: true })
        if (checkNumeratorId) {
          numeratorValues.push(checkNumeratorId)
        } else {
          let checkNumeratorID = _.filter(allDerivedDatapointsList, { datapointId: numeratorDpId, year: year, companyId: companyId, status: true });
          numeratorValues.push(checkNumeratorID[0])
        }
        if (checkDenominatorId) {
          denominatorValues.push(checkDenominatorId)
        } else {
          let checkDenomiatorID = _.filter(allDerivedDatapointsList, { datapointId: denominatorDpId, year: year, companyId: companyId, status: true });
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
              derivedResponse = (Number(numeratorValues[j].response.replace(/,/g, '')) / Number(denominatorValues[j].response.replace(/,/g, ''))) * 100;
            }
          }
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: percentageRules[i].datapointId.id,
            year: numeratorValues[j].year,
            response: derivedResponse ? derivedResponse.toString() : derivedResponse,
            memberName: '',
            memberStatus: true,
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }

    if (i == percentageRules.length - 1) {
      let percentageT2 = performance.now();
      console.log("Percentage", percentageT2 - percentageT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function ratioAddCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let ratioAddT1 = performance.now();
  let allDerivedDatapoints = [];
  let ratioAddRules = await Rules.find({ methodName: "RatioADD" }).populate('datapointId');
  console.log('ratio add Calculation', ratioAddRules.length);
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
      let numeratorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year, status: true });
      let denominatorValue = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year, status: true });
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
      let addResponse, percentResponse;
      if (numeratorValue.response === " " || denominatorValue.response === " ") {
        addResponse = 'NA';
      } else {
        addResponse = Number(numeratorValue.response.replace(/,/g, '').trim()) + Number(denominatorValue.response.replace(/,/g, '').trim());
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
        response: percentResponse ? percentResponse.toString() : percentResponse,
        memberName: '',
        memberStatus: true,
        status: true,
        createdBy: userDetail
      }
      allDerivedDatapoints.push(derivedDatapointsObject);
    }
    if (i == ratioAddRules.length - 1) {
      console.log('before ratioAddRules');
      let ratioAddT2 = performance.now();
      console.log("RatioAdd", ratioAddT2 - ratioAddT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function sumCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let sumT1 = performance.now();
  let allDerivedDatapoints = [];
  let sumRules = await Rules.find({ methodName: "Sum" }).populate('datapointId');
  console.log('sum Calculation', sumRules.length);
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

      let ruleResponseObject = await StandaloneDatapoints.find({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
      let activeMembers = []
      _.filter(mergedDetails, (object, index) => {
        if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
          activeMembers.push(object.response ? object.response.toString() : '0')
        }
      });
      if (activeMembers.length > 0) {
        sumValue = activeMembers.reduce(function (prev, next) {
          if (prev && next) {
            let prevResponse = prev.replace(/,/g, '').trim();
            let nextResponse = next.replace(/,/g, '').trim();
            let sum = Number(prevResponse) + Number(nextResponse);
            return sum.toString();
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
        createdBy: userDetail
      }
      allDerivedDatapoints.push(derivedDatapointsObject);
    }
    if (i == sumRules.length - 1) {
      mergedDetails = _.concat(mergedDetails, allDerivedDatapoints)
      let sumT2 = performance.now();
      console.log("Sum", sumT2 - sumT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function yesNoCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let yesNoT1 = performance.now();
  let allDerivedDatapoints = [];
  let yesNoRules = await Rules.find({ methodName: "YesNo" }).populate('datapointId');
  console.log('yes no Calculation', yesNoRules.length);
  for (let i = 0; i < yesNoRules.length; i++) {
    let parameters = yesNoRules[i].parameter.split(",");
    for (let j = 0; j < distinctYears.length; j++) {
      const year = distinctYears[j];
      let sumValue;
      let ruleDatapointId = yesNoRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });

      let count = 0;
      for (let k = 0; k < parameters.length; k++) {
        let parameterDpObject = _.filter(allDatapointsList, { code: parameters[k] });
        let parameterDpId = parameterDpObject[0] ? parameterDpObject[0].id : '';
        let dpResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: parameterDpId, year: year, status: true });
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
    if (i == yesNoRules.length - 1) {
      console.log('before yesNoRules');
      let yesNoT2 = performance.now();
      console.log("YesNo", yesNoT2 - yesNoT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function countOfCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, derivedDatapointsList, userDetail) {
  let countOfT1 = performance.now();
  let allDerivedDatapoints = [];
  let countOfRules = await Rules.find({ methodName: "count of" }).populate('datapointId');
  console.log('count of Calculation', countOfRules.length);
  mergedDetails = _.concat(mergedDetails, derivedDatapointsList)
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
      let values = [];
      const year = distinctYears[j];
      let sumValue;
      let ruleDatapointId = countOfRules[i].datapointId.id;
      let ruleResponseObject = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: ruleDatapointId, year: year, status: true });
      if (countOfRules[i].methodType == 'composite') {
        let total = 0;
        let numeratorList = [], denominatorList = []
        if (parameters.length == 2) {
          _.filter(mergedDetails, (object, index) => {
            if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              numeratorList.push(object)
            } else if (object.datapointId.id == denominatorDpId && object.companyId.id == companyId && object.year == year && object.memberStatus == true) {
              denominatorList.push(object)
            }
          });
          if (numeratorList.length > 0 && denominatorList.length > 0) {
            let count = 0;
            numeratorList = numeratorList.filter(e => String(e.response).trim());
            denominatorList = denominatorList.filter(e => String(e.response).trim());
            if (countOfRules[i].criteria.toLowerCase() == 'y' || countOfRules[i].criteria.toLowerCase() == 'yes') {
              for (let ix = 0; ix < denominatorList.length; ix++) {
                for (let jx = 0; jx < numeratorList.length; jx++) {
                  if (denominatorList[ix].dirName == numeratorList[jx].dirName) {
                    if (denominatorList[ix].value && numeratorList[jx].value) {
                      if ((denominatorList[ix].value.toLowerCase() == 'yes' && numeratorList[jx].value.toLowerCase() == 'yes') || (denominatorList[ix].value.toLowerCase() == 'y' && numeratorList[jx].value.toLowerCase() == 'y')) {
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
        } else {

          for (let kx = 0; kx < parameters.length; kx++) {
            let parameterDatapointObject = await Datapoints.findOne({ code: parameters[kx].trim() });
            await StandaloneDatapoints.findOne({ companyId: companyId, year: year, datapointId: parameterDatapointObject.id, status: true }).populate('updatedBy').populate('keyIssueId').populate('functionId')
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
    if (i == countOfRules.length - 1) {
      let countOfT2 = performance.now();
      console.log("CountOf", countOfT2 - countOfT1);
      return { allDerivedDatapoints: allDerivedDatapoints };
    }
  }
}

async function ratioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, derivedDatapointsList, userDetail) {
  let ratioT1 = performance.now();
  let allDerivedDatapoints = [];
  let priorityDatapoints = ['MACR002', 'MACR007', 'MACR010'];
  let priorityDatapointObjects = await Datapoints.find({ code: { $in: priorityDatapoints } });
  let priorityDatapointObjectIds = [];
  if (priorityDatapointObjects.length > 0) {
    for (let index = 0; index < priorityDatapointObjects.length; index++) {
      priorityDatapointObjectIds.push(priorityDatapointObjects[index].id);
      let ratioRules = await Rules.findOne({ datapointId: priorityDatapointObjects[index].id ? priorityDatapointObjects[index].id : null });
      let parameters = ratioRules.parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      for (let j = 0; j < distinctYears.length; j++) {
        const year = distinctYears[j];
        let ruleDatapointId = priorityDatapointObjects[index].id;
        let numeratorResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: numeratorDpId, year: year, status: true });
        let denominatorResponse = await StandaloneDatapoints.findOne({ companyId: companyId, datapointId: denominatorDpId, year: year, status: true });
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
            derivedResponse = Number(numeratorResponse.response.replace(/,/g, '')) / Number(denominatorResponse.response.replace(/,/g, ''));
          }
          
          let derivedDatapointsObject = {
            companyId: companyId,
            datapointId: ruleDatapointId,
            year: year,
            response: derivedResponse ? derivedResponse.toString() : derivedResponse,
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
  let ratioRules = await Rules.find({ methodName: "Ratio", datapointId: { $nin: priorityDatapointObjectIds } }).populate('datapointId');
  console.log('ratio Calculation');
  mergedDetails = _.concat(mergedDetails, allDerivedDatapoints, derivedDatapointsList);
  if (ratioRules.length > 0) {
    for (let i = 0; i < ratioRules.length; i++) {
      let parameters = ratioRules[i].parameter.split(",");
      let numerator = parameters[0] ? parameters[0] : '';
      let denominator = parameters[1] ? parameters[1] : '';
      let numeratorDpObject = _.filter(allDatapointsList, { code: numerator });
      let denominatorDpObject = _.filter(allDatapointsList, { code: denominator });
      let numeratorDpId = numeratorDpObject[0] ? numeratorDpObject[0].id : '';
      let denominatorDpId = denominatorDpObject[0] ? denominatorDpObject[0].id : '';
      let numeratorValues = '', denominatorValues = '';
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
                  let prevResponse = prev.replace(/,/g, '');
                  let nextResponse = next.replace(/,/g, '');
                  let sum = Number(prevResponse) + Number(nextResponse);
                  return sum.toString();
                }
              });
            }
            let percentValue = 0.5 * Number(denominatorValues ? denominatorValues : '0');
            if (activeMemberValues.length < percentValue || denominatorValues == " ") {
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
              let resValue;
              if (sumValue === " " || sumValue == "" || sumValue == 'NA') {
                resValue = 'NA';
              } else if (sumValue == 0) {
                resValue = 0;
              } else if (activeMemberValues.length == 0) {
                resValue = 'NA';
              } else {
                let stringValue = sumValue ? sumValue.toString().replace(/,/g, '').trim() : 0;
                let divisor = Number(stringValue);
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
                numeratorValues = numeratorValues.replace(/,/g, '');
              }
              if (denominatorValues) {
                denominatorValues = denominatorValues.replace(/,/g, '');
              }
              derivedValue = (Number(numeratorValues) / Number(denominatorValues));
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
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
      if (i == ratioRules.length - 1) {
        console.log('before ratioRules');
        let ratioT2 = performance.now();
        console.log("MatrixPercentage", ratioT2 - ratioT1);
        return { allDerivedDatapoints: allDerivedDatapoints };
      }
    }
  }
}