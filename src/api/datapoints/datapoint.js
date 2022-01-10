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
import { TaxonomyUoms } from '../taxonomy_uoms';
import { Measures } from '../measures';
import { PlaceValues } from '../place_values';
import { fetchFileFromS3 } from "../../services/utils/aws-s3";
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';;
import { QA } from '../../constants/roles';
import { SELECT, STATIC } from '../../constants/dp-datatype';
import { YetToStart, Completed } from '../../constants/task-status';

const requiredFields = [
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
    "standaloneOrMatrix",
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

export const datapointDetails = async (req, res, next) => {
    try {
        const [taskDetails, functionId, measureTypes, allPlaceValues] = await Promise.all([
            TaskAssignment.findOne({
                _id: req.body.taskId
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
        const currentYear = req.body.year.split(',');
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
                _id: req.body.datapointId,
                status: true
            }).populate('keyIssueId').populate('categoryId'),
            ErrorDetails.find({
                taskId: req.body.taskId,
                companyId: taskDetails.companyId.id,
                datapointId: req.body.datapointId,
                year: {
                    $in: currentYear
                },
                status: true
            }).populate('errorTypeId'),
            CompanySources.find({ companyId: taskDetails.companyId.id })
        ]);
        let dpMeasureType = measureTypes.filter(obj => obj.measureName == dpTypeValues.measureType);
        let dpMeasureTypeId = dpMeasureType.length > 0 ? dpMeasureType[0].id : null;
        let taxonomyUoms = await TaxonomyUoms.find({
            measureId: dpMeasureTypeId,
            clientTaxonomyId: taskDetails.companyId.clientTaxonomyId.id,
            status: true
        }).populate('measureUomId');
        let placeValues = [], uomValues = [];

        if (dpTypeValues && dpTypeValues.measureType != null && dpTypeValues.measureType != "NA" && dpTypeValues.measureType) {
            for (let uomIndex = 0; uomIndex < taxonomyUoms.length; uomIndex++) {
                const element = taxonomyUoms[uomIndex];
                uomValues.push({ value: element.measureUomId.id, label: element.measureUomId.uomName });
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
            });
        });

        const [currentQuery, historyQuery] = [
            {
                taskId: req.body.taskId,
                companyId: taskDetails.companyId.id,
                datapointId: req.body.datapointId,
                year: {
                    $in: currentYear
                },
                isActive: true,
                status: true
            }, {
                companyId: taskDetails.companyId.id,
                datapointId: req.body.datapointId,
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
        let index, prevDatapoint, nextDatapoint;
        const allDatapoints = await Datapoints.distinct('_id', { status: true });
        console.log(allDatapoints[0]);

        allDatapoints.map(datapoint => {
            if (datapoint.id === req.body.datapointId) {
                index = allDatapoints.indexOf(datapoint);
            }
        });

        switch (req.body.memberType) {
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

                prevDatapoint = Number.isFinite(index) ? allDatapoints[index - 1] ? allDatapoints[index - 1].id : '' : '';
                nextDatapoint = Number.isFinite(index) ? allDatapoints[index + 1] ? allDatapoints[index + 1].id : '' : '';


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
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], req.body.taskId, req.body.datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot); //here we need to update the errorCaughtbyRep screenshot
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllStandaloneDetails, currentYear[currentIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = {
                                ...currentDatapointsObject,
                                comments: object.comments,
                            }
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllStandaloneDetails, currentYear[currentIndex], currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = {
                                ...currentDatapointsObject,
                                comments: []
                            }
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllStandaloneDetails, currentYear[currentIndex], currentDatapointsObject, false, true);
                        }
                        datapointsObject.status = 'Completed';
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues);
                        currentDatapointsObject = getDisplayFields(displayFields, currentAllStandaloneDetails, currentYear[currentYearIndex], currentDatapointsObject, true, false);
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
                            historicalDatapointsObject = getDisplayFields(displayFields, historyAllStandaloneDetails, historyYear[historicalYearIndex].year, historicalDatapointsObject, false, false);
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
                        memberName: req.body.memberName
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom'),
                    BoardMembersMatrixDataPoints.find({
                        ...historyQuery,
                        memberName: req.body.memberName,
                    }).populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                        .populate('uom')
                ]);
                // TODO: Getting prev and next value.
                allDatapoints.map(boardmatrix => {
                    if (boardmatrix.datapointId_.id === req.body.datapointId) {
                        index = allBoardmatrix.indexOf(boardmatrix);
                    }
                });
               
                prevDatapoint = Number.isFinite(index) ? allDatapoints[index - 1] ? allDatapoints[index - 1].id : '' : '';
                nextDatapoint = Number.isFinite(index) ? allDatapoints[index + 1] ? allDatapoints[index + 1].id : '' : '';

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
                            && object.memberName == req.body.memberName) {
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
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], req.body.taskId, req.body.datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentIndex], currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues);
                            currentDatapointsObject = { ...currentDatapointsObject, comments: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0] ? (errorDetailsObject[0]?.errorCaughtByRep ? (errorDetailsObject[0]?.errorCaughtByRep.screenShot ? errorDetailsObject[0]?.errorCaughtByRep.screenShot : []) : []) : []);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllBoardMemberMatrixDetails, currentYear[currentIndex], currentDatapointsObject, false, true);

                        }
                        datapointsObject.status = 'Completed';
                    };
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues)
                        currentDatapointsObject = {
                            ...currentDatapointsObject,
                            memberName: req.body.memberName
                        }

                        currentDatapointsObject = getDisplayFields(displayFields, currentAllBoardMemberMatrixDetails, '', currentDatapointsObject, true, false);
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
                        if (object.year == historyYear[hitoryYearIndex].year && object.memberName == req.body.memberName) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues);
                            historicalDatapointsObject = getDisplayFields(displayFields, historyAllBoardMemberMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
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
                            memberName: req.body.memberName
                        })
                            .populate('createdBy')
                            .populate('datapointId')
                            .populate('companyId')
                            .populate('taskId')
                            .populate('uom'),
                        KmpMatrixDataPoints.find({
                            ...historyQuery,
                            memberName: req.body.memberName
                        }).populate('createdBy')
                            .populate('datapointId')
                            .populate('companyId')
                            .populate('taskId')
                            .populate('uom')
                    ]);

                // TODO: Getting prev and next value.
                allDatapoints.map(kmpmatrix => {
                    if (kmpmatrix.datapointId._id === req.body.datapointId) {
                        index = allKmpDetails.indexOf(kmpmatrix);
                    }
                });
               
                prevDatapoint = Number.isFinite(index) ? allDatapoints[index - 1] ? allDatapoints[index - 1].id : '' : '';
                nextDatapoint = Number.isFinite(index) ? allDatapoints[index + 1] ? allDatapoints[index + 1].id : '' : '';

                historyYear = _.orderBy(_.uniqBy(historyAllKmpMatrixDetails, 'year'), 'year', 'desc');
                datapointsObject = {
                    ...datapointsObject,
                    status: YetToStart
                }
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    let currentDatapointsObject = {};
                    _.filter(errorDataDetails, function (object) {
                        if (object.year == currentYear[currentYearIndex] && object.memberName == req.body.memberName) {
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
                        const { errorTypeId, errorDetailsObject } = getError(errorDataDetails, currentYear[currentYearIndex], req.body.taskId, req.body.datapointId);
                        [s3DataScreenshot, sourceDetails] = await Promise.all([
                            getS3ScreenShot(object.screenShot),
                            getSourceDetails(object, sourceDetails)
                        ]);
                        const condition = object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex];
                        if (condition && object.hasError == true) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues)
                            currentDatapointsObject = { ...currentDatapointsObject, comment: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);

                        } else if (condition && object.hasCorrection == true) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues)
                            currentDatapointsObject = { ...currentDatapointsObject, comment: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0]?.errorCaughtByRep.screenShot);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection == false && object.hasError == false) {
                            currentDatapointsObject = getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear[currentYearIndex], inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues)
                            currentDatapointsObject = { ...currentDatapointsObject, comment: [] };
                            s3DataRefErrorScreenshot = await getS3RefScreenShot(errorDetailsObject.length, errorDetailsObject[0] ? (errorDetailsObject[0]?.errorCaughtByRep ? (errorDetailsObject[0]?.errorCaughtByRep.screenShot ? errorDetailsObject[0]?.errorCaughtByRep.screenShot : []) : []) : []);
                            currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
                            currentDatapointsObject.error.refData['additionalDetails'] = [];
                            currentDatapointsObject = getDisplayFields(displayFields, currentAllKmpMatrixDetails, currentYear[currentYearIndex], currentDatapointsObject, false, true);
                        }
                    }
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getCurrentEmptyObject(dpTypeValues, currentYear[currentYearIndex], sourceTypeDetails, inputValues, uomValues, placeValues)
                        currentDatapointsObject = {
                            ...currentDatapointsObject,
                            memberName: req.body.memberName,
                        }
                        currentDatapointsObject = getDisplayFields(displayFields, currentAllKmpMatrixDetails, '', currentDatapointsObject, true, false)
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
                            && object.memberName == req.body.memberName) {
                            historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues)
                            historicalDatapointsObject = getDisplayFields(displayFields, historyAllKmpMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
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

export function getError(errorDataDetails, currentYear, taskId, datapointId) {
    const errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == datapointId
        && obj.year == currentYear
        && obj.taskId == taskId);
    const errorTypeId = (errorDetailsObject.length > 0) && (errorDetailsObject[0].raisedBy == QA) ?
        errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '' : '';
    return { errorTypeId, errorDetailsObject };
}

export async function getS3ScreenShot(screenShot) {
    let s3DataScreenshot = [];
    if (screenShot && screenShot.length > 0) {
        for (let screenShotIndex = 0; screenShotIndex < screenShot.length; screenShotIndex++) {
            let obj = screenShot[screenShotIndex];
            let screenShotFileName = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, obj).catch((error) => {
                screenShotFileName = "No screenshot";
            });
            if (screenShotFileName == undefined) {
                screenShotFileName = "";
            }
            s3DataScreenshot.push({ uid: screenShotIndex, name: obj, url: screenShotFileName });
        }
    }
    return s3DataScreenshot;
}

export async function getSourceDetails(object, sourceDetails) {
    if (object.sourceName !== "" || object.sourceName !== " ") {
        let companySourceId = object.sourceName?.split(';')[1];
        let sourceValues = {}, findQuery = {};
        findQuery = companySourceId ? { _id: companySourceId ? companySourceId : null } : { companyId: object.companyId ? object.companyId.id : null, sourceFile: object.sourceFile ? object.sourceFile : null };
        sourceValues = findQuery ? await CompanySources.findOne(findQuery).catch((error) => { return sourceDetails }) : {};
        if (sourceValues != null) {
            sourceDetails.url = sourceValues.sourceUrl;
            sourceDetails.publicationDate = sourceValues.publicationDate;
            sourceDetails.sourceName = sourceValues.name;
            sourceDetails.value = sourceValues._id;
        }
    }
    return sourceDetails;
}

export function getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear, inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues) {
    return {
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
            selectedUom: object?.uom ? { value: object?.uom.id, label: object?.uom.uomName } : null
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
        error: {
            hasError: object?.hasError,
            isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
            raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
            type: errorTypeId,
            refData: errorDetailsObject[0] ? errorDetailsObject[0]?.errorCaughtByRep : {},
            comment: errorDetailsObject[0] ? errorDetailsObject[0]?.comments.content : '',
            errorStatus: object?.correctionStatus
        },
        additionalDetails: []
    }
}

export function getCurrentEmptyObject(dpTypeValues, currentYear, sourceTypeDetails, inputValues, uomValues, placeValues) {
    return {
        status: YetToStart,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        fiscalYear: currentYear,
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        subDataType: {
            measure: dpTypeValues?.measureType,
            placeValues: placeValues,
            selectedPlaceValue: null,
            uoms: uomValues,
            selectedUom: null
        },
        inputValues: inputValues,
        textSnippet: '',
        pageNo: '', //Restated TODO
        optionalAnalystComment: '',
        isRestated: '',
        restatedForYear: '',
        restatedInYear: '',
        restatedValue: '',
        screenShot: [],
        response: '',
        sourceList: sourceTypeDetails,
        source: {
            url: '',
            sourceName: '',
            value: '',
            publicationDate: ''
        },
        error: {},
        comments: [],
        additionalDetails: []
    }
}

export async function getS3RefScreenShot(errorDetailLength, screenshot) {
    let s3DataRefErrorScreenshot = [];
    if (errorDetailLength > 0 && screenshot && screenshot.length > 0) {
        for (let refErrorScreenShotIndex = 0; refErrorScreenShotIndex < screenshot.length; refErrorScreenShotIndex++) {
            let obj = screenshot[refErrorScreenShotIndex];
            let screenShotFileName = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, obj).catch((error) => {
                screenShotFileName = "No screenshot";
            });
            if (screenShotFileName == undefined) {
                screenShotFileName = "";
            }
            s3DataRefErrorScreenshot.push({ uid: refErrorScreenShotIndex, name: obj, url: screenShotFileName });
        }
    }
    return s3DataRefErrorScreenshot

}

export function getDisplayFields(displayFields, currentDpType, currentYear, currentDatapointsObject, isEmpty, isRefDataExists) {
    displayFields.map(display => {
        if (!requiredFields.includes(display?.fieldName)) {
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
                    currentValue = dpTypeValues?.additionalDetails[display.fieldName];
                    break;
                default:
                    if (isEmpty) {
                        currentValue = display.inputType == 'Select' ?
                            { value: '', label: '' } : '';
                    } else {
                        optionVal = display.inputValues;
                        let standaloneDetail = currentDpType.find((obj) => obj.year == currentYear);
                        if (standaloneDetail) {
                            currentValue = display.inputType == SELECT ?
                                {
                                    value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[display.fieldName] : '',
                                    label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[display.fieldName] : ''
                                }
                                : standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[display.fieldName] : '';
                        }
                    }
                    break;
            }
            currentDatapointsObject.additionalDetails.push({
                fieldName: display.fieldName,
                name: display.name,
                value: currentValue ? currentValue : '',
                inputType: display.inputType,
                inputValues: optionValues.length > 0 ? optionValues : optionVal
            });
            !isEmpty && isRefDataExists && currentDatapointsObject.error.refData['additionalDetails'].push({
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

export function getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, year, uomValues, placeValues) {
    return {
        status: Completed,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        taskId: object?.taskId,
        fiscalYear: year,
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        subDataType: {
            measure: dpTypeValues?.measureType,
            placeValues: placeValues,
            selectedPlaceValue: object?.placeValue ? { value: object?.placeValue, label: object?.placeValue } : null,
            uoms: uomValues,
            selectedUom: object?.uom ? { value: object?.uom.id, label: object?.uom.uomName } : null
        },
        textSnippet: object?.textSnippet,
        pageNo: object?.pageNumber,
        optionalAnalystComment: object?.optionalAnalystComment ? object?.optionalAnalystComment : '',
        isRestated: object?.isRestated ? object?.isRestated : '',
        restatedForYear: object?.restatedForYear ? object?.restatedForYear : '',
        restatedInYear: object?.restatedInYear ? object?.restatedInYear : '',
        restatedValue: object?.restatedValue ? object?.restatedValue : '',
        screenShot: s3DataScreenshot,
        response: object?.response,
        sourceList: sourceTypeDetails,
        source: sourceDetails,
        error: {},
        comments: [],
        additionalDetails: []
    }
}

