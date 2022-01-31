import _ from 'lodash';
import {
    DerivedDatapoints
} from '.';
import {
    PolarityRules
} from '../polarity_rules';
import {
    Rules
} from '../rules';
import {
    Datapoints
} from '../datapoints';
import {
    StandaloneDatapoints
} from '../standalone_datapoints';
import {
    BoardMembersMatrixDataPoints
} from '../boardMembersMatrixDataPoints';
import {
    KmpMatrixDataPoints
} from '../kmpMatrixDataPoints';
import { TaskAssignment } from "../taskAssignment";
import { Ztables } from "../ztables";
import { ProjectedValues } from "../projected_values";
import * as DerivedCalculationSample from '../derived_datapoints/derived_calculation';
import { rule_method_array, ADD, AS, AS_PERCENTAGE, AS_RATIO, CONDITION, MATRIX_PERCENTAGE, MINUS, MULTIPY, PERCENTAGE, RATIO, RATIO_ADD, SUM, YES_NO, COUNT_OF } from '../../constants/rule-methods';
import { NA, POSITIVE, NEGATIVE, NEUTRAL } from '../../constants/performance-result';
import { GREATER, GREATER_THAN, LESSER_THAN, LESSER, RANGE, ATLEAST } from '../../constants/polarity-condition';

const distinctRuleMethods = rule_method_array;


export const derivedCalculation = async ({
    user,
    body
}, res, next) => {
    try {
        const taskDetailsObject = await TaskAssignment.findOne({ _id: body.taskId })
            .populate({
                path: "companyId",
                populate: {
                    path: "clientTaxonomyId"
                }
            }).populate('categoryId');

        const year = taskDetailsObject.year.split(",");
        const query = {
            companyId: taskDetailsObject.companyId.id,
            year: {
                "$in": year
            },
            isActive: true,
            status: true
        }

        const [allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails, allDatapointsList, rulesDetailsObject, dataPointsIdList, percentileDataPointsList, allStandaloneDatapoints, allDerivedDatapointsDetails, polarityRulesList] = await Promise.all([
            StandaloneDatapoints.find(query)
                .populate('createdBy')
                .populate('datapointId')
                .populate('companyId'),
            BoardMembersMatrixDataPoints.find({
                ...query,
                memberStatus: true
            })
                .populate('createdBy')
                .populate('datapointId')
                .populate('companyId'),
            KmpMatrixDataPoints.find({
                ...query,
                memberStatus: true
            })
                .populate('createdBy')
                .populate('datapointId')
                .populate('companyId'),
            Datapoints.find({
                status: true
            }).populate('updatedBy').populate('keyIssueId').populate('functionId'),
            Rules.find({ categoryId: taskDetailsObject.categoryId }).distinct("methodName"),
            Datapoints.find({ clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, standaloneOrMatrix: { "$ne": "Matrix" }, percentile: { "$ne": "Yes" }, status: true }),
            Datapoints.find({ clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, percentile: "Yes", status: true }),
            StandaloneDatapoints.find(query).populate('datapointId').populate('companyId'),
            DerivedDatapoints.find({
                "companyId": taskDetailsObject.companyId.id,
                "year": {
                    $in: year
                }, status: true
            }).populate('datapointId').populate('companyId'),
            PolarityRules.find({ categoryId: taskDetailsObject.categoryId.id }).populate('datapointId')
        ]);

        const mergedDetails = _.concat(allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails);
        const mergedDatapoints = _.concat(allStandaloneDatapoints, allDerivedDatapointsDetails);

        // updation and insertion ...
        for (let yearIndex = 0; yearIndex < year.length; yearIndex++) {
            // TODO: Calculating Performace Response from polarity response.
            for (let polarityRulesIndex = 0; polarityRulesIndex < polarityRulesList.length; polarityRulesIndex++) {
                let performanceResult = "";
                let datapointDetail = polarityRulesList[polarityRulesIndex].datapointId;
                let polarityRuleDetails = polarityRulesList[polarityRulesIndex];

                let foundResponseIndex = mergedDatapoints.findIndex((object, index) =>
                    object.companyId.id == taskDetailsObject.companyId.id
                    && object.datapointId.id == polarityRuleDetails.datapointId.id
                    && object.year == year[yearIndex]);

                if (foundResponseIndex > -1) {
                    let foundResponse = mergedDatapoints[foundResponseIndex];
                    if (foundResponse) {
                        const emptyResponse = ['', ' ', NA];
                        if (emptyResponse.includes(foundResponse.response)) {
                            performanceResult = NA
                        } else {
                            if (Number(foundResponse.response) >= Number(polarityRuleDetails.polarityValue)) {
                                const positive_condition = [GREATER, ATLEAST, LESSER_THAN];
                                const negative_condition = [GREATER_THAN, LESSER];
                                if (positive_condition.includes(polarityRuleDetails.condition)) {
                                    performanceResult = POSITIVE;
                                } else if (negative_condition.includes(polarityRuleDetails.condition)) {
                                    performanceResult = NEGATIVE;
                                }
                            } else if (Number(foundResponse.response) <= Number(polarityRuleDetails.polarityValue)) {
                                const positive_condition = [GREATER_THAN, LESSER];
                                const negative_condition = [GREATER, ATLEAST, LESSER_THAN];
                                if (negative_condition.includes(polarityRuleDetails.condition)) {
                                    performanceResult = NEGATIVE;
                                } else if (positive_condition.includes(polarityRuleDetails.condition)) {
                                    performanceResult = POSITIVE;
                                }
                            } else {
                                if (polarityRuleDetails.condition == RANGE) {
                                    let param = polarityRuleDetails.polarityValue.split(',');
                                    if (Number(foundResponse.response) >= Number(param[0]) && Number(foundResponse.response) <= Number(param[1])) {
                                        performanceResult = POSITIVE;
                                    } else {
                                        performanceResult = POSITIVE; //! something needs to be negative. (Doubt).
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
                                performanceResult
                            }
                        });
                    } else {
                        await DerivedDatapoints.updateOne({
                            _id: foundResponse.id
                        }, {
                            $set: {
                                performanceResult
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
            // TODO: Calculating Performace Response from datapointsDetails response.
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
                            const emptyResponse = ['', ' ', 'NA', 'nan'];
                            if (emptyResponse.includes(foundResponse.response)) {
                                performanceResult = NA;
                            } else {
                                if (datapointDetail.code == 'BUSP009' || datapointDetail.code == 'BUSP008') {
                                    if (foundResponse.response == 'No' || foundResponse.response == 'N' || foundResponse.response == 'NA') {
                                        performanceResult = NEGATIVE;
                                    } else if (foundResponse.response == 'Yes' || foundResponse.response == 'Y') {
                                        performanceResult = POSITIVE;
                                    }
                                } else if (foundResponse.response == "Yes" || foundResponse.response == "Y" || foundResponse.response == "yes" || foundResponse.response == "y") {
                                    if (datapointDetail.polarity == POSITIVE) {
                                        performanceResult = 'Yes'
                                    } else if (datapointDetail.polarity == NEGATIVE) {
                                        performanceResult = 'No'
                                    } else {
                                        if (datapointDetail.polarity == NEUTRAL && datapointDetail.signal == "No") {
                                            performanceResult = foundResponse.response;
                                        }
                                    }
                                } else if (foundResponse.response == "No" || foundResponse.response == "N" || foundResponse.response == "no" || foundResponse.response == "n") {
                                    if (datapointDetail.polarity == POSITIVE) {
                                        performanceResult = 'No';
                                    } else if (datapointDetail.polarity == NEGATIVE) {
                                        performanceResult = 'Yes';
                                    } else {
                                        if (datapointDetail.polarity == NEUTRAL && datapointDetail.signal == "No") {
                                            performanceResult = foundResponse.response
                                        }
                                    }
                                } else if (datapointDetail.finalUnit === 'Number' || datapointDetail.finalUnit === 'Number (Tonne)' || datapointDetail.finalUnit === 'Number (tCO2e)' || datapointDetail.finalUnit.trim() === 'Currency' || datapointDetail.finalUnit === 'Days' || datapointDetail.finalUnit === 'Hours' || datapointDetail.finalUnit === 'Miles' || datapointDetail.finalUnit === 'Million Hours Worked' || datapointDetail.finalUnit === 'No/Low/Medium/High/Very High' || datapointDetail.finalUnit === 'Number (tCFCe)' || datapointDetail.finalUnit === 'Number (Cubic meter)' || datapointDetail.finalUnit === 'Number (KWh)' || datapointDetail.finalUnit === 'Percentage' && datapointDetail.signal == 'No') {
                                    performanceResult = foundResponse.response
                                } else if (datapointDetail.finalUnit === 'Percentile' && datapointDetail.signal == 'Yes') {
                                    performanceResult = foundResponse.response;
                                }
                            }
                        }
                        if (datapointDetail.dataCollection.toLowerCase() == "yes" || datapointDetail.dataCollection.toLowerCase() == "y") {
                            await StandaloneDatapoints.updateOne({
                                _id: foundResponse.id
                            }, {
                                $set: {
                                    performanceResult
                                }
                            });
                        } else {
                            await DerivedDatapoints.updateOne({
                                _id: foundResponse.id
                            }, {
                                $set: {
                                    performanceResult
                                }
                            });
                        }
                    }
                }
            }
            let projectedValues = await ProjectedValues.find({ clientTaxonomyId: taskDetailsObject.companyId.clientTaxonomyId.id, categoryId: taskDetailsObject.categoryId.id, nic: taskDetailsObject.companyId.nic, year: year[yearIndex] }).populate('datapointId');
            console.log("projectedValues.length", projectedValues.length);
            if (projectedValues.length > 0) {
                // TODO: Calculating Performace Response from percentile response.
                for (let pdpIndex = 0; pdpIndex < percentileDataPointsList.length; pdpIndex++) {
                    try {
                        let foundResponseIndex = mergedDatapoints.findIndex((object, index) =>
                            object.datapointId.id == percentileDataPointsList[pdpIndex].id
                            && object.year == year[yearIndex]);
                        let projectedValue = projectedValues.find(object => object.datapointId.id == percentileDataPointsList[pdpIndex].id);
                        if (foundResponseIndex > -1) {
                            let foundResponse = mergedDatapoints[foundResponseIndex];
                            if (foundResponse) {
                                if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response == NA || foundResponse.response.toLowerCase() == 'nan') {
                                    if (percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDataPointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
                                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                                    } else {
                                        await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                                    }
                                    console.log("Step1");
                                } else {
                                    let zscoreValue;
                                    console.log("Step1", percentileDataPointsList[pdpIndex].code);
                                    if (projectedValue.projectedStdDeviation == NA) {
                                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: NA } });
                                    } else {
                                        console.log("percentileDataPointsList[pdpIndex].polarity\n\n\n\n", percentileDataPointsList[pdpIndex].code);
                                        if (percentileDataPointsList[pdpIndex].polarity == POSITIVE) {
                                            zscoreValue = (Number(foundResponse.response) - Number(projectedValue.projectedAverage)) / Number(projectedValue.projectedStdDeviation);
                                        } else if (percentileDataPointsList[pdpIndex].polarity == NEGATIVE) {
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

        // Calculation based on rules.
        const allDerivedDatapoint = await calculate(rulesDetailsObject, body, taskDetailsObject, year, allDatapointsList, user, mergedDetails);

        await TaskAssignment.findOneAndUpdate({ _id: body.taskId }, { isDerviedCalculationCompleted: true });
        return res.status(200).json({
            message: "Calculation completed successfuly!",
            derivedDatapoints: allDerivedDatapoint
        });
    } catch (error) {
        return next(error);
    }

}

async function calculate(rulesDetailsObject, body, taskDetailsObject, year, allDatapointsList, user, mergedDetails) {
    let allDerivedDatapoints = [];
    for (let ruleMethodIndex = 0; ruleMethodIndex < distinctRuleMethods.length; ruleMethodIndex++) {
        if (rulesDetailsObject.includes(distinctRuleMethods[ruleMethodIndex])) {
            switch (distinctRuleMethods[ruleMethodIndex]) {
                case ADD:
                    await DerivedCalculationSample.addCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user);
                    break;
                case AS:
                    await DerivedCalculationSample.asCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user);
                    break;
                case AS_PERCENTAGE:
                    await DerivedCalculationSample.asPercentageCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user);
                    break;
                case AS_RATIO:
                    await DerivedCalculationSample.asRatioCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                    break;
                case CONDITION:
                    await DerivedCalculationSample.conditionCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                    break;
                case MATRIX_PERCENTAGE:
                    await DerivedCalculationSample.matrixPercentageCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        })
                    break;
                case MINUS:
                    await DerivedCalculationSample.minusCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        })
                    break;
                case MULTIPY:
                    await DerivedCalculationSample.multiplyCalculation(body.taskId, taskDetailsObject.companyId.id, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                    break;
                case PERCENTAGE:
                    await DerivedCalculationSample.percentageCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, allDerivedDatapoints, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        })
                    break;
                case RATIO:
                    await DerivedCalculationSample.ratioCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, allDerivedDatapoints, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        })
                    break;
                case RATIO_ADD:
                    await DerivedCalculationSample.ratioAddCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        })
                case SUM:
                    await DerivedCalculationSample.sumCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        })
                    break;
                case YES_NO:
                    await DerivedCalculationSample.yesNoCalculation(body.taskId, taskDetailsObject.companyId.id, mergedDetails, year, allDatapointsList, taskDetailsObject.categoryId.id, user)
                        .then((result) => {
                            if (result) {
                                if (result.allDerivedDatapoints) {
                                    allDerivedDatapoints = _.concat(allDerivedDatapoints, result.allDerivedDatapoints);
                                }
                            }
                        });
                    break;
                case COUNT_OF:
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

    return allDerivedDatapoints;
}