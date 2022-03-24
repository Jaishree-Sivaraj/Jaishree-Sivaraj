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
import { CorrectionPending, ReassignmentPending, YetToStart, Error, CollectionCompleted } from '../../constants/task-status';
import {
    getError,
    getS3ScreenShot,
    getSourceDetails,
    getCurrentDatapointObject,
    getCurrentEmptyObject,
    getS3RefScreenShot,
    getDisplayFields,
    getHistoryDataObject,
    getPreviousNextDataPoints,
    getChildDp,
    getHeaders,
    getSortedYear
} from './dp-details-functions';

export const datapointDetails = async (req, res, next) => {
    try {
        let timeDetails = [];
        const { year, taskId, datapointId, memberType, memberName, memberId, isPriority, keyIssueId } = req.body;
        const taskFunctionMeasurePlaceValuesStartTime = Date.now();
        const [taskDetails, functionId, measureTypes, allPlaceValues] = await Promise.all([
            TaskAssignment.findOne({
                _id: taskId
            }).populate({
                path: 'companyId',
                populate: {
                    path: 'clientTaxonomyId'
                }
            }).populate('categoryId'),
            Functions.findOne({
                functionType: 'Negative News',
                status: true
            }),
            Measures.find({ status: true }),
            PlaceValues.find({ status: true }).sort({ orderNumber: 1 })
        ]);
        trackTime(timeDetails, taskFunctionMeasurePlaceValuesStartTime, Date.now(), 'TaskDetails and Function Details and  Measure Details and PlaceValues Details Promise')

        let currentYear = year.split(', ');
        currentYear = getSortedYear(currentYear);

        const clientTaxonomyPromiseStartTime = Date.now();
        const clienttaxonomyFields = await ClientTaxonomy.findOne({ _id: taskDetails.companyId.clientTaxonomyId.id }).lean();
        trackTime(timeDetails, clientTaxonomyPromiseStartTime, Date.now(), 'Client Taxonomy');

        const displayFields = clienttaxonomyFields?.fields?.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Controversy');

        const dpTypeErrorDetailsCompanySourceStartTime = Date.now();
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
                datapointId: datapointId,
                year: {
                    $in: currentYear
                },
                status: true
            }).populate('errorTypeId'),
            CompanySources.find({ companyId: taskDetails.companyId.id })
        ]);
        trackTime(timeDetails, dpTypeErrorDetailsCompanySourceStartTime, Date.now(), 'DpType Details and Error Details and Source Details  Promise ');

        // Saving single data for qualitative datapoints
        if (!taskDetails.companyId.clientTaxonomyId?.isDerivedCalculationRequired && dpTypeValues?.dataType !== "Number") {
            currentYear.length = 1
        }
        let dpMeasureType = measureTypes.filter(obj => obj?.measureName?.toLowerCase() == dpTypeValues?.measureType?.toLowerCase());
        let dpMeasureTypeId = dpMeasureType.length > 0 ? dpMeasureType[0].id : null;
        const taxonomyStart = Date.now();
        let taxonomyUoms = await MeasureUoms.find({
            measureId: dpMeasureTypeId,
            status: true
        }).sort({ orderNumber: 1 });

        let placeValues = [], uomValues = [];

        if (dpTypeValues && dpTypeValues?.measureType != null && dpTypeValues?.measureType != 'NA' && dpTypeValues?.measureType) {
            for (let uomIndex = 0; uomIndex < taxonomyUoms.length; uomIndex++) {
                const element = taxonomyUoms[uomIndex];
                uomValues.push({ value: element.id, label: element.uomName });
            }
        }
        if (dpTypeValues && (dpTypeValues?.measureType == 'Currency' || dpTypeValues?.dataType == 'Number')) {
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
                publicationDate: company.publicationDate,
                sourceFile: company?.sourceFile ? company?.sourceFile : ''
            });
        });
        trackTime(timeDetails, taxonomyStart, Date.now(), 'Measure Deatils and placeValues Details and Source Details  Promise');

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
            },
            {
                companyId: taskDetails.companyId.id,
                datapointId: datapointId,
                $and: [{ year: { $nin: currentYear } }, { year: { $lt: currentYear[0] } }],
                isActive: true,
                status: true
            }

        ];
        // let historyYear;
        let historicalYears = []
        let inputValues = [];
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

        const chilDpHeaders = await getHeaders(taskDetails.companyId.clientTaxonomyId.id, dpTypeValues.id ? dpTypeValues.id : '');

        let index, prevDatapoint = {}, nextDatapoint = {};
        // TODO:  index is used only in for-loop .
        let datapointQuery =
        {
            dataCollection: 'Yes',
            functionId: {
                "$ne": functionId.id
            },
            dpType: memberType,
            clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
            categoryId: taskDetails.categoryId.id,
            status: true
        }

        if (isPriority == true) {
            datapointQuery = { ...datapointQuery, isPriority: true };
        }

        let allDatapointsStartTime = Date.now();
        // Another Set of next and prev dp will come in for this taskStatus.
        if (taskDetails.taskStatus == CorrectionPending || taskDetails.taskStatus == ReassignmentPending) {
            let allDpDetails;
            const errQuery = { taskId: taskDetails?._id, status: true, isActive: true, dpStatus: Error }
            switch (memberType) {
                case STANDALONE:
                    allDpDetails = await StandaloneDatapoints.distinct('datapointId', errQuery);
                    break;
                case BOARD_MATRIX:
                    allDpDetails = await BoardMembersMatrixDataPoints.distinct('datapointId', { ...errQuery, memberName })
                    break;
                case KMP_MATRIX:
                    allDpDetails = await KmpMatrixDataPoints.distinct('datapointId', { ...errQuery, memberName })
                    break;
                default:
                    break;

            }
            datapointQuery = { ...datapointQuery, _id: { $in: allDpDetails } }

        }

        datapointQuery = keyIssueId == '' ? datapointQuery : { ...datapointQuery, keyIssueId };
        const allDatapoints = await Datapoints.find(datapointQuery).populate('keyIssueId')
            .populate('categoryId').sort({ code: 1 });

        trackTime(timeDetails, allDatapointsStartTime, Date.now(), 'All datapoint query Details');

        const alldpStartTime = Date.now();
        for (let i = 0; i < allDatapoints?.length; i++) {
            if (allDatapoints[i].id == datapointId) {
                // find memberName
                index = allDatapoints.indexOf(allDatapoints[i]);
                prevDatapoint = (index - 1) >= 0 ? getPreviousNextDataPoints(allDatapoints[index - 1], taskDetails, year, memberId, memberName) : {};
                nextDatapoint = (index + 1) <= allDatapoints?.length - 1 ? getPreviousNextDataPoints(allDatapoints[index + 1], taskDetails, year, memberId, memberName) : {};
                break;
            }
        }

        trackTime(timeDetails, alldpStartTime, Date.now(), 'All loopDatapoints Details');

        let childDp = [];
        let sourceDetails = {
            url: '',
            sourceName: "",
            value: "",
            publicationDate: '',
            sourceFile: ''
        };

        switch (memberType) {
            case STANDALONE:
                let currentHistoryAllStandaloneDetailsStartTime = Date.now()
                const [currentAllStandaloneDetails, historyAllStandaloneDetails] =
                    await Promise.all([
                        StandaloneDatapoints.find(currentQuery).populate('datapointId')
                            .populate('companyId')
                            .populate('taskId')
                            .populate('uom'), ,
                        StandaloneDatapoints.find(historyQuery),
                    ])
                trackTime(timeDetails, currentHistoryAllStandaloneDetailsStartTime, Date.now(), 'Current and History All standalone Details');

                historyAllStandaloneDetails?.map((historyYearData) => {
                    let historyYearObject = {}
                    historyYearObject[historyYearData?.year] = historyYearData?.response;
                    historicalYears.push(historyYearObject)
                });
                datapointsObject = {
                    ...datapointsObject,
                    status: ''
                }
                let CurrentYearLoopStartTime = Date.now();
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex]) {
                            datapointsObject.comments.push(object.comments);
                            datapointsObject.comments.push(object.rejectComment)
                        }
                    });

                    let currentYearStandaloneLoopStartTime = Date.now()
                    for (let currentIndex = 0; currentIndex < currentAllStandaloneDetails.length; currentIndex++) {
                        const object = currentAllStandaloneDetails[currentIndex];
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], taskId, datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId == datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot); //here we need to update the errorCaughtbyRep screenshot
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = {
                                ...currentDatapointsObject,
                                comments: object.comments,
                            }
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = {
                                ...currentDatapointsObject,
                                comments: []
                            }
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        }

                        if (currentIndex == currentAllStandaloneDetails.length - 1) {
                            trackTime(timeDetails, currentYearStandaloneLoopStartTime, Date.now(), `Standalone Loop `);
                        }
                    };

                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues);
                        currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, true, false);
                        datapointsObject.status = YetToStart;
                    }

                    childDp = await getChildDp(datapointId, currentDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id, uomValues, placeValues)
                    currentDatapointsObject.childDp = childDp;
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);

                    if (currentYearIndex == currentYear.length - 1) {
                        trackTime(timeDetails, CurrentYearLoopStartTime, Date.now(), `Current Year Standalone Loop `);

                    }
                }

                if (chilDpHeaders && chilDpHeaders.length > 2) {
                    chilDpHeaders.push({
                        id: chilDpHeaders.length + 2,
                        displayName: "Source",
                        fieldName: "source",
                        dataType: "Select",
                        options: sourceTypeDetails,
                        isRequired: true,
                        orderNumber: chilDpHeaders.length + 2
                    })
                }

                return res.status(200).send({
                    status: 200,
                    message: "Data collection dp codes retrieved successfully!",
                    response: { prevDatapoint, nextDatapoint, chilDpHeaders, dpTypeValues, displayFields, historicalYears, timeDetails, dpCodeData: datapointsObject },



                });
            case BOARD_MATRIX:
                const [currentAllBoardMemberMatrixDetails, historyAllBoardMemberMatrixDetails] = await Promise.all([
                    BoardMembersMatrixDataPoints.find({
                        ...currentQuery,
                        memberName: memberName
                    }).populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'), ,
                    BoardMembersMatrixDataPoints.find({
                        ...historyQuery,
                        memberName: memberName,
                    })
                ]);
                historyAllBoardMemberMatrixDetails?.map((historyYearData) => {
                    let historyYearObject = {}
                    historyYearObject[historyYearData?.year] = historyYearData?.response;
                    historicalYears.push(historyYearObject)
                });
                // historyYear = _.orderBy(_.uniqBy(historyAllBoardMemberMatrixDetails, 'year'), 'year', 'desc');
                // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

                datapointsObject = {
                    ...datapointsObject,
                    status: ''
                }
                let currentYearLoopBoardMemberStartTime = Date.now()
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex]
                            && object.memberName == memberName) {
                            datapointsObject.comments.push(object.comments);
                            datapointsObject.comments.push(object.rejectComment)
                        }
                    });

                    let currentYearLoopBoardMemberStartTime = Date.now()
                    for (let currentIndex = 0; currentIndex < currentAllBoardMemberMatrixDetails.length; currentIndex++) {
                        const object = currentAllBoardMemberMatrixDetails[currentIndex];
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], taskId, datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId == datapointId && object.year == currentYear[currentYearIndex];

                        if (condition && object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0] ? (errorDetailsObject[0]?.errorCaughtByRep ? (errorDetailsObject[0]?.errorCaughtByRep.screenShot ? errorDetailsObject[0]?.errorCaughtByRep.screenShot : []) : []) : []);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);

                        }
                        datapointsObject.status = 'Completed';

                    };
                    trackTime(timeDetails, currentYearLoopBoardMemberStartTime, Date.now(), `BoardMatrix Loop `);

                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues)
                        currentDatapointsObject = {
                            ...currentDatapointsObject,
                            memberName: memberName
                        }

                        currentDatapointsObject = getDisplayFields(dpTypeValues, displayFields, currentAllBoardMemberMatrixDetails, '', currentDatapointsObject, true, false);
                        datapointsObject.status = YetToStart;
                    }
                    childDp = await getChildDp(datapointId, currentDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id, uomValues, placeValues)
                    currentDatapointsObject.childDp = childDp;
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
                }
                trackTime(timeDetails, currentYearLoopBoardMemberStartTime, Date.now(), `Current Year BoardMatrix Loop `);

                // for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                //     let historicalDatapointsObject = {};
                //     for (let historyBoardMemberIndex = 0; historyBoardMemberIndex < historyAllBoardMemberMatrixDetails.length; historyBoardMemberIndex++) {
                //         let object = historyAllBoardMemberMatrixDetails[historyBoardMemberIndex];
                //         [s3DataScreenshot, sourceDetails] = await Promise.all([
                //             getS3ScreenShot(object.screenShot),
                //             getSourceDetails(object, sourceDetails)
                //         ]);
                //         if (object.year == historyYear[hitoryYearIndex].year && object.memberName == memberName) {
                //             historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues);
                //             historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllBoardMemberMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
                //             childDp = await getChildDp(datapointId, historicalDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id, uomValues, placeValues)
                //             historicalDatapointsObject.childDp = childDp;
                //             datapointsObject.historicalData.push(historicalDatapointsObject);
                //         }
                //     }
                // }

                if (chilDpHeaders && chilDpHeaders.length > 2) {
                    chilDpHeaders.push({
                        id: chilDpHeaders.length + 2,
                        displayName: "Source",
                        fieldName: "source",
                        dataType: "Select",
                        options: sourceTypeDetails,
                        isRequired: true,
                        orderNumber: chilDpHeaders.length + 2
                    })
                }

                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    response: {
                        prevDatapoint,
                        nextDatapoint,
                        chilDpHeaders,
                        dpTypeValues,
                        displayFields,
                        historicalYears,
                        timeDetails,
                        dpCodeData: datapointsObject
                    }
                });
            case KMP_MATRIX:
                let currentHistoryAllKmpMatrixDetailsStartTime = Date.now()
                const [currentAllKmpMatrixDetails, historyAllKmpMatrixDetails] =
                    await Promise.all([
                        KmpMatrixDataPoints.find({
                            ...currentQuery,
                            memberName: memberName
                        }).populate('datapointId')
                            .populate('companyId')
                            .populate('taskId')
                            .populate('uom'), ,
                        KmpMatrixDataPoints.find({
                            ...historyQuery,
                            memberName: memberName
                        })
                    ]);
                trackTime(timeDetails, currentHistoryAllKmpMatrixDetailsStartTime, Date.now(), `Current and history Kmp`);

                historyAllKmpMatrixDetails?.map((historyYearData) => {
                    let historyYearObject = {};
                    historyYearObject[historyYearData?.year] = historyYearData?.response;
                    historicalYears.push(historyYearObject)
                });
                // historyYear = _.orderBy(_.uniqBy(historyAllKmpMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: YetToStart
                }
                // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
                const startKmpLoop = Date.now();
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex] && object.memberName == memberName) {
                            datapointsObject.comments.push(object.comments);
                            datapointsObject.comments.push(object.rejectComment)
                        }
                    });
                    let currentYearLoopKmpMatrixDetailsLoopStartTime = Date.now()
                    for (let currentIndex = 0; currentIndex < currentAllKmpMatrixDetails.length; currentIndex++) {
                        const object = currentAllKmpMatrixDetails[currentIndex];
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], taskId, datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId == datapointId && object.year == currentYear[currentYearIndex];
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
                        if (currentIndex == currentAllKmpMatrixDetails.length - 1) {
                            trackTime(timeDetails, currentYearLoopKmpMatrixDetailsLoopStartTime, Date.now(), `Kmp Loop`);

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
                    childDp = await getChildDp(datapointId, currentDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id, uomValues, placeValues)
                    currentDatapointsObject.childDp = childDp;
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
                    if (currentYearIndex == currentYear.length - 1) {
                        trackTime(timeDetails, startKmpLoop, Date.now(), `Kmp year Loop`);

                    }
                }


                // for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
                //     let historicalDatapointsObject = {};
                //     for (let historyKMPMemerIndex = 0; historyKMPMemerIndex < historyAllKmpMatrixDetails.length; historyKMPMemerIndex++) {
                //         let object = historyAllKmpMatrixDetails[historyKMPMemerIndex];
                //         [s3DataScreenshot, sourceDetails] = await Promise.all([
                //             getS3ScreenShot(object.screenShot),
                //             getSourceDetails(object, sourceDetails)
                //         ]);
                //         if (object.datapointId.id == dpTypeValues.id
                //             && object.year == historyYear[hitoryYearIndex].year
                //             && object.memberName == memberName) {
                //             historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues)
                //             historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllKmpMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
                //             childDp = await getChildDp(datapointId, historicalDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id, uomValues, placeValues)
                //             historicalDatapointsObject.childDp = childDp;
                //             datapointsObject.historicalData.push(historicalDatapointsObject);
                //         }

                //     }
                // }
                if (chilDpHeaders && chilDpHeaders.length > 2) {
                    chilDpHeaders.push({
                        "id": chilDpHeaders.length + 2,
                        "displayName": "Source",
                        "fieldName": "source",
                        "dataType": "Select",
                        "options": sourceTypeDetails,
                        "isRequired": true,
                        "orderNumber": chilDpHeaders.length + 2
                    })
                }


                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    response: {
                        prevDatapoint,
                        nextDatapoint,
                        chilDpHeaders,
                        dpTypeValues,
                        displayFields,
                        timeDetails,
                        historicalYears,
                        dpCodeData: datapointsObject
                    }
                });
            default:
                return res.status(409).json({
                    message: 'Invalid Member Type.'
                });
                break;
        }
    } catch (error) {
        return res.status(409).json({
            message: error.message
        });
    }
}

function trackTime(arr, startTime, endTime, blockName) {

    arr.push({
        blockName,
        timeTaken: endTime - startTime
    });

}
