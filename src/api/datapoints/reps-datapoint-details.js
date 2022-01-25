import _ from 'lodash';
import { Datapoints } from '.'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { ClientTaxonomy } from '../clientTaxonomy'
import { Functions } from '../functions'
import { TaskAssignment } from '../taskAssignment'
import { ErrorDetails } from '../errorDetails'
import { CompanySources } from '../companySources'
import { MeasureUoms } from '../measure_uoms'
import { Measures } from '../measures'
import { PlaceValues } from '../place_values'
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { SELECT, STATIC } from '../../constants/dp-datatype';
import { Completed } from '../../constants/task-status';

import { getS3ScreenShot, getSourceDetails, getHistoryDataObject, getPreviousNextDataPoints, getDisplayFields, getS3RefScreenShot } from './dp-details-functions';
let requiredFields = [
    "categoryCode",
    "categoryName",
    "code",
    "comments",
    "dataCollection",
    "dataCollectionGuide",
    "description",
    "dpType",
    "errorType",
    "finalUnit",
    "functionType",
    "hasError",
    "industryRelevant",
    "isPriority",
    "keyIssueCode",
    "keyIssueName",
    "name",
    "normalizedBy",
    "pageNumber",
    "optionalAnalystComment",
    "isRestated",
    "restatedForYear",
    "restatedInYear",
    "restatedValue",
    "percentile",
    "polarity",
    "publicationDate",
    "reference",
    "response",
    "screenShot",
    "signal",
    "sourceName",
    "isRequiredForJson",
    "textSnippet",
    "themeCode",
    "themeName",
    "unit",
    "url",
    "weighted",
    "year",
    "measureType"
];
export const repDatapointDetails = async (req, res, next) => {
    try {
        const { taskId, datapointId, memberType, memberName, role, year, memberId } = req.body;
        const [taskDetails, functionId, measureTypes, allPlaceValues] = await Promise.all([
            TaskAssignment.findOne({
                _id: taskId
            }).populate({
                path: "companyId",
                populate: {
                    path: "clientTaxonomyId"
                }
            }).populate('categoryId'),
            Functions.findOne({
                functionType: "Negative News",
                status: true
            }),
            Measures.find({ status: true }),
            PlaceValues.find({ status: true })
        ]);

        const clienttaxonomyFields = await ClientTaxonomy.find({ _id: taskDetails.companyId.clientTaxonomyId.id }).distinct('fields');
        const [currentYear, displayFields] = [
            year?.split(','),
            clienttaxonomyFields.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Controversy')
        ];
        const [dpTypeValues, errorDataDetails, companySourceDetails] = await Promise.all([
            Datapoints.findOne({
                dataCollection: 'Yes',
                functionId: {
                    "$ne": functionId.id
                },
                categoryId: taskDetails.categoryId.id,
                _id: datapointId,
                status: true
            }).populate('keyIssueId').populate('categoryId'),

            ErrorDetails.find({
                taskId: taskId,
                companyId: taskDetails.companyId.id,
                year: {
                    $in: currentYear
                },
                categoryId: taskDetails.categoryId.id,
                status: true
            }).populate('errorTypeId'),

            CompanySources.find({ companyId: taskDetails.companyId.id })
        ]);
        let dpMeasureType = measureTypes.filter(obj => obj.measureName == dpTypeValues.measureType);
        let dpMeasureTypeId = dpMeasureType.length > 0 ? dpMeasureType[0].id : null;
        let taxonomyUoms = await MeasureUoms.find({
            measureId: dpMeasureTypeId,
            status: true
        }).sort({ orderNumber: 1 });

        let placeValues = [], uomValues = [];

        if (dpTypeValues && dpTypeValues?.measureType != null && dpTypeValues?.measureType != "NA" && dpTypeValues?.measureType) {
            for (let uomIndex = 0; uomIndex < taxonomyUoms.length; uomIndex++) {
                const element = taxonomyUoms[uomIndex];
                uomValues.push({ value: element.id, label: element.uomName });
            }
        }
        if (dpTypeValues && dpTypeValues.measureType == "Currency") {
            for (let pvIndex = 0; pvIndex < allPlaceValues.length; pvIndex++) {
                const element = allPlaceValues[pvIndex];
                placeValues.push({ value: element.name, label: element.name });
            }
        }

        let sourceTypeDetails = [];
        companySourceDetails.map(company => {
            sourceTypeDetails.push({
                sourceName: company.name,
                value: company.id,
                url: company.sourceUrl,
                publicationDate: company.publicationDate
            })
        });

        const [currentQuery, historyQuery] = [{
            taskId: taskId,
            companyId: taskDetails.companyId.id,
            datapointId: datapointId,
            year: {
                $in: currentYear
            },
            isActive: true,
            status: true
        }, {
            companyId: taskDetails.companyId.id,
            datapointId: datapointId,
            year: {
                $nin: currentYear
            },
            isActive: true,
            status: true
        }];

        let datapointsObject = {
            dpCode: dpTypeValues.code,
            dpCodeId: dpTypeValues.id,
            dpName: dpTypeValues.name,
            companyId: taskDetails.companyId.id,
            companyName: taskDetails.companyId.companyName,
            keyIssueId: dpTypeValues.keyIssueId.id,
            keyIssue: dpTypeValues.keyIssueId.keyIssueName,
            pillarId: dpTypeValues.categoryId.id,
            pillar: dpTypeValues.categoryId.categoryName,
            fiscalYear: taskDetails.year,
            comments: [],
            currentData: [],
            historicalData: [],
        }
        let inputValues = [];
        if (dpTypeValues.dataType == 'Select') {
            let inputs = dpTypeValues.unit.split('/');
            for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
                const element = {
                    label: inputs[inputIndex],
                    value: inputs[inputIndex]
                }
                inputValues.push(element);
            }
        }

        let index, prevDatapoint = {}, nextDatapoint = {};
        const allDatapoints = await Datapoints.find({
            dataCollection: 'Yes',
            functionId: {
                "$ne": functionId.id
            },
            dpType: memberType,
            clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
            categoryId: taskDetails.categoryId.id,
            status: true
        }).populate('keyIssueId').populate('categoryId').sort({ code: 1 });

        for (let i = 0; i < allDatapoints?.length; i++) {
            if (allDatapoints[i].id == datapointId) {
                // find memberName
                index = allDatapoints.indexOf(allDatapoints[i]);
                prevDatapoint = (index - 1) >= 0 ? getPreviousNextDataPoints(allDatapoints[index - 1], taskDetails, year, memberId, memberName) : {};
                nextDatapoint = (index + 1) < allDatapoints?.length - 1 ? getPreviousNextDataPoints(allDatapoints[index + 1], taskDetails, year, memberId, memberName) : {};
                break;
            }
        }
        let s3DataScreenshot = [];
        let s3DataRefErrorScreenshot = [];
        let totalHistories = 0;
        let historyYear;
        switch (memberType) {
            case STANDALONE:
                const [currentAllStandaloneDetails, historyAllStandaloneDetails] = await Promise.all([
                    StandaloneDatapoints.find(currentQuery).sort({ updatedAt: -1 }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    StandaloneDatapoints.find(historyQuery).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom')
                ]);

                historyYear = _.orderBy(_.uniqBy(historyAllStandaloneDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: ''
                }
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    let sourceDetails = {
                        url: '',
                        sourceName: "",
                        value: "",
                        publicationDate: ''
                    };
                    for (let currentIndex = 0; currentIndex < currentAllStandaloneDetails.length; currentIndex++) {
                        const object = currentAllStandaloneDetails[currentIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError) {
                            let errorDetailsObject = errorDataDetails.filter(obj =>
                                obj.datapointId == datapointId
                                && obj.year == currentYear[currentYearIndex]
                                && obj.taskId == taskId
                                && obj.raisedBy == role);
                            if (errorDetailsObject.length > 0) {
                                if (errorDetailsObject[0].raisedBy == role) {
                                    let comments = errorDetailsObject[0] ? errorDetailsObject[0].comments : "";
                                    let rejectComment = errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : "";
                                    datapointsObject.comments.push(comments);
                                    datapointsObject.comments.push(rejectComment);
                                }
                            }

                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, false, uomValues, placeValues);
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
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
                                getS3ScreenShot(object.screenShot),
                                getSourceDetails(object, sourceDetails)
                            ]);
                            if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError == false) {
                                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId
                                    && obj.year == currentYear[currentYearIndex]
                                    && obj.taskId == taskId
                                    && obj.raisedBy == role);
                                if (errorDetailsObject.length > 0) {
                                    if (errorDetailsObject[0].raisedBy == role) {
                                        let comments = errorDetailsObject[0].comments;
                                        let rejectComment = errorDetailsObject[0].rejectComment;
                                        datapointsObject.comments.push(comments);
                                        datapointsObject.comments.push(rejectComment);
                                    }
                                }
                                currentDatapointsObject = currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, true, uomValues, placeValues);
                                currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                                datapointsObject.status = object.correctionStatus;
                                datapointsObject.currentData.push(currentDatapointsObject);
                            }
                        };
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                }
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

                for (let historicalYearIndex = 0; historicalYearIndex < totalHistories; historicalYearIndex++) {
                    let historicalDatapointsObject = {};
                    let sourceDetails = {
                        url: '',
                        sourceName: "",
                        value: "",
                        publicationDate: ''
                    };
                    for (let historyStandaloneIndex = 0; historyStandaloneIndex < historyAllStandaloneDetails.length; historyStandaloneIndex++) {
                        let object = historyAllStandaloneDetails[historyStandaloneIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.year == historyYear[historicalYearIndex].year) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, object.year)
                            historicalDatapointsObject = {
                                ...historicalDatapointsObject,
                                standaradDeviation: object.standaradDeviation,
                                average: object.average
                            };
                            historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllStandaloneDetails, historyYear[historicalYearIndex].year, historicalDatapointsObject, false, false);
                            datapointsObject.historicalData.push(historicalDatapointsObject);
                        }
                    }
                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    response: {

                        prevDatapoint,
                        nextDatapoint
                    },
                    dpCodeData: datapointsObject

                });
            case BOARD_MATRIX:
                const [currentAllBoardMemberMatrixDetails, historyAllBoardMemberMatrixDetails] = await Promise.all([
                    BoardMembersMatrixDataPoints.find({
                        ...currentQuery,
                        memberName: memberName
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    BoardMembersMatrixDataPoints.find({
                        ...historyQuery,
                        memberName: memberName,
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom')
                ]);


                historyYear = _.orderBy(_.uniqBy(historyAllBoardMemberMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: ''
                }

                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    let sourceDetails = {
                        url: '',
                        sourceName: "",
                        value: "",
                        publicationDate: ''
                    };
                    for (let currentIndex = 0; currentIndex < currentAllBoardMemberMatrixDetails.length; currentIndex++) {
                        let object = currentAllBoardMemberMatrixDetails[currentIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError == true) {
                            const errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId
                                && obj.year == currentYear[currentYearIndex]
                                && obj.taskId == taskId
                                && obj.raisedBy == role)
                            if (errorDetailsObject.length !== 0) {
                                if (errorDetailsObject[0].raisedBy == role) {
                                    let comments = errorDetailsObject.length !== 0 ? errorDetailsObject[0].comments : "";
                                    let rejectComment = errorDetailsObject.length !== 0 ? errorDetailsObject[0].rejectComment : "";
                                    datapointsObject.comments.push(comments);
                                    datapointsObject.comments.push(rejectComment);
                                }
                            }
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, false, uomValues, placeValues);
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0].errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, false)
                            currentDatapointsObject = getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, currentYear[currentYearIndex])
                            datapointsObject.status = object.correctionStatus;
                            datapointsObject.currentData.push(currentDatapointsObject);
                        }
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        for (let currentIndex = 0; currentIndex < currentAllBoardMemberMatrixDetails.length; currentIndex++) {
                            const object = currentAllBoardMemberMatrixDetails[currentIndex];
                            [s3DataScreenshot, sourceDetails] = await Promise.all([
                                getS3ScreenShot(object.screenShot),
                                getSourceDetails(object, sourceDetails)
                            ]);
                            if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError == false) {
                                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId && obj.year == currentYear[currentYearIndex] && obj.taskId == taskId && obj.raisedBy == role)
                                if (errorDetailsObject.length !== 0) {
                                    if (errorDetailsObject[0].raisedBy == role) {
                                        let comments = errorDetailsObject.length !== 0 ? errorDetailsObject[0].comments : "";
                                        let rejectComment = errorDetailsObject.length !== 0 ? errorDetailsObject[0].rejectComment : "";
                                        boardDatapointsObject.comments.push(comments);
                                        boardDatapointsObject.comments.push(rejectComment);
                                    }
                                }
                                currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, true, uomValues, placeValues);
                                currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true)

                                datapointsObject.currentData.push(currentDatapointsObject);
                                datapointsObject.status = object.correctionStatus;
                            }
                        };
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                }
                for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                    let historicalDatapointsObject = {};
                    let sourceDetails = {
                        url: '',
                        sourceName: "",
                        value: "",
                        publicationDate: ''
                    };
                    for (let historyAllBoardMemberIndex = 0; historyAllBoardMemberIndex < historyAllBoardMemberMatrixDetails.length; historyAllBoardMemberIndex++) {
                        let object = historyAllBoardMemberMatrixDetails[historyAllBoardMemberIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.year == historyYear[hitoryYearIndex].year
                            && object.memberName == memberName) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year);
                            historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllBoardMemberMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
                            datapointsObject.historicalData.push(historicalDatapointsObject);
                        }

                    }
                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    response: {

                        prevDatapoint,
                        nextDatapoint
                    },
                    dpCodeData: datapointsObject,

                });
            case KMP_MATRIX:
                const [currentAllKmpMatrixDetails, historyAllKmpMatrixDetails] = await Promise.all([
                    KmpMatrixDataPoints.find({
                        ...currentQuery, memberName: memberName,
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    KmpMatrixDataPoints.find({
                        ...historyQuery,
                        memberName: memberName,
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom')
                ]);
                historyYear = _.orderBy(_.uniqBy(historyAllKmpMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: 'Yet to Start'
                }
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    let sourceDetails = {
                        url: '',
                        sourceName: "",
                        value: "",
                        publicationDate: ''
                    };
                    for (let currentIndex = 0; currentIndex < currentAllKmpMatrixDetails.length; currentIndex++) {
                        let object = currentAllKmpMatrixDetails[currentIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        let errorDetailsObject;
                        if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError == true) {
                            errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId && obj.year == currentYear[currentYearIndex] && obj.taskId == taskId && obj.raisedBy == role)
                            if (errorDetailsObject.length !== 0) {
                                if (errorDetailsObject[0].raisedBy == role) {
                                    let comments = errorDetailsObject[0] ? errorDetailsObject[0].comments : "";
                                    let rejectComment = errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : "";
                                    datapointsObject.comments.push(comments);
                                    datapointsObject.comments.push(rejectComment);
                                }

                            }
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, false, uomValues, placeValues);
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0].errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, false);
                            currentDatapointsObject = getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, currentYear[currentYearIndex])
                            datapointsObject.status = object.correctionStatus;
                            datapointsObject.currentData.push(currentDatapointsObject);
                        }
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        for (let currentIndex = 0; currentIndex < currentAllKmpMatrixDetails.length; currentIndex++) {
                            const object = currentAllKmpMatrixDetails[currentIndex];
                            [s3DataScreenshot, sourceDetails] = await Promise.all([
                                getS3ScreenShot(object.screenShot),
                                getSourceDetails(object, sourceDetails)
                            ]);
                            if (object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex] && object.hasError == false) {
                                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId && obj.year == currentYear[currentYearIndex] && obj.taskId == taskId && obj.raisedBy == role)
                                if (errorDetailsObject.length !== 0) {
                                    if (errorDetailsObject[0].raisedBy == role) {
                                        let comments = errorDetailsObject[0] ? errorDetailsObject[0].comments : "";
                                        let rejectComment = errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : "";
                                        datapointsObject.comments.push(comments);
                                        datapointsObject.comments.push(rejectComment);
                                    }
                                }
                                currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, true, uomValues, placeValues);
                                currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);

                                datapointsObject.status = object.correctionStatus;
                                datapointsObject.currentData.push(currentDatapointsObject);
                            }
                        };
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                        let sourceDetails = {
                            url: '',
                            sourceName: "",
                            value: "",
                            publicationDate: ''
                        };
                        let historicalDatapointsObject = {};
                        for (let historyAllKMPMemberIndex = 0; historyAllKMPMemberIndex < historyAllKmpMatrixDetails.length; historyAllKMPMemberIndex++) {
                            const object = historyAllKmpMatrixDetails[historyAllKMPMemberIndex];
                            [s3DataScreenshot, sourceDetails] = await Promise.all([
                                getS3ScreenShot(object.screenShot),
                                getSourceDetails(object, sourceDetails)
                            ]);
                            if (object.datapointId.id == dpTypeValues.id && object.year == historyYear[hitoryYearIndex].year && object.memberName == memberName) {
                                historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year);
                                historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllKmpMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false)
                                datapointsObject.historicalData.push(historicalDatapointsObject);
                            }
                        }
                    }
                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    response: {

                        prevDatapoint,
                        nextDatapoint
                    },
                    dpCodeData: datapointsObject,
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
        hasError: object.hasError,
        refData: {
            description: dpTypeValues.description,
            dataType: dpTypeValues.dataType,
            subDataType: {
                measure: dpTypeValues.measureType,
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
        errorStatus: object.correctionStatus
    } : {
        hasError: object.hasError,
        refData: {
            description: dpTypeValues.description,
            response: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.response : '',
            screenShot: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.screenShot : [],
            dataType: dpTypeValues.dataType,
            subDataType: {
                measure: dpTypeValues.measureType,
                placeValues: placeValues,
                selectedPlaceValue: errorDetailsObject[0].errorCaughtByRep.placeValue ? { value: errorDetailsObject[0].errorCaughtByRep.placeValue, label: errorDetailsObject[0].errorCaughtByRep.placeValue } : null,
                uoms: uomValues,
                selectedUom: errorDetailsObject[0].errorCaughtByRep.uom ? { value: errorDetailsObject[0].errorCaughtByRep.uom.id, label: errorDetailsObject[0].errorCaughtByRep.uom.uomName } : null
            },
            fiscalYear: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.fiscalYear : '',
            textSnippet: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.textSnippet : '',
            pageNo: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.pageNo : '',
            optionalAnalystComment: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.optionalAnalystComment : '',
            isRestated: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.isRestated : '',
            restatedForYear: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.restatedForYear : '',
            restatedInYear: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.restatedInYear : '',
            restatedValue: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.restatedValue : '',
            source: errorDetailsObject.length !== 0 ? errorDetailsObject[0].errorCaughtByRep.source : '',
            additionalDetails: []
        },
        comment: '',
        errorStatus: object.correctionStatus
    }

    const data = {
        status: Completed,
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        dpName: dpTypeValues.name,
        fiscalYear: currentYear,
        description: dpTypeValues.description,
        dataType: dpTypeValues.dataType,
        subDataType: {
            measure: dpTypeValues.measureType,
            placeValues: placeValues,
            selectedPlaceValue: object.placeValue ? { value: object.placeValue, label: object.placeValue } : null,
            uoms: uomValues,
            selectedUom: object.uom ? { value: object.uom.id, label: object.uom.uomName } : null
        },
        inputValues: inputValues,
        textSnippet: object.textSnippet,
        pageNo: object.pageNumber,
        optionalAnalystComment: object.optionalAnalystComment ? object.optionalAnalystComment : '',
        isRestated: object.isRestated ? object.isRestated : '',
        restatedForYear: object.restatedForYear ? object.restatedForYear : '',
        restatedInYear: object.restatedInYear ? object.restatedInYear : '',
        restatedValue: object.restatedValue ? object.restatedValue : '',
        screenShot: s3DataScreenshot,
        response: object.response,
        memberName: object.memberName,
        sourceList: sourceTypeDetails,
        source: sourceDetails,
        error,
        additionalDetails: []
    }

    return data;
}


function getDisplayErrorDetails(displayFields, errorDetailsObject, currentDatapointsObject, datapointId, taskId, currentYear) {
    displayFields.map(display => {
        if (!requiredFields.includes(display.fieldName)) {
            let optionValues = [], optionVal = '', currentValue;
            switch (display.inputType) {
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
                    currentValue = errorDetailsObject.additionalDetails[display.fieldName];
                    break;
                default:
                    optionVal = display.inputValues;
                    const standaloneDetail = errorDetailsObject.find((obj) => obj.datapointId == datapointId && obj.year == currentYear && obj.taskId == taskId);
                    currentValue = display.inputType == SELECT ?
                        {
                            value: standaloneDetail.errorCaughtByRep.additionalDetails ?
                                standaloneDetail.errorCaughtByRep.additionalDetails[display.fieldName] : '',
                            label: standaloneDetail.errorCaughtByRep.additionalDetails ?
                                standaloneDetail.errorCaughtByRep.additionalDetails[display.fieldName] : ''
                        }

                        : standaloneDetail.errorCaughtByRep.additionalDetails ? standaloneDetail.errorCaughtByRep.additionalDetails[display.fieldName] : '';
                    break;
            }
            currentDatapointsObject.error.refData.additionalDetails.push({
                fieldName: display.fieldName,
                name: display.name,
                value: currentValue ? currentValue : '',
                inputType: display.inputType,
                inputValues: optionValues.length > 0 ? optionValues : optionVal
            });
        }
    });
    return currentDatapointsObject;

}