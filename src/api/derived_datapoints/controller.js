import _ from 'lodash'
import moment from 'moment'
import {
  performance,
  PerformanceObserver
} from 'perf_hooks';
import {
  getJsDateFromExcel
} from 'excel-date-to-js'
import {
  success,
  notFound,
  authorOrAdmin
} from '../../services/response/'
import {
  DerivedDatapoints
} from '.'
import {
  PolarityRules
} from '../polarity_rules'
import {
  Rules
} from '../rules'
import {
  Datapoints
} from '../datapoints'
import {
  StandaloneDatapoints
} from '../standalone_datapoints'
import {
  BoardMembersMatrixDataPoints
} from '../boardMembersMatrixDataPoints'
import {
  KmpMatrixDataPoints
} from '../kmpMatrixDataPoints'
import {
  Companies
} from '../companies'
import { TaskAssignment } from "../taskAssignment";
import { Ztables } from "../ztables";
import { ProjectedValues } from "../projected_values";
import * as DerivedCalculationSample from '../derived_datapoints/derived_calculation';
import { CompaniesTasks } from '../companies_tasks'

export const create = ({
  user,
  bodymen: {
    body
  }
}, res, next) =>
  DerivedDatapoints.create({
    ...body,
    createdBy: user
  })
    .then((derivedDatapoints) => derivedDatapoints.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({
  querymen: {
    query,
    select,
    cursor
  }
}, res, next) =>
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

export const show = ({
  params
}, res, next) =>
  DerivedDatapoints.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('datapointId')
    .then(notFound(res))
    .then((derivedDatapoints) => derivedDatapoints ? derivedDatapoints.view() : null)
    .then(success(res))
    .catch(next)

export const calculateForACompany = async ({
  user,
  params
}, res, next) => {
  let timingDetails = [];
  let overAll1 = Date.now();
  const userDetail = user;
  const companyId = params.companyId ? params.companyId : null;

  await StandaloneDatapoints.find({
    companyId: companyId,
    status: true,
    isActive: true
  })
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

        let allDatapointsList = await Datapoints.find({
          status: true
        }).populate('updatedBy').populate('keyIssueId').populate('functionId');
        allStandaloneDetails = await StandaloneDatapoints.find({
          companyId: companyId,
          year: {
            "$in": distinctYears
          },
          isActive: true,
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId')

        allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          companyId: companyId,
          year: {
            "$in": distinctYears
          },
          memberStatus: true,
          isActive: true,
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')

        allKmpMatrixDetails = await KmpMatrixDataPoints.find({
          companyId: companyId,
          year: {
            "$in": distinctYears
          },
          memberStatus: true,
          isActive: true,
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
                  if (result.timingDetails) {
                    timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
                    }
                  }
                })
              break;
            case "AsPercentage":
              await asPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    console.log('result');
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
                    }
                  }
                })
              break;
            case "AsRatio":
              await asRatioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail)
                .then((result) => {
                  if (result) {
                    console.log('AsRatio result');
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
                    }
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
                    }
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
                    }
                  } else if (result.error) {
                    return res.status(500).json({
                      message: "Wrong date input format for " + result.error
                    })
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
                    }
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
                    if (result.timingDetails) {
                      timingDetails.push(result.timingDetails);
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
          year: {
            "$in": distinctYears
          },
          isActive: true,
          status: true
        })
          .populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId')
        for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
          let polarityTime1 = Date.now();
          const year = distinctYears[yearIndex];
          // for (let companyIndex = 0; companyIndex < nicCompaniesList.length; companyIndex++) {
          let dataPointsIdList = await Datapoints.find({
            dpType: {
              $nin: ["Board Matrix", "KMP Matrix"]
            },
            // standaloneOrMatrix: {
            //   "$ne": "Matrix"
            // },
            percentile: {
              "$ne": "Yes"
            },
            status: true
          })
          let polarityRulesList = await PolarityRules.find({}).populate('datapointId')

          for (let polarityRulesIndex = 0; polarityRulesIndex < polarityRulesList.length; polarityRulesIndex++) {
            let numericPolarityTime1 = Date.now();
            let datapointDetail = polarityRulesList[polarityRulesIndex].datapointId;
            let polarityRuleDetails = polarityRulesList[polarityRulesIndex];
            if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
              let foundResponseIndex = fullStandaloneDetails.findIndex((object, index) => object.companyId.id == companyId && object.datapointId.id == polarityRuleDetails.datapointId.id && object.year == year);
              if (foundResponseIndex > -1) {
                let foundResponse = fullStandaloneDetails[foundResponseIndex];
                if (foundResponse) {
                  if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA') {
                    await StandaloneDatapoints.updateOne({
                      _id: foundResponse.id
                    }, {
                      $set: {
                        response: 'NA',
                        performanceResult: 'NA'
                      }
                    });
                  } else {
                    if (Number(foundResponse.response).toFixed(4) >= Number(polarityRuleDetails.polarityValue)) {
                      if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                        await StandaloneDatapoints.updateOne({
                          _id: foundResponse.id
                        }, {
                          $set: {
                            performanceResult: 'Positive'
                          }
                        });
                      } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                        await StandaloneDatapoints.updateOne({
                          _id: foundResponse.id
                        }, {
                          $set: {
                            performanceResult: 'Negative'
                          }
                        });
                      }
                    } else if (Number(foundResponse.response).toFixed(4) <= Number(polarityRuleDetails.polarityValue)) {
                      if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                        await StandaloneDatapoints.updateOne({
                          _id: foundResponse.id
                        }, {
                          $set: {
                            performanceResult: 'Negative'
                          }
                        });
                      } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                        await StandaloneDatapoints.updateOne({
                          _id: foundResponse.id
                        }, {
                          $set: {
                            performanceResult: 'Positive'
                          }
                        });
                      }
                    } else {
                      if (polarityRuleDetails.condition == 'range') {
                        let param = polarityRuleDetails.polarityValue.split(',');
                        if (Number(foundResponse.response).toFixed(4) >= Number(param[0]) && Number(foundResponse.response) <= Number(param[1])) {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'Positive'
                            }
                          });
                        } else {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'Negative'
                            }
                          });
                        }
                      }
                    }
                  }
                }
              } else {
                if (polarityRuleDetails.datapointId.dpType != "Board Matrix" && polarityRuleDetails.datapointId.dpType != "KMP Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
                  return res.status(500).json({
                    message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year`
                  });
                }
                // if (polarityRuleDetails.datapointId.standaloneOrMatrix != "Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
                //   return res.status(500).json({
                //     message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year`
                //   });
                // }
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
                      } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                        allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                      }
                    } else if (Number(foundResponse.response) <= Number(polarityRuleDetails.polarityValue)) {
                      if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                        allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                      } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
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
                if (polarityRuleDetails.datapointId.dpType != "Board Matrix" && polarityRuleDetails.datapointId.dpType != "KMP Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
                  return res.status(500).json({
                    message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year`
                  });
                }
                // if (polarityRuleDetails.datapointId.standaloneOrMatrix != "Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
                //   return res.status(500).json({
                //     message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year`
                //   });
                // }
              }
            }
            if (polarityRulesList.length - 1 == polarityRulesIndex) {
              let numericPolarityTime2 = Date.now();
              timingDetails.push({
                action: "numeric polarity",
                timeTaken: numericPolarityTime2 - numericPolarityTime1
              })
            }
          }
          for (let dataPointIndex = 0; dataPointIndex < dataPointsIdList.length; dataPointIndex++) {
            let flipflopPolarityTime1 = Date.now();
            let isDpExistInPolarityRule = polarityRulesList.findIndex((object, index) => object.datapointId.id == dataPointsIdList[dataPointIndex].id);
            if (isDpExistInPolarityRule <= -1) {
              let datapointDetail = dataPointsIdList[dataPointIndex];
              if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
                let foundResponseIndex = fullStandaloneDetails.findIndex((object, index) => object.companyId.id == companyId && object.datapointId.id == dataPointsIdList[dataPointIndex].id && object.year == year);
                if (foundResponseIndex > -1) {
                  let foundResponse = fullStandaloneDetails[foundResponseIndex];
                  if (foundResponse) {
                    if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA' || foundResponse.response.toLowerCase() == 'nan') {
                      await StandaloneDatapoints.updateOne({
                        _id: foundResponse.id
                      }, {
                        $set: {
                          response: 'NA',
                          performanceResult: 'NA'
                        }
                      });
                    } else {
                      if (datapointDetail.code == 'BUSP009' || datapointDetail.code == 'BUSP008') {
                        if (foundResponse.response == 'No' || foundResponse.response == 'N' || foundResponse.response == 'NA') {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'Negative'
                            }
                          });
                        } else if (foundResponse.response == 'Yes' || foundResponse.response == 'Y') {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'Positive'
                            }
                          });
                        }
                      } else if (foundResponse.response == "Yes" || foundResponse.response == "Y" || foundResponse.response == "yes" || foundResponse.response == "y") {
                        if (datapointDetail.polarity == 'Positive') {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'Yes'
                            }
                          });
                        } else if (datapointDetail.polarity == 'Negative') {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'No'
                            }
                          });
                        } else {
                          if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                            await StandaloneDatapoints.updateOne({
                              _id: foundResponse.id
                            }, {
                              $set: {
                                performanceResult: foundResponse.response
                              }
                            });
                          }
                        }
                      } else if (foundResponse.response == "No" || foundResponse.response == "N" || foundResponse.response == "no" || foundResponse.response == "n") {
                        if (datapointDetail.polarity == 'Positive') {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'No'
                            }
                          });
                        } else if (datapointDetail.polarity == 'Negative') {
                          await StandaloneDatapoints.updateOne({
                            _id: foundResponse.id
                          }, {
                            $set: {
                              performanceResult: 'Yes'
                            }
                          });
                        } else {
                          if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                            await StandaloneDatapoints.updateOne({
                              _id: foundResponse.id
                            }, {
                              $set: {
                                performanceResult: foundResponse.response
                              }
                            });
                          }
                        }
                      } else if (datapointDetail.finalUnit === 'Number' || datapointDetail.finalUnit === 'Number (Tonne)' || datapointDetail.finalUnit === 'Number (tCO2e)' || datapointDetail.finalUnit.trim() === 'Currency' || datapointDetail.finalUnit === 'Days' || datapointDetail.finalUnit === 'Hours' || datapointDetail.finalUnit === 'Miles' || datapointDetail.finalUnit === 'Million Hours Worked' || datapointDetail.finalUnit === 'No/Low/Medium/High/Very High' || datapointDetail.finalUnit === 'Number (tCFCe)' || datapointDetail.finalUnit === 'Number (Cubic meter)' || datapointDetail.finalUnit === 'Number (KWh)' || datapointDetail.finalUnit === 'Percentage' && datapointDetail.signal == 'No') {
                        await StandaloneDatapoints.updateOne({
                          _id: foundResponse.id
                        }, {
                          $set: {
                            performanceResult: foundResponse.response
                          }
                        });
                      } else if (datapointDetail.finalUnit === 'Percentile' && datapointDetail.signal == 'Yes') {
                        await StandaloneDatapoints.updateOne({
                          _id: foundResponse.id
                        }, {
                          $set: {
                            performanceResult: foundResponse.response
                          }
                        });
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
                          if (foundResponse.response == 'No' || foundResponse.response == 'N' || foundResponse.response == 'NA') {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = 'Negative';
                          } else if (foundResponse.response == 'Yes' || foundResponse.response == 'Y') {
                            allDerivedDatapoints[foundResponseIndex].performanceResult = 'Positive';
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
            if (dataPointsIdList.length - 1 == dataPointIndex) {
              let flipflopPolarityTime2 = Date.now();
              timingDetails.push({
                action: "flipflop polarity",
                timeTaken: flipflopPolarityTime2 - flipflopPolarityTime1
              })
            }
          }
          if (distinctYears.length - 1 == yearIndex) {
            let polarityTime2 = Date.now();
            timingDetails.push({
              action: "over all polarity",
              timeTaken: polarityTime2 - polarityTime1
            })
            await DerivedDatapoints.updateMany({
              "companyId": companyId,
              "year": {
                $in: distinctYears
              }
            }, {
              $set: {
                status: false
              }
            }, {});

            await DerivedDatapoints.insertMany(allDerivedDatapoints)
              .then((err, result) => {
                if (err) {
                  console.log('error');
                } else {
                  //  console.log('result', result);
                  return res.status(200).json({
                    message: "Calculation completed successfuly!",
                    timingDetails: timingDetails,
                    derivedDatapoints: allDerivedDatapoints
                  });
                }
              });
            for (let dyIndex = 0; dyIndex < distinctYears.length; dyIndex++) {
              let companyTaskDetails = await CompaniesTasks.find({ companyId: companyId, year: distinctYears[dyIndex], status: true }).populate('taskId').populate('categoryId')
              for (let ctdIndex = 0; ctdIndex < companyTaskDetails.length; ctdIndex++) {
                let pillarWiseDatapoints = await Datapoints.find({ categoryId: companyTaskDetails[ctdIndex]['categoryId']['id'] })
                await DerivedDatapoints.updateMany({ datapointId: { $in: pillarWiseDatapoints }, companyId: companyId, year: distinctYears[dyIndex] }, { $set: { taskId: companyTaskDetails[ctdIndex]['taskId']['id'] } })
              }
            }
          }
        }
        console.log('overall time test1');
        let overAll2 = Date.now();
        console.log('overall time taken=', overAll2 - overAll1);
        console.log('overall time test');
        timingDetails.push({
          action: "overall",
          timeTaken: overAll2 - overAll1
        })
        console.log('timingDetails', timingDetails);
        return res.status(200).json({
          message: "Retrieved successfully!",
          timingDetails: timingDetails,
          allDerivedDatapoints: allDerivedDatapoints
        })
      } else {
        return res.status(500).json({
          message: "No year wise data present for this company!"
        })
      }
    })
}

export const jsonGeneration = async ({ user, params }, res, next) => {
  let requiredDataPoints = await Datapoints.find({
    isRequiredForJson: true,
    functionId: {
      "$ne": '609bcceb1d64cd01eeda092c'
    }
  }).distinct('_id')
  let companyID = params.companyId ? params.companyId : '';
  let companyDetails = await Companies.findOne({
    _id: companyID
  });
  let distinctYears = await StandaloneDatapoints.find({
    companyId: companyID,
    isActive: true,
    status: true
  }).distinct('year');
  let jsonResponseObject = {
    companyName: companyDetails.companyName ? companyDetails.companyName : '',
    companyID: companyDetails.cin ? companyDetails.cin : '',
    NIC_CODE: companyDetails.nicCode ? companyDetails.nicCode : '',
    NIC_industry: companyDetails.nicIndustry ? companyDetails.nicIndustry : '',
    fiscalYear: []
  }
  for (let distYearIndex = 0; distYearIndex < distinctYears.length; distYearIndex++) {
    let year = distinctYears[distYearIndex];
    jsonResponseObject.fiscalYear.push({ year: year, Data: [] });
  }
  for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
    await StandaloneDatapoints.find({
      datapointId: {
        "$in": requiredDataPoints
      },
      year: distinctYears[yearIndex],
      isActive: true,
      status: true,
      companyId: companyID
    })
      .populate('datapointId')
      .then((result) => {
        if (result.length > 0) {
          for (let index = 0; index < result.length; index++) {
            const element = result[index];
            let objectToPush = {
              Year: element.year,
              DPCode: element.datapointId.code,
              Response: element.response,
              PerformanceResponse: element.performanceResult
            }
            jsonResponseObject.fiscalYear[yearIndex].Data.push(objectToPush);
          }
        }
      });
    await DerivedDatapoints.find({
      datapointId: {
        "$in": requiredDataPoints
      },
      year: distinctYears[yearIndex],
      status: true,
      companyId: companyID
    })
      .populate('datapointId')
      .then((result) => {
        if (result.length > 0) {
          for (let index = 0; index < result.length; index++) {
            const element = result[index];
            let objectToPush = {
              Year: element.year,
              DPCode: element.datapointId.code,
              Response: element.response,
              PerformanceResponse: element.performanceResult
            }
            jsonResponseObject.fiscalYear[yearIndex].Data.push(objectToPush);
          }
        }
      });
  }

  return res.status(200).json({
    message: "Success.",
    status: 200,
    data: jsonResponseObject
  })

}

export const update = ({
  user,
  bodymen: {
    body
  },
  params
}, res, next) =>
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

export const destroy = ({
  user,
  params
}, res, next) =>
  DerivedDatapoints.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((derivedDatapoints) => derivedDatapoints ? derivedDatapoints.remove() : null)
    .then(success(res, 204))
    .catch(next)

async function matrixPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let matrixPercentageT1 = Date.now();
  let allDerivedDatapoints = [];
  let matrixPercentageRules = await Rules.find({
    methodName: "MatrixPercentage"
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
      let matrixPercentageT2 = Date.now();
      console.log("MatrixPercentage", matrixPercentageT2 - matrixPercentageT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "MatrixPercentage", timeTaken: matrixPercentageT2 - matrixPercentageT1 }
      };
    }
  }
}

async function addCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let addT1 = Date.now();
  let addRules = await Rules.find({
    methodName: "ADD"
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
        year: year,
        isActive: true,
        status: true
      });
      let denominatorValue = await StandaloneDatapoints.findOne({
        companyId: companyId,
        datapointId: denominatorDpId,
        year: year,
        isActive: true,
        status: true
      });
      let ruleResponseObject = await StandaloneDatapoints.findOne({
        companyId: companyId,
        datapointId: ruleDatapointId,
        year: year,
        isActive: true,
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
      console.log('before add rule');
      let addT2 = Date.now();
      console.log("Add", addT2 - addT1);
      return { status: true, timingDetails: { action: "Add", timeTaken: addT2 - addT1 } };
    }
  }
}

async function asCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let asT1 = Date.now();
  let asRules = await Rules.find({
    methodName: "As"
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
        year: year,
        isActive: true,
        status: true
      });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let numeratorValue = await StandaloneDatapoints.findOne({
            companyId: companyId,
            datapointId: numeratorDpId,
            year: year,
            isActive: true,
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
      console.log('before As calculation');
      let asT2 = Date.now();
      console.log("As", asT2 - asT1);
      return { status: true, timingDetails: { action: "As", timeTaken: asT2 - asT1 } };
    }
  }
}

async function asPercentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let asPercentageT1 = Date.now();
  let asPercentageRules = await Rules.find({
    methodName: "AsPercentage"
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
        year: year,
        isActive: true,
        status: true
      });
      let denominatorValue = await StandaloneDatapoints.findOne({
        companyId: companyId,
        datapointId: denominatorDpId,
        year: year,
        isActive: true,
        status: true
      });
      let ruleResponseObject = await StandaloneDatapoints.findOne({
        companyId: companyId,
        datapointId: ruleDatapointId,
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
      console.log('before asPercentageRules');
      let asPercentageT2 = Date.now();
      console.log("AsPercentage", asPercentageT2 - asPercentageT1);
      return { status: true, timingDetails: { action: "AsPercentage", timeTaken: asPercentageT2 - asPercentageT1 } };
    }
  }
}

async function asRatioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let asRatioT1 = Date.now();
  let asRatioRules = await Rules.find({
    methodName: "AsRatio"
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
        year: year,
        isActive: true,
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
            derivedResponse = Number(numeratorValue.response) / Number(denominatorValue.response)
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
      console.log('before asRatioRules');
      let asRatioT2 = Date.now();
      console.log("AsRatio", asRatioT2 - asRatioT1);
      return { status: true, timingDetails: { action: "AsRatio", timeTaken: asRatioT2 - asRatioT1 } };
    }
  }
}

async function conditionCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let conditionT1 = Date.now();
  let asConditionRules = await Rules.find({
    methodName: "Condition"
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
        year: year,
        isActive: true,
        status: true
      });
      if (ruleResponseObject) {
        if (ruleResponseObject.response == '' || ruleResponseObject.response == ' ') {
          //perform calc
          let numeratorValue = await StandaloneDatapoints.findOne({
            companyId: companyId,
            datapointId: parameterDpId,
            year: year,
            isActive: true,
            status: true
          });

          if (Number(numeratorValue.response).toFixed(4) >= 50) {
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
      console.log('before asConditionRules');
      let conditionT2 = Date.now();
      console.log("Condition", conditionT2 - conditionT1);
      return { status: true, timingDetails: { action: "Condition", timeTaken: conditionT2 - conditionT1 } };
    }
  }
}

async function minusCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let minusT1 = Date.now();
  let allDerivedDatapoints = [];
  console.log('minus Calculation');
  let minusRules = await Rules.find({
    methodName: "Minus"
  }).populate('datapointId');

  for (let i = 0; i < minusRules.length; i++) {
    let parameters = minusRules[i].parameter.split(",");
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
            let companyDetail = await Companies.findOne({
              _id: companyId
            }).distinct('companyName');
            return {
              error: `${companyDetail ? companyDetail : 'a company, please check'}`
            };
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
          memberName: numeratorValues[j].memberName ? numeratorValues[j].memberName.replace(/[\s\r\n]/g, '') : '',
          memberStatus: true,
          status: true,
          createdBy: userDetail
        }
        allDerivedDatapoints.push(derivedDatapointsObject);
      }
    }
    if (i == minusRules.length - 1) {
      mergedDetails = _.concat(mergedDetails, allDerivedDatapoints)
      let minusT2 = Date.now();
      console.log("Minus", minusT2 - minusT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "Minus", timeTaken: minusT2 - minusT1 }
      };
    }
  }
}

async function multiplyCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let multiplyT1 = Date.now();
  let asMultiplyRules = await Rules.find({
    methodName: "Multiply"
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
              numerator = Number(firstParameterValue.response.replace(/[^\d.]/g, '').trim()).toFixed(4);
            } else {
              numerator = Number(firstParameterValue.response).toFixed(4);
            }
            if (isNaN(secondParameterValue.response)) {
              denominator = Number(secondParameterValue.response.replace(/[^\d.]/g, '').trim()).toFixed(4);
            } else {
              denominator = Number(secondParameterValue.response).toFixed(4);
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
      console.log('before asMultiplyRules');
      let multiplyT2 = Date.now();
      console.log("Multiply", multiplyT2 - multiplyT1);
      return { status: true, timingDetails: { action: "Multiply", timeTaken: multiplyT2 - multiplyT1 } };
    }
  }
}

async function percentageCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, allDerivedDatapointsList, userDetail) {
  let percentageT1 = Date.now();
  console.log('percentage Calculation');
  let allDerivedDatapoints = [];
  let percentageRules = await Rules.find({
    methodName: "Percentage"
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
              let sum = Number(prevResponse) + Number(nextResponse);
              return sum.toFixed(4);
            }
          });
        } else {
          numeratorSum = 0;
        }
        if (denominatorValues.length > 0) {
          denominatorSum = denominatorValues.reduce(function (prev, next) {
            if (prev && next) {
              let prevResponse = prev.replace(/[^\d.]/g, '');
              let nextResponse = next.replace(/[^\d.]/g, '');
              let sum = Number(prevResponse) + Number(nextResponse);
              return sum.toFixed(4);
            }
          });
        } else {
          denominatorSum = 0;
        }
        derivedResponse = isNaN((numeratorSum / denominatorSum) * 100) ? 0 : (numeratorSum / denominatorSum) * 100;
        derivedResponse = Number(derivedResponse).toFixed(4);
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
          companyId: companyId,
          isActive: true,
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
              derivedResponse = (Number(numeratorValues[j].response.replace(/[^\d.]/g, '')) / Number(denominatorValues[j].response.replace(/[^\d.]/g, ''))) * 100;
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
            status: true,
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }

    if (i == percentageRules.length - 1) {
      let percentageT2 = Date.now();
      console.log("Percentage", percentageT2 - percentageT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "Percentage", timeTaken: percentageT2 - percentageT1 }
      };
    }
  }
}

async function ratioAddCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let ratioAddT1 = Date.now();
  let allDerivedDatapoints = [];
  let ratioAddRules = await Rules.find({
    methodName: "RatioADD"
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
        year: year,
        isActive: true,
        status: true
      });
      let denominatorValue = await StandaloneDatapoints.findOne({
        companyId: companyId,
        datapointId: denominatorDpId,
        year: year,
        isActive: true,
        status: true
      });
      let ruleResponseObject = await StandaloneDatapoints.findOne({
        companyId: companyId,
        datapointId: ruleDatapointId,
        year: year,
        isActive: true,
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
        status: true,
        createdBy: userDetail
      }
      allDerivedDatapoints.push(derivedDatapointsObject);
    }
    if (i == ratioAddRules.length - 1) {
      console.log('before ratioAddRules');
      let ratioAddT2 = Date.now();
      console.log("RatioAdd", ratioAddT2 - ratioAddT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "RatioADD", timeTaken: ratioAddT2 - ratioAddT1 }
      };
    }
  }
}

async function sumCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let sumT1 = Date.now();
  let allDerivedDatapoints = [];
  let sumRules = await Rules.find({
    methodName: "Sum"
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
        year: year,
        isActive: true,
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
        createdBy: userDetail
      }
      allDerivedDatapoints.push(derivedDatapointsObject);
    }
    if (i == sumRules.length - 1) {
      mergedDetails = _.concat(mergedDetails, allDerivedDatapoints)
      let sumT2 = Date.now();
      console.log("Sum", sumT2 - sumT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "Sum", timeTaken: sumT2 - sumT1 }
      };
    }
  }
}

async function yesNoCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, userDetail) {
  let yesNoT1 = Date.now();
  let allDerivedDatapoints = [];
  let yesNoRules = await Rules.find({
    methodName: "YesNo"
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
        year: year,
        isActive: true,
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
          isActive: true,
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
      let yesNoT2 = Date.now();
      console.log("YesNo", yesNoT2 - yesNoT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "YesNo", timeTaken: yesNoT2 - yesNoT1 }
      };
    }
  }
}

async function countOfCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, derivedDatapointsList, userDetail) {
  let countOfT1 = Date.now();
  let allDerivedDatapoints = [];
  let countOfRules = await Rules.find({
    methodName: "count of"
  }).populate('datapointId');
  console.log('count of Calculation', countOfRules.length);
  mergedDetails = _.concat(mergedDetails, derivedDatapointsList)
  for (let i = 0; i < countOfRules.length; i++) {
    if (mergedDetails[i].datapointId['code'] == 'BODR001') {
      console.log("");
    }
    if (mergedDetails[i].datapointId['code'] == 'BODR005') {
      console.log("");
    }
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
        year: year,
        isActive: true,
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
            let parameterDatapointObject = await Datapoints.findOne({
              code: parameters[kx].trim()
            });
            await StandaloneDatapoints.findOne({
              companyId: companyId,
              year: year,
              isActive: true,
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
              finalResponse = values.filter(item => Number(item).toFixed(4) >= Number(countOfRules[i].criteria)).length;
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
      let countOfT2 = Date.now();
      console.log("CountOf", countOfT2 - countOfT1);
      return {
        allDerivedDatapoints: allDerivedDatapoints,
        timingDetails: { action: "CountOf", timeTaken: countOfT2 - countOfT1 }
      };
    }
  }
}

async function ratioCalculation(companyId, mergedDetails, distinctYears, allDatapointsList, derivedDatapointsList, userDetail) {
  let ratioT1 = Date.now();
  let allDerivedDatapoints = [];
  let priorityDatapoints = ['MACR002', 'MACR007', 'MACR010'];
  let priorityDatapointObjects = await Datapoints.find({
    code: {
      $in: priorityDatapoints
    }
  });
  let priorityDatapointObjectIds = [];
  if (priorityDatapointObjects.length > 0) {
    for (let index = 0; index < priorityDatapointObjects.length; index++) {
      priorityDatapointObjectIds.push(priorityDatapointObjects[index].id);
      let ratioRules = await Rules.findOne({
        datapointId: priorityDatapointObjects[index].id ? priorityDatapointObjects[index].id : null
      });
      let parameters = ratioRules.parameter.split(",");
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
        let ruleDatapointId = priorityDatapointObjects[index].id;
        let numeratorResponse = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: numeratorDpId,
          year: year,
          isActive: true,
          status: true
        });
        let denominatorResponse = await StandaloneDatapoints.findOne({
          companyId: companyId,
          datapointId: denominatorDpId,
          year: year,
          isActive: true,
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
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
    }
  }
  let ratioRules = await Rules.find({
    methodName: "Ratio",
    datapointId: {
      $nin: priorityDatapointObjectIds
    }
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
          if (ratioRules[i].criteria == "greater or lesser") {
            let response = "", performanceResult = "";
            if (ratioRules[i].datapointId.code == "COSR005") {
              _.filter(mergedDetails, (object, index) => {
                if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year) {
                  numeratorValues = object.response;
                }
              });
              console.log("numeratorValues", numeratorValues);
              if (Number(numeratorValues) >= 1000) {
                response = "100";
                performanceResult = "100";
              } else if (Number(numeratorValues) >= 750 && Number(numeratorValues) <= 999) {
                response = "75";
                performanceResult = "75";
              } else if (Number(numeratorValues) >= 250 && Number(numeratorValues) <= 749) {
                response = "50";
                performanceResult = "50";
              } else if (Number(numeratorValues) >= 1 && Number(numeratorValues) <= 249) {
                response = "25";
                performanceResult = "25";
              } else if (Math.round(Number(numeratorValues)) == 0) {
                response = "0";
                performanceResult = "0";
              } else if (numeratorValues == "NA" || numeratorValues == "" || numeratorValues == null) {
                response = "NA";
                performanceResult = "NA";
              } else {
                response = "NA";
                performanceResult = "NA";
              }
            } else if (ratioRules[i].datapointId.code == "EMSR010") {
              _.filter(mergedDetails, (object, index) => {
                if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year) {
                  numeratorValues = object.response;
                }
              });
              if (Number(numeratorValues) >= 11) {
                response = "0";
                performanceResult = "0";
              } else if (Number(numeratorValues) >= 1 && Number(numeratorValues) <= 3) {
                response = "75";
                performanceResult = "75";
              } else if (Number(numeratorValues) >= 4 && Number(numeratorValues) <= 5) {
                response = "50";
                performanceResult = "50";
              } else if (Number(numeratorValues) >= 6 && Number(numeratorValues) <= 10) {
                response = "25";
                performanceResult = "25";
              } else if (Math.round(Number(numeratorValues)) == 0) {
                response = "100";
                performanceResult = "100";
              } else if (numeratorValues == "NA" || numeratorValues == "" || numeratorValues == null) {
                response = "NA";
                performanceResult = "NA";
              } else {
                response = "NA";
                performanceResult = "NA";
              }
            } else if (ratioRules[i].datapointId.code == "EMSR012") {
              _.filter(mergedDetails, (object, index) => {
                if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year) {
                  numeratorValues = object.response;
                }
              });
              if (Number(numeratorValues) >= 16) {
                response = "0";
                performanceResult = "0";
              } else if (Number(numeratorValues) >= 1 && Number(numeratorValues) <= 5) {
                response = "75";
                performanceResult = "75";
              } else if (Number(numeratorValues) >= 6 && Number(numeratorValues) <= 10) {
                response = "50";
                performanceResult = "50";
              } else if (Number(numeratorValues) >= 11 && Number(numeratorValues) <= 15) {
                response = "25";
                performanceResult = "25";
              } else if (Math.round(Number(numeratorValues)) == 0) {
                response = "100";
                performanceResult = "100";
              } else if (numeratorValues == "NA" || numeratorValues == "" || numeratorValues == null) {
                response = "NA";
                performanceResult = "NA";
              } else {
                response = "NA";
                performanceResult = "NA";
              }
            } else if (ratioRules[i].datapointId.code == "EMSR020") {
              _.filter(mergedDetails, (object, index) => {
                if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year) {
                  numeratorValues = object.response;
                }
              });
              if (Number(numeratorValues) >= 16) {
                response = "0";
                performanceResult = "0";
              } else if (Number(numeratorValues) >= 1 && Number(numeratorValues) <= 5) {
                response = "75";
                performanceResult = "75";
              } else if (Number(numeratorValues) >= 6 && Number(numeratorValues) <= 10) {
                response = "50";
                performanceResult = "50";
              } else if (Number(numeratorValues) >= 11 && Number(numeratorValues) <= 15) {
                response = "25";
                performanceResult = "25";
              } else if (Math.round(Number(numeratorValues)) == 0) {
                response = "100";
                performanceResult = "100";
              } else if (numeratorValues == "NA" || numeratorValues == "" || numeratorValues == null) {
                response = "NA";
                performanceResult = "NA";
              } else {
                response = "NA";
                performanceResult = "NA";
              }
            } else if (ratioRules[i].datapointId.code == "EQUR014") {
              _.filter(mergedDetails, (object, index) => {
                if (object.datapointId.id == numeratorDpId && object.companyId.id == companyId && object.year == year) {
                  numeratorValues = object.response;
                }
              });
              if (Number(numeratorValues) >= 16) {
                response = "0";
                performanceResult = "0";
              } else if (Number(numeratorValues) >= 1 && Number(numeratorValues) <= 5) {
                response = "75";
                performanceResult = "75";
              } else if (Number(numeratorValues) >= 6 && Number(numeratorValues) <= 10) {
                response = "50";
                performanceResult = "50";
              } else if (Number(numeratorValues) >= 11 && Number(numeratorValues) <= 15) {
                response = "25";
                performanceResult = "25";
              } else if (Math.round(Number(numeratorValues)) == 0) {
                response = "100";
                performanceResult = "100";
              } else if (numeratorValues == "NA" || numeratorValues == "" || numeratorValues == null) {
                response = "NA";
                performanceResult = "NA";
              } else {
                response = "NA";
                performanceResult = "NA";
              }
            }
            let derivedDatapointsObject = {
              companyId: companyId,
              datapointId: ruleDatapointId,
              year: year,
              response: response,
              performanceResult: performanceResult,
              memberName: '',
              memberStatus: true,
              status: true,
              createdBy: userDetail
            }
            allDerivedDatapoints.push(derivedDatapointsObject);
          } else {
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
            createdBy: userDetail
          }
          allDerivedDatapoints.push(derivedDatapointsObject);
        }
      }
      if (i == ratioRules.length - 1) {
        console.log('before ratioRules');
        let ratioT2 = Date.now();
        console.log("Ratio", ratioT2 - ratioT1);
        return {
          allDerivedDatapoints: allDerivedDatapoints,
          timingDetails: { action: "Ratio", timeTaken: ratioT2 - ratioT1 }
        };
      }
    }
  }
}

export const updateForAudr002 = async ({
  user,
  params
}, res, next) => {
  if (params.nic) {
    let nicCompaniesList = await Companies.find({
      nic: params.nic
    });
    if (nicCompaniesList.length > 0) {
      for (let nicIndex = 0; nicIndex < nicCompaniesList.length; nicIndex++) {
        const nicCompanyObject = nicCompaniesList[nicIndex];
        let distinctYears = await DerivedDatapoints.find({
          companyId: nicCompanyObject.id,
          status: true
        }).distinct('year');
        if (distinctYears.length > 0) {
          for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
            try {
              const year = distinctYears[yearIndex];
              let numeratorList = await BoardMembersMatrixDataPoints.find({
                companyId: nicCompanyObject.id,
                datapointId: "609d2c11be8b9d1b577cec91",
                year: year,
                isActive: true,
                status: true
              }); //AUDP001
              let denominatorList = await BoardMembersMatrixDataPoints.find({
                companyId: nicCompanyObject.id,
                datapointId: "609d2c22be8b9d1b577cecba",
                year: year,
                isActive: true,
                status: true
              }); //BOIP004     
              //find sum of BOIR021 in Boardmembermatrices
              let valuesToSum = await BoardMembersMatrixDataPoints.find({
                companyId: nicCompanyObject.id,
                datapointId: "609d2c2cbe8b9d1b577cecd3",
                isActive: true,
                year: year,
                status: true
              }); //AUDP001
              let percentageDenominator = await StandaloneDatapoints.findOne({
                companyId: nicCompanyObject.id,
                datapointId: "609d2c2cbe8b9d1b577cecd4",
                year: year,
                isActive: true,
                status: true
              }); //BOIR022
              let sumValue = 0;
              if (valuesToSum.length > 0) {
                for (let sumIndex = 0; sumIndex < valuesToSum.length; sumIndex++) {
                  const valueObject = valuesToSum[sumIndex];
                  sumValue += valueObject.response ? Number(valueObject.response.replace(/[^\d.]/g, '')).toFixed(4) : 0;
                }
              }
              if (sumValue && percentageDenominator) {
                let derivedResponse = '';
                let performanceResponse = '';
                if (sumValue == '0' || sumValue == 0) {
                  derivedResponse = '0';
                  performanceResponse = 'Positive';
                } else if (sumValue == ' ' || sumValue == '' || sumValue == 'NA') {
                  derivedResponse = 'NA';
                  performanceResponse = 'NA';
                } else {
                  if (percentageDenominator.response == ' ' || percentageDenominator.response == '' || percentageDenominator.response == 'NA' || percentageDenominator.response == '0' || percentageDenominator.response == 0) {
                    derivedResponse = 'NA';
                    performanceResponse = 'NA';
                  } else {
                    derivedResponse = (sumValue / Number(percentageDenominator.response.replace(/[^\d.]/g, '')).toFixed(4)) * 100;
                    if (Number(derivedResponse).toFixed(4) > 33) {
                      performanceResponse = 'Negative';
                    } else {
                      performanceResponse = 'Positive';
                    }
                  }
                }
                await DerivedDatapoints.updateOne({
                  companyId: nicCompanyObject.id,
                  datapointId: "609d2c28be8b9d1b577cecca",
                  year: year,
                  status: true
                }, {
                  $set: {
                    response: derivedResponse ? derivedResponse.toString() : 'NA',
                    performanceResult: performanceResponse ? performanceResponse.toString() : 'NA'
                  }
                })
              }
              //find BOIR022 in standalone
              let count = 0;
              if (numeratorList.length > 0 && denominatorList.length > 0) {
                if (numeratorList.length == denominatorList.length) {
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
                } else {
                  return res.status(400).json({
                    status: "400",
                    message: "AUDP001 and BOIP004 members list mistmatch!"
                  })
                }
              } else {
                return res.status(400).json({
                  status: "400",
                  message: "AUDP001 and BOIP004 members list mistmatch for company - " + nicCompanyObject.companyName + "!"
                })
              }
              await DerivedDatapoints.updateOne({
                companyId: nicCompanyObject.id,
                datapointId: "609d2c13be8b9d1b577cec94",
                year: year,
                status: true
              }, {
                $set: {
                  response: count ? count.toString() : '0',
                  performanceResult: count ? count.toString() : '0'
                }
              });
            } catch (error) {
              return res.status(400).json({
                status: "400",
                message: error.message ? error.message : "Failed to update AUDR002 value for company - " + nicCompanyObject.companyName + "!"
              })
            }
          }
        } else {
          return res.status(400).json({
            status: "400",
            message: "No year present for the company" + nicCompanyObject.companyName + ", please check!"
          })
        }
        if (nicCompaniesList.length - 1 == nicIndex) {
          return res.status(200).json({
            status: "200",
            message: "Values of AUDR002 updated for NIC-" + params.nic
          })
        }
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "NIC code invalid!"
      })
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "NIC code not present!"
    })
  }
}

export const derivedCalculation = async ({
  user,
  body
}, res, next) => {
  try {
    let taskDetailsObject = await TaskAssignment.findOne({ _id: body.taskId }).populate({
      path: "companyId",
      populate: {
        path: "clientTaxonomyId"
      }
    }).populate('categoryId');
    let allDerivedDatapoints = [];
    let year = taskDetailsObject.year.split(",");
    let allStandaloneDetails = await StandaloneDatapoints.find({
      companyId: taskDetailsObject.companyId.id,
      year: {
        "$in": year
      },
      isActive: true,
      status: true
    })
      .populate('createdBy')
      .populate('datapointId')
      .populate('companyId')

    let allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
      companyId: taskDetailsObject.companyId.id,
      year: {
        "$in": year
      },
      memberStatus: true,
      isActive: true,
      status: true
    })
      .populate('createdBy')
      .populate('datapointId')
      .populate('companyId')

    let allKmpMatrixDetails = await KmpMatrixDataPoints.find({
      companyId: taskDetailsObject.companyId.id,
      year: {
        "$in": year
      },
      memberStatus: true,
      isActive: true,
      status: true
    })
      .populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
    let allDatapointsList = await Datapoints.find({
      status: true
    }).populate('updatedBy').populate('keyIssueId').populate('functionId');

    // DerivedCalculationSample.addCalculation(taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id,user);
    let mergedDetails = _.concat(allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails);
    let rulesDetailsObject = await Rules.find({ categoryId: taskDetailsObject.categoryId }).distinct("methodName");
    let distinctRuleMethods = ["MatrixPercentage", "Minus", "Sum", "count of", "Ratio", "Percentage", "YesNo", "RatioADD", "As", "ADD", "AsPercentage", "AsRatio", "Condition", "Multiply"];
    for (let ruleMethodIndex = 0; ruleMethodIndex < distinctRuleMethods.length; ruleMethodIndex++) {
      if (rulesDetailsObject.includes(distinctRuleMethods[ruleMethodIndex])) {
        switch (distinctRuleMethods[ruleMethodIndex]) {
          case "ADD":
            await DerivedCalculationSample.addCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user);
            break;
          case "As":
            await DerivedCalculationSample.asCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user);
            break;
          case "AsPercentage":
            await DerivedCalculationSample.asPercentageCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user);
            break;
          case "AsRatio":
            await DerivedCalculationSample.asRatioCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
            break;
          case "Condition":
            await DerivedCalculationSample.conditionCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
            break;
          case "MatrixPercentage":
            await DerivedCalculationSample.matrixPercentageCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              })
            break;
          case "Minus":
            await DerivedCalculationSample.minusCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              })
            break;
          case "Multiply":
            await DerivedCalculationSample.multiplyCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
            break;
          case "Percentage":
            await DerivedCalculationSample.percentageCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, allDerivedDatapoints, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              })
            break;
          case "Ratio":
            await DerivedCalculationSample.ratioCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, allDerivedDatapoints, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              })
            break;
          case "RatioADD":
            await DerivedCalculationSample.ratioAddCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              })
          case "Sum":
            await DerivedCalculationSample.sumCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              })
            break;
          case "YesNo":
            await DerivedCalculationSample.yesNoCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              });
            break;
          case "count of":
            await DerivedCalculationSample.countOfCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, allDerivedDatapoints, taskDetailsObject.categoryId.id, user)
              .then((result) => {
                if (result) {
                  if (result.allDerivedDatapoints) {
                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                  }
                }
              });
            break;

          default:
            break;
        }
      }
      if (ruleMethodIndex == distinctRuleMethods.length - 1) {
        await DerivedDatapoints.updateMany({
          "companyId": taskDetailsObject.companyId.id,
          "year": {
            $in: year
          },
          taskId: body.taskId
        }, {
          $set: {
            status: false
          }
        }, {});
        await DerivedDatapoints.insertMany(allDerivedDatapoints)
          .then((result, err) => {
            if (err) {
              console.log('error', err);
            }
          });
      }
    }
    let dataPointsIdList = await Datapoints.find({ clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, dpType: { "$nin": ["Board Matrix", "KMP Matrix"] }, percentile: { "$ne": "Yes" }, status: true });
    let percentileDataPointsList = await Datapoints.find({ clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, percentile: "Yes", status: true });
    let allStandaloneDatapoints = await StandaloneDatapoints.find({
      "companyId": taskDetailsObject.companyId.id,
      isActive: true,
      "year": {
        $in: year
      }, status: true
    }).populate('datapointId').populate('companyId');
    let allDerivedDatapointsDetails = await DerivedDatapoints.find({
      "companyId": taskDetailsObject.companyId.id,
      "year": {
        $in: year
      }, status: true
    }).populate('datapointId').populate('companyId');
    let mergedDatapoints = _.concat(allStandaloneDatapoints, allDerivedDatapointsDetails);
    let polarityRulesList = await PolarityRules.find({ categoryId: taskDetailsObject.categoryId.id }).populate('datapointId')
    for (let yearIndex = 0; yearIndex < year.length; yearIndex++) {
      for (let polarityRulesIndex = 0; polarityRulesIndex < polarityRulesList.length; polarityRulesIndex++) {
        let performanceResult = "";
        let datapointDetail = polarityRulesList[polarityRulesIndex].datapointId;
        let polarityRuleDetails = polarityRulesList[polarityRulesIndex];
        let foundResponseIndex = mergedDatapoints.findIndex((object, index) => object.companyId.id == taskDetailsObject.companyId.id && object.datapointId.id == polarityRuleDetails.datapointId.id && object.year == year[yearIndex]);
        if (foundResponseIndex > -1) {
          let foundResponse = mergedDatapoints[foundResponseIndex];
          if (foundResponse) {
            if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA') {
              performanceResult = 'NA'
            } else {
              if (Number(foundResponse.response) >= Number(polarityRuleDetails.polarityValue)) {
                if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                  performanceResult = 'Positive';
                } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                  performanceResult = 'Negative';
                }
              } else if (Number(foundResponse.response) <= Number(polarityRuleDetails.polarityValue)) {
                if (polarityRuleDetails.condition == 'greater' || polarityRuleDetails.condition == 'atleast' || polarityRuleDetails.condition == 'lesserthan') {
                  performanceResult = 'Negative';
                } else if (polarityRuleDetails.condition == 'greaterthan' || polarityRuleDetails.condition == 'lesser') {
                  performanceResult = 'Positive';
                }
              } else {
                if (polarityRuleDetails.condition == 'range') {
                  let param = polarityRuleDetails.polarityValue.split(',');
                  if (Number(foundResponse.response) >= Number(param[0]) && Number(foundResponse.response) <= Number(param[1])) {
                    performanceResult = 'Positive';
                  } else {
                    performanceResult = 'Positive';
                  }
                }
              }
            }
          }
          if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
            await StandaloneDatapoints.updateOne({
              _id: foundResponse.id
            }, {
              $set: {
                performanceResult: performanceResult
              }
            });
          } else {
            await DerivedDatapoints.updateOne({
              _id: foundResponse.id
            }, {
              $set: {
                performanceResult: performanceResult
              }
            });
          }
        } else {
          if (polarityRuleDetails.datapointId.standaloneOrMatrix != "Matrix" && polarityRuleDetails.datapointId.percentile != "Yes") {
            return res.status(500).json({
              message: `No value present for ${polarityRuleDetails.datapointId.code} of ${year} year`
            });
          }
        }
      }
      for (let dataPointIndex = 0; dataPointIndex < dataPointsIdList.length; dataPointIndex++) {
        let performanceResult = "";
        let isDpExistInPolarityRule = polarityRulesList.findIndex((object, index) => object.datapointId.id == dataPointsIdList[dataPointIndex].id);
        if (isDpExistInPolarityRule <= -1) {
          let datapointDetail = dataPointsIdList[dataPointIndex];
          // if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
          let foundResponseIndex = mergedDatapoints.findIndex((object, index) => object.companyId.id == taskDetailsObject.companyId.id && object.datapointId.id == dataPointsIdList[dataPointIndex].id && object.year == year);
          if (foundResponseIndex > -1) {
            let foundResponse = mergedDatapoints[foundResponseIndex];
            if (foundResponse) {
              if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA' || foundResponse.response.toLowerCase() == 'nan') {
                performanceResult = 'NA';
              } else {
                if (datapointDetail.code == 'BUSP009' || datapointDetail.code == 'BUSP008') {
                  if (foundResponse.response == 'No' || foundResponse.response == 'N' || foundResponse.response == 'NA') {
                    performanceResult = 'Negative';
                  } else if (foundResponse.response == 'Yes' || foundResponse.response == 'Y') {
                    performanceResult = 'Positive';
                  }
                } else if (foundResponse.response == "Yes" || foundResponse.response == "Y" || foundResponse.response == "yes" || foundResponse.response == "y") {
                  if (datapointDetail.polarity == 'Positive') {
                    performanceResult = 'Yes'
                  } else if (datapointDetail.polarity == 'Negative') {
                    performanceResult = 'No'
                  } else {
                    if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                      performanceResult = foundResponse.response;
                    }
                  }
                } else if (foundResponse.response == "No" || foundResponse.response == "N" || foundResponse.response == "no" || foundResponse.response == "n") {
                  if (datapointDetail.polarity == 'Positive') {
                    performanceResult = 'No';
                  } else if (datapointDetail.polarity == 'Negative') {
                    performanceResult = 'Yes';
                  } else {
                    if (datapointDetail.polarity == 'Neutral' && datapointDetail.signal == "No") {
                      performanceResult = foundResponse.response
                    }
                  }
                } else if (datapointDetail.finalUnit === 'Number' || datapointDetail.finalUnit === 'Number (Tonne)' || datapointDetail.finalUnit === 'Number (tCO2e)' || datapointDetail.finalUnit.trim() === 'Currency' || datapointDetail.finalUnit === 'Days' || datapointDetail.finalUnit === 'Hours' || datapointDetail.finalUnit === 'Miles' || datapointDetail.finalUnit === 'Million Hours Worked' || datapointDetail.finalUnit === 'No/Low/Medium/High/Very High' || datapointDetail.finalUnit === 'Number (tCFCe)' || datapointDetail.finalUnit === 'Number (Cubic meter)' || datapointDetail.finalUnit === 'Number (KWh)' || datapointDetail.finalUnit === 'Percentage' && datapointDetail.signal == 'No') {
                  performanceResult = foundResponse.response
                } else if (datapointDetail.finalUnit === 'Percentile' && datapointDetail.signal == 'Yes'){
                  if (datapointDetail.code == 'EQUR013') {
                    let responseValue = Number(foundResponse.response);
                    if (responseValue > 0 && responseValue <= 0.39) {
                      performanceResult = "0";
                    }else if (responseValue >= 0.40 && responseValue <= 0.60) {
                      performanceResult = "25";
                    }else if (responseValue >= 0.61 && responseValue <= 0.75) {
                      performanceResult = "50"
                    }else if (responseValue >= 0.76 && responseValue <= 0.99) {
                      performanceResult = "75"
                    }else {
                      performanceResult = "1";
                    }
                  } else if (datapointDetail.code == 'WASR017') {
                    let performanceResponse;
                    if (foundResponse.response >= 100) {
                      performanceResponse = "100";
                    } else {
                      performanceResponse = foundResponse.response; 
                    }
                    await StandaloneDatapoints.updateOne({
                      _id: foundResponse.id
                    }, {
                      $set: {
                        performanceResult: performanceResponse
                      }
                    });
                   } else {
                    performanceResult = foundResponse.response;
                  }
                }
              }
            }
            if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
              await StandaloneDatapoints.updateOne({
                _id: foundResponse.id
              }, {
                $set: {
                  performanceResult: performanceResult
                }
              });
            } else {
              await DerivedDatapoints.updateOne({
                _id: foundResponse.id
              }, {
                $set: {
                  performanceResult: performanceResult
                }
              });
            }
          }
        }
      }
      let projectedValues = await ProjectedValues.find({ clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, nic: taskDetailsObject.companyId.nic, year: year[yearIndex] }).populate('datapointId');
      console.log("projectedValues.length", projectedValues.length);
      if (projectedValues.length > 0) {
        for (let pdpIndex = 0; pdpIndex < percentileDataPointsList.length; pdpIndex++) {
          try {
            let foundResponseIndex = mergedDatapoints.findIndex((object, index) => object.datapointId.id == percentileDataPointsList[pdpIndex].id && object.year == year[yearIndex]);
            let projectedValue = projectedValues.find(object => object.datapointId.id == percentileDataPointsList[pdpIndex].id);
            if (foundResponseIndex > -1) {
              let foundResponse = mergedDatapoints[foundResponseIndex];
              if (foundResponse) {
                if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == 'NA' || foundResponse.response.toLowerCase() == 'nan') {
                  if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                    await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                  } else {
                    await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                  }
                  console.log("Step1");
                } else {
                  let zscoreValue;
                  console.log("Step1", percentileDataPointsList[pdpIndex].code);
                  if (projectedValue.projectedStdDeviation == 'NA') {
                    await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                  } else {
                    console.log("percentileDataPointsList[pdpIndex].polarity\n\n\n\n", percentileDataPointsList[pdpIndex].code);
                    if (percentileDataPointsList[pdpIndex].polarity == 'Positive') {
                      zscoreValue = (Number(foundResponse.response) - Number(projectedValue.projectedAverage)) / Number(projectedValue.projectedStdDeviation);
                    } else if (percentileDataPointsList[pdpIndex].polarity == 'Negative') {
                      zscoreValue = (Number(projectedValue.projectedAverage) - Number(foundResponse.response)) / Number(projectedValue.projectedStdDeviation);
                    }
                    console.log("zscoreValue", zscoreValue);
                    if (zscoreValue > 4) {
                      if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '100' } });
                      } else {
                        await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '100' } });
                      }
                    } else if (zscoreValue < -4) {
                      if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '0' } });
                      } else {
                        await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '0' } });
                      }
                    } else if (zscoreValue == 'NA') {
                      if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                      } else {
                        await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                      }
                    } else {
                      //round of zscore value to two digit decimal value
                      console.log("zscoreValue", zscoreValue);
                      if (zscoreValue) {
                        let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                        var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                        let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                        let zValues = ztableValue.values[0].split(",");
                        let zScore = zValues[Number(lastDigit)]
                        let percentile = zScore * 100;
                        if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: percentile } });
                        } else {
                          await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: percentile } });
                        }
                      } else {
                        if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                          await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                        } else {
                          await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to get the response of ' + percentileDataPointsList[pdpIndex].code + ' for ' + year[yearIndex] + ' year' })
          }
        }
      } else {
        return res.status(500).json({ status: "500", message: `No projected Standard Deviation and Average values available for ${taskDetailsObject.companyId.clientTaxonomyId.taxonomyName} - ${taskDetailsObject.companyId.companyName} - ${year[yearIndex]}` });
      }
    }
    await TaskAssignment.findOneAndUpdate({ _id: body.taskId }, { isDerviedCalculationCompleted: true });
    return res.status(200).json({
      message: "Calculation completed successfuly!",
      derivedDatapoints: allDerivedDatapoints
    });
  } catch (error) {
    return next(error);
  }

}
