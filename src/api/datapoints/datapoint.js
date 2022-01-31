import _ from 'lodash';
import { Datapoints } from '.';
import { StandaloneDatapoints } from '../standalone_datapoints';
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints';
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { ClientTaxonomy } from '../clientTaxonomy';
import { Functions } from '../functions';
import { TaskAssignment } from '../taskAssignment';
import { ErrorDetails } from '../errorDetails';
import { CompanySources } from '../companySources';
import { MeasureUoms } from '../measure_uoms';
import { Measures } from '../measures';
import { PlaceValues } from '../place_values';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { YetToStart } from '../../constants/task-status';
import { getError, getS3ScreenShot, getSourceDetails, getCurrentDatapointObject, getCurrentEmptyObject, getS3RefScreenShot, getDisplayFields, getHistoryDataObject, getPreviousNextDataPoints } from './dp-details-functions';


export const datapointDetails = async (req, res, next) => {
    try {
        const { year, taskId, datapointId, memberType, memberName, memberId } = req.body;
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
            PlaceValues.find({ status: true }).sort({orderNumber: 1})
        ]);
        const currentYear = year.split(',');
        const clienttaxonomyFields = await ClientTaxonomy.find({ _id: taskDetails.companyId.clientTaxonomyId.id }).distinct('fields').lean();
        const displayFields = clienttaxonomyFields.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Controversy');
        const [dpTypeValues, errorDataDetails, companySourceDetails] = await Promise.all([
            Datapoints.findOne({
                dataCollection: 'Yes',
                functionId: {
                    "$ne": functionId.id
                },
                // clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
                categoryId: taskDetails.categoryId.id,
                _id: datapointId,
                status: true
            }).populate('keyIssueId').populate('categoryId'),
            ErrorDetails.find({
                taskId: taskId,
                companyId: taskDetails.companyId.id,
                datapointId: datapointId,
                year: {
                    $in: currentYear
                },
                status: true
            }).populate('errorTypeId'),
            CompanySources.find({ companyId: taskDetails.companyId.id })
        ]);
        let dpMeasureType = measureTypes.filter(obj => obj.measureName == dpTypeValues?.measureType);
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
        if (dpTypeValues && dpTypeValues?.measureType == "Currency") {
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
            });
        });

        const [currentQuery, historyQuery] = [
            {
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
            }

        ];
        let historyYear;
        let inputValues = [];
        let totalHistories = 0;
        let s3DataScreenshot = [];
        let s3DataRefErrorScreenshot = [];
        let datapointsObject = {
            dpCode: dpTypeValues?.code,
            dpCodeId: dpTypeValues?.id,
            dpName: dpTypeValues?.name,
            companyId: taskDetails?.companyId.id,
            companyName: taskDetails?.companyId.companyName,
            keyIssueId: dpTypeValues?.keyIssueId.id,
            keyIssue: dpTypeValues?.keyIssueId.keyIssueName,
            pillarId: dpTypeValues?.categoryId.id,
            pillar: dpTypeValues?.categoryId.categoryName,
            fiscalYear: taskDetails?.year,
            comments: [],
            currentData: [],
            historicalData: [],
            status: ''
        }
        if (dpTypeValues?.dataType == 'Select') {
            const inputs = dpTypeValues.unit.split('/');
            inputs.map(input => {
                inputValues.push({
                    label: input,
                    value: input
                });
            });
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
            isPriority: true,
            status: true
        }).populate('keyIssueId').populate('categoryId').sort({ code: 1 });

        for (let i = 0; i < allDatapoints?.length; i++) {
            if (allDatapoints[i].id == datapointId) {
                // find memberName
                index = allDatapoints.indexOf(allDatapoints[i]);
                prevDatapoint = (index - 1) >= 0 ? getPreviousNextDataPoints(allDatapoints[index - 1], taskDetails, year, memberId, memberName) : {};
                nextDatapoint = (index + 1) <= allDatapoints?.length - 1 ? getPreviousNextDataPoints(allDatapoints[index + 1], taskDetails, year, memberId, memberName) : {};
                break;
            }
        }

        switch (memberType) {
            case STANDALONE:
                const [currentAllStandaloneDetails, historyAllStandaloneDetails] = await Promise.all([
                    StandaloneDatapoints.find(currentQuery).populate('createdBy')
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
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex]) {
                            datapointsObject.comments.push(object.comments);
                            datapointsObject.comments.push(object.rejectComment)
                        }
                    })
                    for (let currentIndex = 0; currentIndex < currentAllStandaloneDetails.length; currentIndex++) {
                        const object = currentAllStandaloneDetails[currentIndex];
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], taskId, datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot); //here we need to update the errorCaughtbyRep screenshot
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = {
                                ...currentDatapointsObject,
                                comments: object.comments,
                            }
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentIndex], currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = {
                                ...currentDatapointsObject,
                                comments: []
                            }
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentIndex], currentDatapointsObject, false, true);
                        }
                        datapointsObject.status = 'Completed';
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues);
                        currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, true, false);
                        datapointsObject.status = YetToStart;
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
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
                    for (let historicalDataIndex = 0; historicalDataIndex < historyAllStandaloneDetails.length; historicalDataIndex++) {
                        let object = historyAllStandaloneDetails[historicalDataIndex];
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.year == historyYear[historicalYearIndex].year) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, object.year, uomValues, placeValues);
                            historicalDatapointsObject = {
                                standaradDeviation: object.standaradDeviation,
                                average: object.average, ...historicalDatapointsObject
                            }
                            historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllStandaloneDetails, historyYear[historicalYearIndex].year, historicalDatapointsObject, false, false);
                            datapointsObject.historicalData.push(historicalDatapointsObject);
                        }
                    }
                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    response: { prevDatapoint, nextDatapoint },
                    dpCodeData: datapointsObject
                });
            case BOARD_MATRIX:
                const [currentAllBoardMemberMatrixDetails, historyAllBoardMemberMatrixDetails,] = await Promise.all([
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
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex]
                            && object.memberName == memberName) {
                            datapointsObject.comments.push(object.comments);
                            datapointsObject.comments.push(object.rejectComment)
                        }
                    });
                    for (let currentIndex = 0; currentIndex < currentAllBoardMemberMatrixDetails.length; currentIndex++) {
                        let sourceDetails = {
                            url: '',
                            sourceName: "",
                            value: "",
                            publicationDate: ''
                        };
                        const object = currentAllBoardMemberMatrixDetails[currentIndex];
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], taskId, datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentIndex], currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0] ? (errorDetailsObject[0]?.errorCaughtByRep ? (errorDetailsObject[0]?.errorCaughtByRep.screenShot ? errorDetailsObject[0]?.errorCaughtByRep.screenShot : []) : []) : []);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentIndex], currentDatapointsObject, false, true);

                        }
                        datapointsObject.status = 'Completed';
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues)
                        currentDatapointsObject = {
                            ...currentDatapointsObject,
                            memberName: memberName
                        }

                        currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, '', currentDatapointsObject, true, false);
                        datapointsObject.status = YetToStart;
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
                }
                for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                    let historicalDatapointsObject = {};
                    for (let historyBoardMemberIndex = 0; historyBoardMemberIndex < historyAllBoardMemberMatrixDetails.length; historyBoardMemberIndex++) {
                        let object = historyAllBoardMemberMatrixDetails[historyBoardMemberIndex];
                        let sourceDetails = {
                            url: '',
                            sourceName: "",
                            value: "",
                            publicationDate: ''
                        };
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.year == historyYear[hitoryYearIndex].year && object.memberName == memberName) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues);
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
                    dpCodeData: datapointsObject
                });
            case KMP_MATRIX:
                const [currentAllKmpMatrixDetails, historyAllKmpMatrixDetails] =
                    await Promise.all([
                        KmpMatrixDataPoints.find({
                            ...currentQuery,
                            memberName: memberName
                        })
                            .populate('createdBy')
                            .populate('datapointId')
                            .populate('companyId')
                            .populate('taskId')
                            .populate('uom'),
                        KmpMatrixDataPoints.find({
                            ...historyQuery,
                            memberName: memberName
                        }).populate('createdBy')
                            .populate('datapointId')
                            .populate('companyId')
                            .populate('taskId')
                            .populate('uom')
                    ]);

                historyYear = _.orderBy(_.uniqBy(historyAllKmpMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: YetToStart
                }
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex] && object.memberName == memberName) {
                            datapointsObject.comments.push(object.comments);
                            datapointsObject.comments.push(object.rejectComment)
                        }
                    });
                    for (let currentIndex = 0; currentIndex < currentAllKmpMatrixDetails.length; currentIndex++) {
                        const object = currentAllKmpMatrixDetails[currentIndex];
                        let sourceDetails = {
                            url: '',
                            sourceName: "",
                            value: "",
                            publicationDate: ''
                        };
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], taskId, datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId.id == datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError == true) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues)
                            currentDatapointsObject = { ...currentDatapointsObject, comment: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);

                        } else if (condition && object.hasCorrection == true) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues)
                            currentDatapointsObject = { ...currentDatapointsObject, comment: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection == false && object.hasError == false) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues)
                            currentDatapointsObject = { ...currentDatapointsObject, comment: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0] ? (errorDetailsObject[0]?.errorCaughtByRep ? (errorDetailsObject[0]?.errorCaughtByRep.screenShot ? errorDetailsObject[0]?.errorCaughtByRep.screenShot : []) : []) : []);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        }
                    }
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues)
                        currentDatapointsObject = {
                            ...currentDatapointsObject,
                            memberName: memberName,
                        }
                        currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllKmpMatrixDetails, '', currentDatapointsObject, true, false)
                        datapointsObject.status = YetToStart;
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
                }
                for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                    let historicalDatapointsObject = {};
                    for (let historyKMPMemerIndex = 0; historyKMPMemerIndex < historyAllKmpMatrixDetails.length; historyKMPMemerIndex++) {
                        let object = historyAllKmpMatrixDetails[historyKMPMemerIndex];
                        let sourceDetails = {
                            url: '',
                            sourceName: "",
                            value: "",
                            publicationDate: ''
                        };
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        if (object.datapointId.id == dpTypeValues.id
                            && object.year == historyYear[hitoryYearIndex].year
                            && object.memberName == memberName) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues)
                            historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllKmpMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
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
            default:
                return res.status(500).json({
                    message: 'Incorrect Member Type.'
                });
                break;
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}




