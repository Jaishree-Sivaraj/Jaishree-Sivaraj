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
import { fetchFileFromS3 } from "../../services/utils/aws-s3";
import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from '../../constants/dp-type.js';
import { SELECT, STATIC } from '../../constants/dp-datatype';
import { QA } from '../../constants/roles';
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
    "year"
];
export const datapointDetails = async (req, res, next) => {
    try {
        const [taskDetails, functionId] = await Promise.all([
            TaskAssignment.findOne({
                _id: req.body.taskId
            }).populate({
                path: "companyId",
                populate: {
                    path: "clientTaxonomyId"
                }
            }).populate('categoryId'),
            // all negative news function.
            Functions.findOne({
                functionType: "Negative News",
                status: true
            })
        ]);

        // Taxonomy fields
        const clienttaxonomyFields = await ClientTaxonomy.find({
            _id: taskDetails.companyId.clientTaxonomyId.id
        }).distinct('fields');

        const [currentYear, displayFields] = [
            req.body.year.split(','),
            clienttaxonomyFields.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Controversy')
        ];

        const [
            dpTypeValues,
            errorDataDetails, companySourceDetails] = await Promise.all([
                Datapoints?.findOne({
                    dataCollection: 'Yes',
                    functionId: {
                        "$ne": functionId.id
                    },
                    categoryId: taskDetails.categoryId.id,
                    _id: req.body.datapointId,
                    status: true
                }).populate('keyIssueId').populate('categoryId'),
                // Error Details
                ErrorDetails.find({
                    taskId: req.body.taskId,
                    companyId: taskDetails?.companyId?.id,
                    datapointId: req.body?.datapointId,
                    year: {
                        $in: currentYear
                    },
                    status: true
                }).populate('errorTypeId'),
                // CompanySource
                CompanySources.find({
                    companyId: taskDetails.companyId.id ? taskDetails.companyId.id : null
                })
            ]);

        //* mapping all required field from CompanySource in an array.
        let sourceTypeDetails = [];
        companySourceDetails.map(async (companySource) => {
            sourceTypeDetails.push({
                sourceName: companySource.name,
                value: companySource.id,
                url: companySource.sourceUrl,
                publicationDate: companySource.publicationDate
            })
        });

        // Initailising datapointObjectOutside.  
        let [datapointsObject, sourceDetails] = [{
            dpCode: dpTypeValues?.code ? dpTypeValues.code : '',
            dpCodeId: dpTypeValues?.id ? dpTypeValues.id : '',
            dpName: dpTypeValues?.name ? dpTypeValues.name : '',
            companyId: taskDetails?.companyId.id ? taskDetails.companyId.id : '',
            companyName: taskDetails?.companyId?.companyName ? taskDetails.companyId.companyName : '',
            keyIssueId: dpTypeValues?.keyIssueId?.id ? dpTypeValues.keyIssueId.id : '',
            keyIssue: dpTypeValues?.keyIssueId?.keyIssueName ? dpTypeValues.keyIssueId.keyIssueName : '',
            pillarId: dpTypeValues?.categoryId?.id ? dpTypeValues.categoryId.id : '',
            pillar: dpTypeValues?.categoryId?.categoryName ? dpTypeValues.categoryId.categoryName : '',
            fiscalYear: taskDetails.year,
            comments: [],
            currentData: [],
            historicalData: [],
            status: ''
        }, {
            url: '',
            sourceName: "",
            value: "",
            publicationDate: ''
        }
        ]

        let inputValues = [];
        if (dpTypeValues?.dataType == 'Select') {
            const inputs = dpTypeValues.unit.split('/');
            inputs.map(input => {
                inputValues.push({
                    label: input,
                    value: input
                });
            });
        }

        const [currentQuery, historyQuery] = [{
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
        }];

        let errorTypeId, errorDetailsObject;
        let historicalDatapointsObject = {};
        let uniqueYear, historyYear, totalHistories;
        switch (req.body.memberType) {
            case STANDALONE:
                const [currentAllStandaloneDetails, historyAllStandaloneDetails] = await Promise.all([
                    StandaloneDatapoints.find(currentQuery)
                        .populate('createdBy') //!check if it being.
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId'),
                    StandaloneDatapoints.find(historyQuery)
                        .populate('createdBy') //!check if it being.
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')
                ]);
                uniqueYear = _.uniqBy(historyAllStandaloneDetails, 'year');
                historyYear = _.orderBy(uniqueYear, 'year', 'desc');
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
                // current year data
                for (let i = 0; i < currentYear.length; i++) {
                    let currentDatapointsObject = {};
                    const currentyear = currentYear[i];
                    const data = errorDataDetails.filter(error => error.year == currentyear);
                    data?.map(d => {
                        datapointsObject.comments.push(d.comments)
                        datapointsObject.comments.push(d.rejectComment)
                    });
                    for (let j = 0; j < currentAllStandaloneDetails.length; j++) {
                        const object = currentAllStandaloneDetails[j];
                        const [s3DataScreenshot, sourceDetails] = await Promise.all([
                            CaptureScreenShot(object?.screenShot),
                            getSourceDetails(object?.sourceName, sourceDetails)
                        ]);
                        errorDetailsObject = errorDataDetails.filter(error =>
                            error.datapointId == req.body.datapointId
                            && error.year == currentyear
                            && error.taskId == req.body.taskId);

                        errorTypeId = errorDetailsObject?.length > 0 && errorDetailsObject[0]?.raisedBy == QA ?
                            errorDetailsObject[0]?.errorTypeId ? errorDetailsObject[0]?.errorTypeId.errorType : '' : '';
                        const condition = object.datapointId.id == req.body.datapointId && object.year == currentyear;

                        if (condition && object.hasError) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, [], currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, object?.comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);
                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, [], currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);
                        }
                        datapointsObject.status = Completed;
                    }

                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getEmptyDataObject(dpTypeValues, undefined, sourceTypeDetails, inputValues, currentyear)
                        //  last argument, isCurrentDatapointsObjectEmpty, isCurrent
                        addDisplayFunction(displayFields, dpTypeValues, null, currentDatapointsObject, false, true);
                        datapointsObject.status = YetToStart;
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
                }// End of current year.

                // Historical Data.
                for (let historicalYearIndex = 0; historicalYearIndex < totalHistories; historicalYearIndex++) {
                    for (let j = 0; j < historyAllStandaloneDetails.length; j++) {
                        const object = historyAllStandaloneDetails[j];
                        await CaptureScreenShot(object?.screenShot);
                        await getSourceDetails(object?.sourceName, sourceDetails);
                        if (object.year == historyYear[historicalYearIndex].year) {
                            historicalDatapointsObject = getHistoryDetail(dpTypeValues, object, sourceTypeDetails, sourceDetails)
                            addDisplayFunction(displayFields, dpTypeValues, object, historicalDatapointsObject, false, false);
                        }
                        datapointsObject.historicalData.push(historicalDatapointsObject);
                    }

                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    dpCodeData: datapointsObject
                });
            case BOARD_MATRIX:
                const [currentAllBoardMemberMatrixDetails, historyAllBoardMemberMatrixDetails] = await Promise.all([
                    BoardMembersMatrixDataPoints.find({
                        ...currentQuery,
                        memberName: req.body.memberName
                    })
                        .populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId'),
                    BoardMembersMatrixDataPoints.find({
                        ...historyQuery,
                        memberName: req.body.memberName
                    })
                        .populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId')]);

                uniqueYear = _.uniqBy(historyAllBoardMemberMatrixDetails, 'year');
                historyYear = _.orderBy(uniqueYear, 'year', 'desc');
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
                // Current year data.
                for (let i = 0; i < currentYear.length; i++) {
                    const currentyear = currentYear[i];
                    let currentDatapointsObject = {}
                    const errDetails = errorDataDetails.filter((error) => error.year == currentyear);
                    errDetails.map((err) => {
                        datapointsObject.comments.push(err.comments);
                        datapointsObject.comments.push(err.rejectComment)
                    });
                    for (let j = 0; j < currentAllBoardMemberMatrixDetails.length; j++) {
                        const object = currentAllBoardMemberMatrixDetails[j];
                        errorDetailsObject = errorDataDetails.filter(error =>
                            error.datapointId == req.body.datapointId
                            && error.year == currentyear
                            && error.memberName == req.body.memberName
                            && error.taskId == req.body.taskId);

                        errorTypeId = errorDetailsObject?.length > 0 && errorDetailsObject[0]?.raisedBy == QA ?
                            errorDetailsObject[0]?.errorTypeId ? errorDetailsObject[0]?.errorTypeId.errorType : '' : '';

                        const condition = object.datapointId.id == req.body.datapointId && object.year == currentyear;
                        const [s3DataScreenshot, sourceDetails] = await Promise.all([
                            CaptureScreenShot(object?.screenShot),
                            getSourceDetails(object?.sourceName, sourceDetails)
                        ]);

                        if (condition && object.hasError) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);

                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);

                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);
                        }
                        datapointsObject.status = Completed;
                    }
                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getEmptyDataObject(dpTypeValues, req.body?.memberName, sourceTypeDetails, inputValues, currentyear)
                        addDisplayFunction(displayFields, dpTypeValues, null, currentDatapointsObject, true, true);
                        datapointsObject.status = YetToStart;
                    }
                    datapointsObject.comments = datapointsObject.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject.currentData.push(currentDatapointsObject);
                }

                // Historical year data.
                for (let historyYearIndex = 0; historyYearIndex < totalHistories; historyYearIndex++) {
                    for (let i = 0; i < historyAllBoardMemberMatrixDetails.length; i++) {
                        const object = historyAllBoardMemberMatrixDetails[i];
                        await CaptureScreenShot(object?.screenShot);
                        sourceDetails = await getSourceDetails(sourceName, sourceDetails);
                        if (object.year == historyYear[historyYearIndex].year && object.memberName == req.body.memberName) {
                            historicalDatapointsObject = getHistoryDetail(dpTypeValues, object, sourceTypeDetails, sourceDetails)
                            addDisplayFunction(displayFields, dpTypeValues, currentData, historicalDatapointsObject, false, true);
                            datapointsObject.historicalData.push(historicalDatapointsObject);
                        }
                    }
                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    dpCodeData: datapointsObject
                });
            case KMP_MATRIX:
                const [currentAllKmpMatrixDetails, historyAllKmpMatrixDetails] = await Promise.all([
                    KmpMatrixDataPoints.find({
                        ...currentQuery,
                        memberName: req.body.memberName
                    })
                        .populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId'),
                    KmpMatrixDataPoints.find({
                        ...historyQuery,
                        memberName: req.body.memberName
                    })
                        .populate('createdBy')
                        .populate('datapointId')
                        .populate('companyId')
                        .populate('taskId'),

                ]);
                uniqueYear = _.uniqBy(historyAllKmpMatrixDetails, 'year');
                historyYear = _.orderBy(uniqueYear, 'year', 'desc');
                totalHistories = historyYear.length > 5 ? 5 : historyYear.length; // Current year KMP data
                for (let i = 0; i < currentYear?.length; i++) {
                    const currentyear = currentYear[i];
                    let currentDatapointsObject = {}
                    const errDetails = errorDataDetails.filter((error) => error.year == currentyear);
                    errDetails.map((err) => {
                        datapointsObject.comments.push(err.comments);
                        datapointsObject.comments.push(err.rejectComment)
                    });
                    for (let j = 0; j < currentAllKmpMatrixDetails.length; j++) {
                        const object = currentAllKmpMatrixDetails[j];
                        errorDetailsObject = errorDataDetails.filter(error =>
                            error.datapointId == req.body.datapointId
                            && error.year == currentyear
                            && error.memberName == req.body.memberName
                            && error.taskId == req.body.taskId);
                        errorTypeId = errorDetailsObject?.length > 0 && errorDetailsObject[0]?.raisedBy == QA ?
                            errorDetailsObject[0]?.errorTypeId ? errorDetailsObject[0]?.errorTypeId.errorType : '' : '';
                        const condition = object.datapointId.id == req.body.datapointId && object.year == currentyear;
                        const [s3DataScreenshot, sourceDetails] = await Promise.all([
                            CaptureScreenShot(object?.screenShot),
                            getSourceDetails(object?.sourceName, sourceDetails)
                        ]);

                        if (condition && object.hasError) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);
                        } else if (condition && object.hasCorrection) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);
                        } else if (condition && !object.hasCorrection && !object.hasError) {
                            currentDatapointsObject = assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId);
                            await CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject);
                            addDisplayFunction(displayFields, dpTypeValues, object, currentDatapointsObject, false, true);

                        }
                    }

                    if (Object.keys(currentDatapointsObject).length == 0) {
                        currentDatapointsObject = getEmptyDataObject(dpTypeValues, req.body?.memberName, sourceTypeDetails, inputValues, currentyear);
                        addDisplayFunction(displayFields, dpTypeValues, '', currentDatapointsObject, true, true);
                        datapointsObject.status = YetToStart;
                    }
                    datapointsObject.comments = datapointsObject?.comments.filter(value => Object.keys(value).length !== 0);
                    datapointsObject?.currentData.push(currentDatapointsObject);
                }

                // Historical KMP data.
                for (let historyYearIndex = 0; historyYearIndex < totalHistories; historyYearIndex++) {
                    for (let j = 0; j < historyAllKmpMatrixDetails.length; j++) {
                        const object = historyKmp;
                        const [s3DataScreenshot, sourceDetails] = await Promise.all([
                            CaptureScreenShot(object?.screenShot),
                            getSourceDetails(object?.sourceName, sourceDetails)]);
                        if (object.datapointId.id == dpTypeValues?.id
                            && object.year == historyYear[historyYearIndex]?.year
                            && object.memberName == req.body.memberName) {
                            historicalDatapointsObject = getHistoryDetail(dpTypeValues, object, sourceTypeDetails, sourceDetails)
                            addDisplayFunction(displayFields, dpTypeValues, currentData, historicalDatapointsObject, false, true);
                            datapointsObject.historicalData.push(historicalDatapointsObject);
                        }
                    }
                }
                return res.status(200).send({
                    status: "200",
                    message: "Data collection dp codes retrieved successfully!",
                    dpCodeData: datapointsObject
                });
                w
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Function that are needful
async function CaptureScreenShot(screenShot) {
    let s3DataScreenshot = [];
    let screenShotFileName;
    if (screenShot && screenShot.length > 0) {
        for (let screenShotIndex = 0; screenShotIndex < screenShot.length; screenShotIndex++) {
            let obj = screenShot[screenShotIndex];
            try {
                screenShotFileName = obj !== '' && !obj ? await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, obj) : undefined;

                if (!screenShotFileName) {
                    screenShotFileName = "";
                }
            } catch (error) {
                screenShotFileName = "No screenshot";
            }
            s3DataScreenshot.push({ uid: screenShotIndex, name: obj, url: screenShotFileName });
        }

    }
    return s3DataScreenshot;
}

async function getSourceDetails(sourceName, sourceDetails) {
    if (sourceName !== "" || sourceName !== " ") {
        let companySourceId = sourceName.split(';')[1];
        let sourceValues = await CompanySources.findOne({ _id: companySourceId ? companySourceId : null });
        if (sourceValues != null) {
            sourceDetails.url = sourceValues.sourceUrl;
            sourceDetails.publicationDate = sourceValues.publicationDate;
            sourceDetails.sourceName = sourceValues.name;
            sourceDetails.value = sourceValues._id;
        }
    }
    return sourceDetails;
}

async function CaptureRefScreenShot(errorDetailsObject, currentDatapointsObject) {
    let s3DataRefErrorScreenshot = [];
    let screenShotFileName;
    if (errorDetailsObject > 0
        && errorDetailsObject[0]?.errorCaughtByRep.screenShot
        && errorDetailsObject[0]?.errorCaughtByRep.screenShot.length > 0) {
        for (let refErrorScreenShotIndex = 0;
            refErrorScreenShotIndex < errorDetailsObject[0]?.errorCaughtByRep.screenShot.length;
            refErrorScreenShotIndex++) {
            let screenShot = errorDetailsObject[0]?.errorCaughtByRep.screenShot[refErrorScreenShotIndex];
            try {
                screenShotFileName = screenShot !== '' && !screenShot ? await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, screenShot) : undefined;
                if (!screenShotFileName) {
                    screenShotFileName = '';
                }
            } catch (error) {
                screenShotFileName = "No screenshot";
            }
            s3DataRefErrorScreenshot.push({ uid: refErrorScreenShotIndex, name: screenShot, url: screenShotFileName });

        }
    }
    currentDatapointsObject.error.refData.screenShot = s3DataRefErrorScreenshot;
    currentDatapointsObject.error.refData['additionalDetails'] = [];
    return s3DataRefErrorScreenshot;
}
// currentData is Dp type object
function addDisplayFunction(displayFields, dpTypeValues, currentData, dataPointObject, isCurrentDatapointsObjectEmpty, isCurrent) {
    displayFields.map(display => {
        if (!requiredFields.includes(display.fieldName)) {
            let optionValues = [], optionVal = '', currentValue;
            switch (display.inputType) {
                case SELECT:
                    const options = display.inputValues.split(',');
                    options.length > 0 ?
                        options.map(option => {
                            optionValues.push({
                                value: option,
                                label: option
                            });
                        }) : optionValues = [];
                    break;

                case STATIC:
                    currentValue = dpTypeValues.additionalDetails[display.fieldName];
                    break;

                default:
                    optionVal = display.inputValues;
                    if (!isCurrentDatapointsObjectEmpty) {
                        const details = currentData?.find((obj) => obj.year == currentyear);
                        currentValue = display.inputType == 'Select' ?
                            {
                                value: details.additionalDetails ?
                                    details.additionalDetails[display.fieldName]
                                    : '',
                                label: details.additionalDetails ?
                                    details.additionalDetails[display.fieldName]
                                    : ''
                            } :
                            details.additionalDetails ?
                                details.additionalDetails[display.fieldName]
                                : '';
                    } else {
                        currentValue = display.inputType == 'Select' ?
                            {
                                value: '',
                                label: ''
                            } :
                            ''
                    }

                    break;
            }
            // End of switch case
            isCurrent && dataPointObject.additionalDetails.push({
                fieldName: display.fieldName,
                name: display.name,
                value: currentValue ? currentValue : '',
                inputType: display.inputType,
                inputValues: optionValues.length > 0 ? optionValues : optionVal
            });

            !isCurrentDatapointsObjectEmpty && isCurrent && dataPointObject.error?.refData['additionalDetails'].push({
                fieldName: display.fieldName,
                name: display.name,
                value: currentValue ? currentValue : '',
                inputType: display.inputType,
                inputValues: optionValues.length > 0 ? optionValues : optionVal
            });

            //! check history 
            !isCurrentDatapointsObjectEmpty && !isCurrent && dataPointObject.additionalDetails.push({
                fieldName: display.fieldName,
                name: display.name,
                value: currentValue ? currentValue : '',
                inputType: display.inputType,
                inputValues: optionValues.length > 0 ? optionValues : optionVal
            });
        }
    });
}

function assignCurrentObject(dpTypeValues, object, errorDetailsObject, s3DataScreenshot, comments, currentyear, inputValues, sourceDetails, sourceTypeDetails, errorTypeId) {
    const currentDatapointsObject = {
        status: Completed,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        fiscalYear: currentyear,
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        inputValues: inputValues,
        textSnippet: object.textSnippet,
        pageNo: object.pageNumber,
        isRestated: object.isRestated ? object.isRestated : '',
        restatedForYear: object.restatedForYear ? object.restatedForYear : '',
        restatedInYear: object.restatedInYear ? object.restatedInYear : '',
        restatedValue: object.restatedValue ? object.restatedValue : '',
        screenShot: s3DataScreenshot,
        response: object.response,
        memberName: object.memberName,
        sourceList: sourceTypeDetails,
        source: sourceDetails,
        error: {
            hasError: object.hasError,
            isAccepted: errorDetailsObject.length > 0 ? errorDetailsObject[0]?.isErrorAccepted : '',
            raisedBy: errorDetailsObject.length > 0 ? errorDetailsObject[0]?.raisedBy : '',
            type: errorTypeId,
            refData: errorDetailsObject.length > 0 ? errorDetailsObject[0]?.errorCaughtByRep : {},
            comment: errorDetailsObject.length > 0 ? errorDetailsObject[0]?.comments.content : '',
            errorStatus: object.correctionStatus
        },
        comments: comments,
        additionalDetails: []
    }
    return currentDatapointsObject;
}

function getEmptyDataObject(dpTypeValues, memberName, sourceTypeDetails, inputValues, currentyear) {
    return {
        status: YetToStart,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        fiscalYear: currentyear,
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        inputValues: inputValues,
        memberName: memberName,
        textSnippet: '',
        pageNo: '', // Restated TODO
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

function getHistoryDetail(dpTypeValues, object, sourceTypeDetails, sourceDetails) {
    return {
        status: Completed,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        taskId: object.taskId,
        fiscalYear: object.year,
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        textSnippet: object.textSnippet,
        pageNo: object.pageNumber,
        isRestated: object.isRestated ? object.isRestated : '',
        restatedForYear: object.restatedForYear ? object.restatedForYear : '',
        restatedInYear: object.restatedInYear ? object.restatedInYear : '',
        restatedValue: object.restatedValue ? object.restatedValue : '',
        screenShot: s3DataScreenshot,
        response: object.response,
        standaradDeviation: object.standaradDeviation,
        average: object.average,
        sourceList: sourceTypeDetails,
        source: sourceDetails,
        error: {},
        comments: [],
        additionalDetails: []
    }
}