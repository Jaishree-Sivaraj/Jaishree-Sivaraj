import _ from 'lodash';
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { SELECT, STATIC } from '../../constants/dp-datatype';
import { Completed } from '../../constants/task-status';
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp';
import {
    getVariablesValues,
    getTaskDetailsFunctionIdPlaceValuesAndMeasureType,
    getErrorDetailsCompanySourceDetailsChildHeaders,
    getCompanySourceDetails,
    getSortedCurrentYearAndDisplayFields,
    getUomAndPlaceValues,
    getInputValues,
    getPrevAndNextDatapointsDetails,
    getTotalYearsForDataCollection,
    getClientTaxonomyAndDpTypeDetails
}
    from './datapoint-helper-function';
import { getS3ScreenShot, getSourceDetails, getChildDp, getDisplayFields, getS3RefScreenShot, getHeaders, getSortedYear } from './dp-details-functions';

let requiredFields = [
    'categoryCode',
    'categoryName',
    'code',
    'comments',
    'dataCollection',
    'dataCollectionGuide',
    'description',
    'dpType',
    'errorType',
    'finalUnit',
    'functionType',
    'hasError',
    'industryRelevant',
    'isPriority',
    'keyIssueCode',
    'keyIssueName',
    'name',
    'normalizedBy',
    'pageNumber',
    'optionalAnalystComment',
    'isRestated',
    'restatedForYear',
    'restatedInYear',
    'restatedValue',
    'percentile',
    'polarity',
    'publicationDate',
    'reference',
    'response',
    'screenShot',
    'signal',
    'sourceName',
    'isRequiredForJson',
    'textSnippet',
    'themeCode',
    'themeName',
    'unit',
    'url',
    'weighted',
    'year',
    'measureType'
];
export const repDatapointDetails = async (req, res, next) => {
    try {
        const { taskId, datapointId, memberType, memberName, role, year, memberId, keyIssueId, dataType } = req.body;

        const { taskDetails, functionId, measureTypes, allPlaceValues } = await getTaskDetailsFunctionIdPlaceValuesAndMeasureType(taskId);
        const fiscalYearEndMonth = taskDetails.companyId.fiscalYearEndMonth;
        const fiscalYearEndDate = taskDetails.companyId.fiscalYearEndDate;
        const { dpTypeValues, clienttaxonomyFields } = await getClientTaxonomyAndDpTypeDetails(functionId, taskDetails, datapointId);
        let { currentYear, displayFields } = getSortedCurrentYearAndDisplayFields(year, clienttaxonomyFields?.fields, taskDetails, dpTypeValues);
        const { errorDataDetails, companySourceDetails, chilDpHeaders } = await getErrorDetailsCompanySourceDetailsChildHeaders(taskDetails, datapointId, currentYear)
        const sourceTypeDetails = getCompanySourceDetails(companySourceDetails);
        const { uomValues, placeValues } = await getUomAndPlaceValues(measureTypes, dpTypeValues, allPlaceValues);
        let inputValues = [];
        if (dpTypeValues?.dataType == SELECT) {
            inputValues = getInputValues(dpTypeValues?.unit);
        }
        let isPriority = false;
        const { prevDatapoint, nextDatapoint } = await getPrevAndNextDatapointsDetails(functionId, memberType, taskDetails,
            true,
            keyIssueId, dataType, isPriority, memberId, memberName, datapointId, year);
        let { currentQuery, historyQuery, datapointsObject, sourceDetails } = getVariablesValues(taskDetails, currentYear, datapointId, taskId, dpTypeValues);
        let isSFDR = false;
        if (!clienttaxonomyFields?.isDerivedCalculationRequired) {
            isSFDR = true;
        }

        let s3DataScreenshot = [];
        let s3DataRefErrorScreenshot = [];
        let childDp = [];

        let memberCollectionYears = [];
        switch (memberType) {
            case STANDALONE:
                const [currentAllStandaloneDetails /*, historyAllStandaloneDetails*/] = await Promise.all([
                    StandaloneDatapoints.find(currentQuery).sort({ updatedAt: -1 }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    // StandaloneDatapoints.find(historyQuery).populate('createdBy')
                    //     .populate('datapointId')
                    //     .populate('companyId')
                    //     .populate('taskId')
                    //     .populate('uom')
                ]);

                // historyYear = _.orderBy(_.uniqBy(historyAllStandaloneDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: ''
                }
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    for (let currentIndex = 0; currentIndex < currentAllStandaloneDetails.length; currentIndex++) {
                        const object = currentAllStandaloneDetails[currentIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object?.screenShot),
                            getSourceDetails(object)
                        ]);
                        if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError) {
                            let errorDetailsObject = errorDataDetails.filter(obj =>
                                obj.datapointId == datapointId
                                && obj.year == currentYear[currentYearIndex]
                                && obj.taskId == taskId
                                && obj.raisedBy == role);
                            if (errorDetailsObject.length > 0) {
                                if (errorDetailsObject[0]?.raisedBy == role) {
                                    let comments = errorDetailsObject[0] ? errorDetailsObject[0]?.comments : '';
                                    let rejectComment = errorDetailsObject[0] ? errorDetailsObject[0]?.rejectComment : '';
                                    datapointsObject.comments.push(comments);
                                    datapointsObject.comments.push(rejectComment);
                                }
                            }

                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, false, uomValues, placeValues);
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep?.screenShot);
                            if (currentDatapointsObject?.error?.refData?.screenShot) {
                                currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            }
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, false, false);
                            currentDatapointsObject = getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, currentYear[currentYearIndex]);
                            datapointsObject.status = object.correctionStatus;
                            datapointsObject.currentData.push(currentDatapointsObject);
                        }
                    }
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        for (let currentIndex = 0; currentIndex < currentAllStandaloneDetails.length; currentIndex++) {
                            let object = currentAllStandaloneDetails[currentIndex];
                            [s3DataScreenshot, sourceDetails] = await Promise.all([
                                getS3ScreenShot(object?.screenShot),
                                getSourceDetails(object)
                            ]);
                            if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError == false) {
                                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId
                                    && obj.year == currentYear[currentYearIndex]
                                    && obj.taskId == taskId
                                    && obj.raisedBy == role);
                                if (errorDetailsObject.length > 0) {
                                    if (errorDetailsObject[0]?.raisedBy == role) {
                                        let comments = errorDetailsObject[0]?.comments;
                                        let rejectComment = errorDetailsObject[0]?.rejectComment;
                                        datapointsObject.comments.push(comments);
                                        datapointsObject.comments.push(rejectComment);
                                    }
                                }
                                currentDatapointsObject = currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, true, uomValues, placeValues);
                                currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                                datapointsObject.status = object.correctionStatus;
                                // !Fetching childDp
                                childDp = await getChildDp(datapointId, currentDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id);
                                currentDatapointsObject.childDp = childDp;

                                datapointsObject.currentData.push(currentDatapointsObject);
                            }
                        };
                    }


                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                }
                // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

                // for (let historicalYearIndex = 0; historicalYearIndex < totalHistories; historicalYearIndex++) {
                //     let historicalDatapointsObject = {};
                //     let sourceDetails = {
                //         url: '',
                //         sourceName: '',
                //         value: '',
                //         publicationDate: ''
                //     };
                //     for (let historyStandaloneIndex = 0; historyStandaloneIndex < historyAllStandaloneDetails.length; historyStandaloneIndex++) {
                //         let object = historyAllStandaloneDetails[historyStandaloneIndex];
                //         [s3DataScreenshot, sourceDetails] = await Promise.all([
                //             getS3ScreenShot(object.screenShot),
                //             getSourceDetails(object, sourceDetails)
                //         ]);
                //         if (object.year == historyYear[historicalYearIndex].year) {
                //             historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, object.year, uomValues, placeValues)
                //             historicalDatapointsObject = {
                //                 ...historicalDatapointsObject,
                //                 standaradDeviation: object.standaradDeviation,
                //                 average: object.average
                //             };
                //             historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllStandaloneDetails, historyYear[historicalYearIndex].year, historicalDatapointsObject, false, false);
                //             childDp = await getChildDp(datapointId, historicalDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id);
                //             historicalDatapointsObject.childDp = childDp;
                //             datapointsObject.historicalData.push(historicalDatapointsObject);
                //         }
                //     }
                // }
                return res.status(200).send({
                    status: '200',
                    message: 'Data collection dp codes retrieved successfully!',
                    response: {

                        prevDatapoint,
                        nextDatapoint,
                        chilDpHeaders,
                        dpCodeData: datapointsObject
                    },


                });
            case BOARD_MATRIX:
                const [currentAllBoardMemberMatrixDetails, memberDetails] = await Promise.all([
                    BoardMembersMatrixDataPoints.find({
                        ...currentQuery,
                        memberName: { '$regex': memberName, '$options': 'i' }
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    BoardMembers.findOne({
                        BOSP004: memberName,
                        status: true
                    })
                ]);

                memberCollectionYears = getTotalYearsForDataCollection(currentYear, memberDetails, fiscalYearEndMonth, fiscalYearEndDate);
                // historyYear = _.orderBy(_.uniqBy(historyAllBoardMemberMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: ''
                }

                // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
                for (let currentYearIndex = 0; currentYearIndex < memberCollectionYears.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    for (let currentIndex = 0; currentIndex < currentAllBoardMemberMatrixDetails.length; currentIndex++) {
                        let object = currentAllBoardMemberMatrixDetails[currentIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object?.screenShot),
                            getSourceDetails(object)
                        ]);
                        if (object.datapointId.id == datapointId && object.year == memberCollectionYears[currentYearIndex] && object.hasError == true) {
                            const errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId
                                && obj.year == memberCollectionYears[currentYearIndex]
                                && obj.taskId == taskId
                                && obj.raisedBy == role)
                            if (errorDetailsObject.length !== 0) {
                                if (errorDetailsObject[0]?.raisedBy == role) {
                                    let comments = errorDetailsObject.length !== 0 ? errorDetailsObject[0]?.comments : '';
                                    let rejectComment = errorDetailsObject.length !== 0 ? errorDetailsObject[0]?.rejectComment : '';
                                    datapointsObject.comments.push(comments);
                                    datapointsObject.comments.push(rejectComment);
                                }
                            }
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, memberCollectionYears[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, false, uomValues, placeValues);
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject?.length, errorDetailsObject[0]?.errorCaughtByRep?.screenShot);
                            if (currentDatapointsObject?.error?.refData?.screenShot) {
                                currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            }
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, memberCollectionYears[currentYearIndex], currentDatapointsObject, false, false)
                            currentDatapointsObject = getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, memberCollectionYears[currentYearIndex])
                            datapointsObject.status = object.correctionStatus;
                            // !Fetching Child Dp
                            childDp = await getChildDp(datapointId, currentDatapointsObject?.fiscalYear, taskId, taskDetails?.companyId?.id);
                            currentDatapointsObject.childDp = childDp;
                            datapointsObject.currentData.push(currentDatapointsObject);
                        }
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        for (let currentIndex = 0; currentIndex < currentAllBoardMemberMatrixDetails.length; currentIndex++) {
                            const object = currentAllBoardMemberMatrixDetails[currentIndex];
                            [s3DataScreenshot, sourceDetails] = await Promise.all([
                                getS3ScreenShot(object?.screenShot),
                                getSourceDetails(object)
                            ]);
                            if (object.datapointId.id == datapointId && object.year == memberCollectionYears[currentYearIndex] && object.hasError == false) {
                                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId && obj.year == memberCollectionYears[currentYearIndex] && obj.taskId == taskId && obj.raisedBy == role)
                                if (errorDetailsObject.length !== 0) {
                                    if (errorDetailsObject[0]?.raisedBy == role) {
                                        let comments = errorDetailsObject.length !== 0 ? errorDetailsObject[0]?.comments : '';
                                        let rejectComment = errorDetailsObject.length !== 0 ? errorDetailsObject[0]?.rejectComment : '';
                                        datapointsObject.comments.push(comments);
                                        datapointsObject.comments.push(rejectComment);
                                    }
                                }
                                currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, memberCollectionYears[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, true, uomValues, placeValues);
                                currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, memberCollectionYears[currentYearIndex], currentDatapointsObject, false, true)

                                // !Fetching Child Dp
                                childDp = await getChildDp(datapointId, currentDatapointsObject?.fiscalYear, taskId, taskDetails?.companyId?.id);
                                currentDatapointsObject.childDp = childDp;

                                datapointsObject.currentData.push(currentDatapointsObject);
                                datapointsObject.status = object.correctionStatus;
                            }
                        };
                    }

                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                }
                // for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                //     let historicalDatapointsObject = {};
                //     let sourceDetails = {
                //         url: '',
                //         sourceName: '',
                //         value: '',
                //         publicationDate: ''
                //     };
                //     for (let historyAllBoardMemberIndex = 0; historyAllBoardMemberIndex < historyAllBoardMemberMatrixDetails.length; historyAllBoardMemberIndex++) {
                //         let object = historyAllBoardMemberMatrixDetails[historyAllBoardMemberIndex];
                //         [s3DataScreenshot, sourceDetails] = await Promise.all([
                //             getS3ScreenShot(object.screenShot),
                //             getSourceDetails(object, sourceDetails)
                //         ]);
                //         if (object.year == historyYear[hitoryYearIndex].year
                //             && object.memberName.toLowerCase() == memberName.toLowerCase()) {
                //             historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues);
                //             historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllBoardMemberMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
                //             // !Fetching Child Dp
                //             childDp = await getChildDp(datapointId, historicalDatapointsObject?.fiscalYear, taskId, taskDetails?.companyId?.id);
                //             historicalDatapointsObject.childDp = childDp;
                //             datapointsObject.historicalData.push(historicalDatapointsObject);
                //         }

                //     }
                // }
                return res.status(200).send({
                    status: '200',
                    message: 'Data collection dp codes retrieved successfully!',
                    response: {

                        prevDatapoint,
                        nextDatapoint,
                        chilDpHeaders,
                        dpCodeData: datapointsObject,
                    }

                });
            case KMP_MATRIX:
                const [currentAllKmpMatrixDetails, kmpMemberDetails] = await Promise.all([
                    KmpMatrixDataPoints.find({
                        ...currentQuery, memberName: { '$regex': memberName, '$options': 'i' },
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    Kmp.findOne({
                        MASP003: memberName,
                        status: true
                    })
                ]);

                memberCollectionYears = getTotalYearsForDataCollection(currentYear, kmpMemberDetails, fiscalYearEndMonth, fiscalYearEndDate);

                // historyYear = _.orderBy(_.uniqBy(historyAllKmpMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: 'Yet to Start'
                }
                // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
                const kmpMemberStartDate = new Date(kmpMemberDetails?.startDate).getFullYear();
                currentYear.map(year => {
                    if (year.includes(kmpMemberStartDate)) {
                        memberCollectionYears.push(year);
                    }
                });
                for (let currentYearIndex = 0; currentYearIndex < memberCollectionYears.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    for (let currentIndex = 0; currentIndex < currentAllKmpMatrixDetails.length; currentIndex++) {
                        let object = currentAllKmpMatrixDetails[currentIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object?.screenShot),
                            getSourceDetails(object)
                        ]);
                        let errorDetailsObject;
                        if (object.datapointId.id == datapointId && object.year == memberCollectionYears[currentYearIndex] && object.hasError == true) {
                            errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId && obj.year == memberCollectionYears[currentYearIndex] && obj.taskId == taskId && obj.raisedBy == role)
                            if (errorDetailsObject.length !== 0) {
                                if (errorDetailsObject[0]?.raisedBy == role) {
                                    let comments = errorDetailsObject[0] ? errorDetailsObject[0]?.comments : '';
                                    let rejectComment = errorDetailsObject[0] ? errorDetailsObject[0]?.rejectComment : '';
                                    datapointsObject.comments.push(comments);
                                    datapointsObject.comments.push(rejectComment);
                                }

                            }
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, memberCollectionYears[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, false, uomValues, placeValues);
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep?.screenShot);
                            if (currentDatapointsObject?.error?.refData?.screenShot) {
                                currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            }
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, memberCollectionYears[currentYearIndex], currentDatapointsObject, false, false);
                            currentDatapointsObject = getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, memberCollectionYears[currentYearIndex])
                            datapointsObject.status = object.correctionStatus;
                            // !Fetching Child Dp
                            childDp = await getChildDp(datapointId, currentDatapointsObject?.fiscalYear, taskId, taskDetails?.companyId?.id);
                            currentDatapointsObject.childDp = childDp;
                            datapointsObject.currentData.push(currentDatapointsObject);
                        }
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        for (let currentIndex = 0; currentIndex < currentAllKmpMatrixDetails.length; currentIndex++) {
                            const object = currentAllKmpMatrixDetails[currentIndex];
                            [s3DataScreenshot, sourceDetails] = await Promise.all([
                                getS3ScreenShot(object?.screenShot),
                                getSourceDetails(object)
                            ]);
                            if (object.datapointId.id == datapointId && object.year == memberCollectionYears[currentYearIndex] && object.hasError == false) {
                                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId && obj.year == memberCollectionYears[currentYearIndex] && obj.taskId == taskId && obj.raisedBy == role)
                                if (errorDetailsObject.length !== 0) {
                                    if (errorDetailsObject[0]?.raisedBy == role) {
                                        let comments = errorDetailsObject[0] ? errorDetailsObject[0]?.comments : '';
                                        let rejectComment = errorDetailsObject[0] ? errorDetailsObject[0]?.rejectComment : '';
                                        datapointsObject.comments.push(comments);
                                        datapointsObject.comments.push(rejectComment);
                                    }
                                }
                                currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, memberCollectionYears[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, true, uomValues, placeValues);
                                currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, memberCollectionYears[currentYearIndex], currentDatapointsObject, false, true);

                                datapointsObject.status = object.correctionStatus;
                                //! Fetching Child Dp
                                childDp = await getChildDp(datapointId, currentDatapointsObject?.fiscalYear, taskId, taskDetails?.companyId?.id);
                                currentDatapointsObject.childDp = childDp;
                                datapointsObject.currentData.push(currentDatapointsObject);
                            }
                        };
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    // for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                    //     let sourceDetails = {
                    //         url: '',
                    //         sourceName: '',
                    //         value: '',
                    //         publicationDate: ''
                    //     };
                    //     let historicalDatapointsObject = {};
                    //     for (let historyAllKMPMemberIndex = 0; historyAllKMPMemberIndex < historyAllKmpMatrixDetails.length; historyAllKMPMemberIndex++) {
                    //         const object = historyAllKmpMatrixDetails[historyAllKMPMemberIndex];
                    //         [s3DataScreenshot, sourceDetails] = await Promise.all([
                    //             getS3ScreenShot(object.screenShot),
                    //             getSourceDetails(object, sourceDetails)
                    //         ]);
                    //         if (object.datapointId.id == dpTypeValues.id && object.year == historyYear[hitoryYearIndex].year && object.memberName.toLowerCase() == memberName.toLowerCase()) {
                    //             historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues);
                    //             historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllKmpMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false)
                    //             //! Fetching Child Dp
                    //             childDp = await getChildDp(datapointId, currentDatapointsObject?.fiscalYear, taskId, taskDetails?.companyId?.id);
                    //             currentDatapointsObject.childDp = childDp;
                    //             datapointsObject.currentData.push(currentDatapointsObject);
                    //             datapointsObject.historicalData.push(historicalDatapointsObject);
                    //         }
                    //     }
                    // }
                }
                return res.status(200).send({
                    status: '200',
                    message: 'Data collection dp codes retrieved successfully!',
                    response: {

                        prevDatapoint,
                        nextDatapoint,
                        chilDpHeaders,
                        dpCodeData: datapointsObject,
                    }
                });
            default:
                return res.status(500).json({
                    message: 'Incorrect memberType'
                });

        }
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

function getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear, inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, isEmpty, uomValues, placeValues) {
    const error = isEmpty ? {
        hasError: object?.hasError,
        refData: {
            description: dpTypeValues?.description,
            dataType: dpTypeValues?.dataType,
            subDataType: {
                measure: dpTypeValues?.measureType,
                placeValues: placeValues,
                selectedPlaceValue: null,
                uoms: uomValues,
                selectedUom: null
            },
            textSnippet: '',
            pageNo: '', // Restated TODO
            optionalAnalystComment: '',
            isRestated: '',
            restatedForYear: '',
            restatedInYear: '',
            restatedValue: '',
            screenShot: null,
            response: '',
            source: null,
            additionalDetails: []
        },
        comment: '',
        errorStatus: object?.correctionStatus
    } : {
        hasError: object?.hasError,
        refData: {
            description: dpTypeValues?.description,
            response: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.response : '',
            screenShot: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.screenShot : [],
            dataType: dpTypeValues?.dataType,
            subDataType: {
                measure: dpTypeValues?.measureType,
                placeValues: placeValues,
                selectedPlaceValue: errorDetailsObject[0]?.errorCaughtByRep?.placeValue ? { value: errorDetailsObject[0]?.errorCaughtByRep?.placeValue, label: errorDetailsObject[0]?.errorCaughtByRep?.placeValue } : null,
                uoms: uomValues,
                selectedUom: errorDetailsObject[0]?.errorCaughtByRep?.uom ? { value: errorDetailsObject[0]?.errorCaughtByRep?.uom?.id, label: errorDetailsObject[0]?.errorCaughtByRep?.uom?.uomName } : null
            },
            fiscalYear: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.fiscalYear : '',
            textSnippet: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.textSnippet : '',
            pageNo: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.pageNo : '',
            optionalAnalystComment: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.optionalAnalystComment : '',
            isRestated: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.isRestated : '',
            restatedForYear: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.restatedForYear : '',
            restatedInYear: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.restatedInYear : '',
            restatedValue: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.restatedValue : '',
            source: errorDetailsObject?.length !== 0 ? errorDetailsObject[0]?.errorCaughtByRep?.source : '',
            additionalDetails: []
        },
        comment: '',
        errorStatus: object?.correctionStatus
    }

    const data = {
        status: Completed,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        fiscalYear: currentYear,
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        subDataType: {
            measure: dpTypeValues?.measureType,
            placeValues: placeValues,
            selectedPlaceValue: object?.placeValue ? { value: object?.placeValue, label: object?.placeValue } : null,
            uoms: uomValues,
            selectedUom: object?.uom ? { value: object?.uom?.id, label: object?.uom?.uomName } : null
        },
        inputValues: inputValues,
        textSnippet: object?.textSnippet,
        pageNo: object?.pageNumber,
        optionalAnalystComment: object?.optionalAnalystComment ? object?.optionalAnalystComment : '',
        isRestated: object?.isRestated ? object?.isRestated : '',
        restatedForYear: object?.restatedForYear ? object?.restatedForYear : '',
        restatedInYear: object?.restatedInYear ? object?.restatedInYear : '',
        restatedValue: object?.restatedValue ? object?.restatedValue : '',
        screenShot: s3DataScreenshot,
        response: object?.response,
        memberName: object?.memberName,
        sourceList: sourceTypeDetails,
        source: sourceDetails,
        error,
        additionalDetails: []
    }

    return data;
}


function getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, currentYear) {
    let additionalDetails = [];
    displayFields.map(display => {
        if (display?.fieldName == 'keywordUsed') {
        }
        if (!requiredFields.includes(display?.fieldName)) {
            let optionValues = [], optionVal = '', currentValue;
            switch (display?.inputType) {
                case SELECT:
                    const options = display.inputValues.split(',');
                    options.length > 0 ? options.map(option => {
                        optionValues.push({
                            value: option,
                            label: option
                        })
                    }) : optionValues = [];

                    break;
                case STATIC:
                    errorDetailsObject.additionalDetails = errorDetailsObject?.additionalDetails ? errorDetailsObject?.additionalDetails : []
                    currentValue = errorDetailsObject?.additionalDetails[display?.fieldName];
                    break;
                default:
                    optionVal = display?.inputValues;
                    const standaloneDetail = errorDetailsObject.find((obj) => obj?.datapointId == datapointId && obj?.year == currentYear && obj?.taskId == taskId);
                    currentValue = display?.inputType == SELECT ?
                        {
                            value: standaloneDetail?.errorCaughtByRep?.additionalDetails ?
                                standaloneDetail?.errorCaughtByRep?.additionalDetails[display?.fieldName] : '',
                            label: standaloneDetail?.errorCaughtByRep?.additionalDetails ?
                                standaloneDetail?.errorCaughtByRep?.additionalDetails[display?.fieldName] : ''
                        }

                        : standaloneDetail?.errorCaughtByRep?.additionalDetails ? standaloneDetail?.errorCaughtByRep?.additionalDetails[display?.fieldName] : '';
                    break;
            }
            currentDatapointsObject?.error?.refData?.additionalDetails?.push({
                fieldName: display?.fieldName,
                name: display?.name,
                value: currentValue ? currentValue : '',
                inputType: display?.inputType,
                inputValues: optionValues?.length > 0 ? optionValues : optionVal
            });
        }
    });
    return currentDatapointsObject;

}