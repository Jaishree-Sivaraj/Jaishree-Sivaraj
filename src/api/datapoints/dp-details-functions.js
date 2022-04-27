'use strict';
import { fetchFileFromS3 } from "../../services/utils/aws-s3";
import { CompanySources } from '../companySources';
import { QA } from '../../constants/roles';
import { SELECT, STATIC } from '../../constants/dp-datatype';
import { YetToStart, Completed } from '../../constants/task-status';
import { ChildDp } from '../child-dp';
import { ClientTaxonomy } from '../clientTaxonomy';
import { Datapoints } from '../datapoints';
import { Measures } from '../measures';
import { MeasureUoms } from '../measure_uoms';
import { PlaceValues } from '../place_values';
import _ from "lodash";
import { sortArray } from '../../services/utils/sorting-string';

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
    let screenShotFileName;
    if (screenShot && Array.isArray(screenShot)) {
        if (screenShot && screenShot.length > 0) {
            for (let screenShotIndex = 0; screenShotIndex < screenShot.length; screenShotIndex++) {
                let obj = screenShot[screenShotIndex];
                if (process.env.NODE_ENV == 'production') {
                    screenShotFileName = await fetchFileFromS3(process.env.COMPANY_SOURCES_BUCKET_NAME, obj).catch((error) => {
                        screenShotFileName = "No screenshot";
                    });
                } else {
                    screenShotFileName = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, obj).catch((error) => {
                        screenShotFileName = "No screenshot";
                    });
                }
                if (screenShotFileName == undefined) {
                    screenShotFileName = "";
                }
                s3DataScreenshot.push({ uid: screenShotIndex, name: obj, url: screenShotFileName });
            }
        }
    } else {
        if (process.env.NODE_ENV == 'production') {
            screenShotFileName = await fetchFileFromS3(process.env.COMPANY_SOURCES_BUCKET_NAME, screenShot).catch((error) => {
                screenShotFileName = "No screenshot";
            });
        } else {
            screenShotFileName = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, screenShot).catch((error) => {
                screenShotFileName = "No screenshot";
            });
        }
        if (screenShotFileName == undefined) {
            screenShotFileName = "";
        }
        return { uid: 1, name: screenShot, url: screenShotFileName }

    }


    return s3DataScreenshot;
}

export async function getSourceDetails(object, sourceDetails) {
    if (object?.sourceName !== "" || object?.sourceName !== " ") {
        let companySourceId = object?.sourceName?.split(';')[1];
        let sourceValues = {}, findQuery = {};
        findQuery = companySourceId ? { _id: companySourceId } : { companyId: object?.companyId ? object.companyId.id : null, sourceFile: object?.sourceFile ? object?.sourceFile : null };
        let sourceValuesStartTime = Date.now()
        sourceValues = findQuery ? await CompanySources.findOne(findQuery)
            .populate('sourceTypeId')
            .catch((error) => { return sourceDetails }) : {};
        // let sourceValuesEndTime=Date.now()
        // timeDetails.push({
        //     blockName:' SourceValues Details',
        //     timeTaken:sourceValuesEndTime-sourceValuesStartTime
        // })
        if (sourceValues != null) {
            sourceDetails.url = sourceValues?.sourceUrl;
            sourceDetails.publicationDate = sourceValues?.publicationDate;
            sourceDetails.isPublicationDateRequired = sourceValues?.sourceTypeId?.typeName == 'Webpages' ? false : true;
            sourceDetails.sourceName = sourceValues?.name;
            sourceDetails.value = sourceValues?._id;
            sourceDetails.title = sourceValues?.sourceTitle;
            sourceDetails.sourceFile = sourceValues?.sourceFile ? sourceValues?.sourceFile : '';
        }
    }
    return sourceDetails;
}

export function getCurrentDatapointObject(s3DataScreenshot, dpTypeValues, currentYear, inputValues, object, sourceTypeDetails, sourceDetails, errorDetailsObject, errorTypeId, uomValues, placeValues, isSFDR) {
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
            selectedPlaceValue: object?.placeValue ? { value: object?.placeValue, label: object?.placeValue } : { value: "Number", label: "Number" },
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
        additionalDetails: [],
        isSFDR
    }
}

export function getCurrentEmptyObject(dpTypeValues, currentYear, sourceTypeDetails, inputValues, uomValues, placeValues, isSFDR) {
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
            selectedPlaceValue: { value: "Number", label: "Number" },
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
        additionalDetails: [],
        isSFDR
    }
}

export async function getS3RefScreenShot(errorDetailLength, screenshot) {
    let s3DataRefErrorScreenshot = [];
    if (errorDetailLength > 0 && screenshot && screenshot.length > 0) {
        for (let refErrorScreenShotIndex = 0; refErrorScreenShotIndex < screenshot.length; refErrorScreenShotIndex++) {
            let obj = screenshot[refErrorScreenShotIndex];
            let screenshotFileNameDetailsStartTime = Date.now()
            let screenShotFileName = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, obj).catch((error) => {
                screenShotFileName = "No screenshot";
            });
            // let screenshotFileNameDetailsEndTime=Date.now()
            // timeDetails.push({
            //     blockName:'get S3REFScreenshot',
            //     timeTaken:screenshotFileNameDetailsEndTime-screenshotFileNameDetailsStartTime

            // })
            if (screenShotFileName == undefined) {
                screenShotFileName = "";
            }
            s3DataRefErrorScreenshot.push({ uid: refErrorScreenShotIndex, name: obj, url: screenShotFileName });
        }
    }
    return s3DataRefErrorScreenshot

}

export function getDisplayFields(dpTypeValues, displayFields, currentDpType, currentYear, currentDatapointsObject, isEmpty, isRefDataExists) {
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

                    if (isEmpty) {
                        if (display.fieldName == 'collectionYear') {
                            currentValue = { value: null, label: null };
                        } else {
                            currentValue = { value: '', label: '' };
                        }
                    } else {
                        optionVal = display.inputValues;
                        // When it comes to history data the currentDpType will income as a string 'history' as the year will match.
                        let standaloneDetail = Array.isArray(currentDpType) && currentDpType.find((obj) => obj.year == currentYear);
                        if (standaloneDetail || currentDpType == 'history') {
                            currentValue = {
                                value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[display.fieldName] : '',
                                label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[display.fieldName] : ''
                            }
                        }
                    }

                    break;
                case STATIC:
                    currentValue = dpTypeValues?.additionalDetails[display?.fieldName];
                    break;
                default:
                    if (isEmpty) {
                        currentValue = '';
                    } else {
                        optionVal = display?.inputValues;
                        // When it comes to history data the currentDpType will income as a string 'history' as the year will match.
                        let standaloneDetail = Array.isArray(currentDpType) && currentDpType.find((obj) => obj?.year == currentYear);
                        if (standaloneDetail || currentDpType == 'history') {
                            currentValue = standaloneDetail?.additionalDetails ? standaloneDetail?.additionalDetails[display?.fieldName] : '';
                        }
                    }
                    break;
            }
            display.fieldName == 'collectionYear' ?
                currentDatapointsObject.collectionYear = {
                    fieldName: display.fieldName,
                    name: display.name,
                    value: currentValue ? currentValue : null,
                    inputType: display.inputType,
                    isMandatory: display?.isMandatory ? display?.isMandatory : false,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                } :
                currentDatapointsObject?.additionalDetails.push({
                    fieldName: display.fieldName,
                    name: display.name,
                    value: currentValue ? currentValue : '',
                    inputType: display.inputType,
                    isMandatory: display?.isMandatory ? display?.isMandatory : false,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                });

            if (!isEmpty && isRefDataExists && currentDatapointsObject?.error?.refData && currentDatapointsObject?.error?.refData['additionalDetails']) {
                currentDatapointsObject?.error?.refData?.additionalDetails.push({
                    fieldName: display.fieldName,
                    name: display.name,
                    value: currentValue ? currentValue : '',
                    inputType: display.inputType,
                    isMandatory: display?.isMandatory ? display?.isMandatory : false,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                });
            }
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
            selectedPlaceValue: object?.placeValue ? { value: object?.placeValue, label: object?.placeValue } : { value: "Number", label: "Number" },
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


export function getHistoryDataObjectYearWise(dpTypeValues, object, sourceTypeDetails, sourceDetails, year, subDataType, screenShot) {
    return {
        status: Completed,
        dpCode: dpTypeValues?.code,
        dpCodeId: dpTypeValues?.id,
        dpName: dpTypeValues?.name,
        taskId: object?.taskId ? object?.taskId : '',
        fiscalYear: year ? Array.isArray(year) ? year[0] : year : '',
        description: dpTypeValues?.description,
        dataType: dpTypeValues?.dataType,
        subDataType: subDataType,
        textSnippet: object?.textSnippet,
        pageNo: object?.pageNumber,
        optionalAnalystComment: object?.optionalAnalystComment ? object?.optionalAnalystComment : '',
        isRestated: object?.isRestated ? object?.isRestated : '',
        restatedForYear: object?.restatedForYear ? object?.restatedForYear : '',
        restatedInYear: object?.restatedInYear ? object?.restatedInYear : '',
        restatedValue: object?.restatedValue ? object?.restatedValue : '',
        response: object?.response ? object?.response : '',
        sourceList: sourceTypeDetails,
        screenShot: getShot(object?.screenShot),
        source: sourceDetails,
        error: {},
        comments: [],
        additionalDetails: []
    }
}

function getShot(screenShot) {
    let image = []
    if (screenShot?.length > 0) {
        for (let i = 0; i < screenShot?.length; i++) {
            image.push({
                id: i,
                name: '',
                url: screenShot[i]
            });
        }
    } else {
        image.push({
            id: '',
            name: '',
            url: ''
        });
    }
    return image;

}

export function getPreviousNextDataPoints(allDatapoints, taskDetails, year, memberId, memberName) {
    return {
        dpCode: allDatapoints?.code,
        dpCodeId: allDatapoints?._id,
        dpName: allDatapoints?.name,
        companyId: taskDetails?.companyId.id,
        companyName: taskDetails?.companyId.companyName,
        keyIssueId: allDatapoints?.keyIssueId.id,
        keyIssue: allDatapoints?.keyIssueId.keyIssueName,
        memberId: memberId ? memberId : '',
        memberName: memberName ? memberName : '',
        pillarId: taskDetails?.categoryId.id,
        pillar: taskDetails?.categoryId.categoryName,
        fiscalYear: year
    }
}

export async function getChildDp(datapointId, year, taskId, companyId) {
    try {
        // let childDpDetailsStartTime=Date.now()
        const getChildDpDetails = await ChildDp.find({ parentDpId: datapointId, year, taskId, companyId, isActive: true, status: true });
        // let childDpDetailsEndTime=Date.now()
        // timeDetails.push({
        //     blockName:'child dp Details',
        //     timeTaken:childDpDetailsEndTime-childDpDetailsStartTime
        // })
        let childDp = [];
        getChildDpDetails?.map(child => {
            childDp.push(child?.childFields);
        });
        console.log(childDp);
        return childDp;

    } catch (error) {
        console.log(error?.message);
        return error?.message;
    }

}

export async function getHeaders(clientTaxonomyId, datapointId) {
    try {
        const [clientTaxData, dpDetails, measureDetail, uoms, placeValues] = await Promise.all([
            ClientTaxonomy.findOne({
                _id: clientTaxonomyId
            }),
            Datapoints.findOne({ _id: datapointId }),
            Measures.find({ status: true }),
            MeasureUoms.find({ status: true }).populate('measureId'),
            PlaceValues.aggregate([
                { $match: { status: true } }, { $project: { _id: 0, value: "$name", label: "$name" } }])
        ]);
        // let clientTaxDpMeasurePlaceValueDetailsEndTime=Date.now()
        // timeDetails.push({
        //     blockName:'clientTaxonomy Details,Dp Details,Measure Details,placeValues Details',
        //     timeTaken:clientTaxDpMeasurePlaceValueDetailsEndTime-clientTaxDpMeasurePlaceValueDetailsStartTime
        // })
        let headers = [];
        if (clientTaxData?.childFields?.additionalFields?.length > 0) {
            headers.push(clientTaxData?.childFields.dpCode)
            clientTaxData.childFields.additionalFields = _.sortBy(clientTaxData?.childFields?.additionalFields, 'orderNumber');
            let responseIndex = clientTaxData?.childFields?.additionalFields.findIndex((obj) => obj.fieldName == 'response');
            clientTaxData?.childFields?.additionalFields.map(field => {
                headers.push(field);
            });
            if (dpDetails?.measureType != '') {
                let measureDtl = measureDetail.find(obj => obj.measureName.toLowerCase() == dpDetails.measureType.toLowerCase());
                let measureUoms = uoms.filter(obj => obj.measureId.id == measureDtl?.id);
                let uomValues = [];
                for (let uomIndex = 0; uomIndex < measureUoms.length; uomIndex++) {
                    const element = measureUoms[uomIndex];
                    uomValues.push({ value: element.uomName, label: element.uomName });
                }
                console.log(headers);
                headers.push({
                    "id": clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length + 1,
                    "displayName": "Place Value",
                    "fieldName": "placeValue",
                    "dataType": "Select",
                    "options": placeValues,
                    "isRequired": true,
                    "orderNumber": clientTaxData?.childFields?.additionalFields[responseIndex]?.orderNumber
                        ?
                        clientTaxData?.childFields?.additionalFields[responseIndex]?.orderNumber
                        :
                        clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length
                });
                if (uomValues.length > 0) {
                    // if (measureDtl.measureName == 'Currency') {
                    // }

                    headers.push({
                        "id": clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length,
                        "displayName": "Unit",
                        "fieldName": "uom",
                        "dataType": "Select",
                        "options": uomValues,
                        "isRequired": true,
                        "orderNumber": clientTaxData?.childFields?.additionalFields[responseIndex]?.orderNumber
                            ?
                            clientTaxData?.childFields?.additionalFields[responseIndex]?.orderNumber
                            :
                            clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length
                    })
                }
            }
        } else if (clientTaxData?.childFields.dpCode) {
            headers.push(clientTaxData?.childFields.dpCode);
        }
        headers = _.sortBy(headers, 'orderNumber');
        return headers;


    } catch (error) {
        console.log(error?.message)
    }
}

export function getSortedYear(currentYear) {
    let obj = [{}];
    for (let i = 0; i < currentYear?.length; i++) {
        const y = currentYear[i].split('-');
        // if (y[0] < y[1]) {
        //     return { error: `The year range's first value is smaller the other,please check and request again` };
        // }
        obj.push({ firstYear: y[0], lastYear: y[1] });
    }
    currentYear = sortArray(obj, 'lastYear', -1);
    let newArray = [];
    currentYear.map((arr) => {
        if (Object.keys(arr).length > 0) {
            newArray.push(arr.firstYear + '-' + arr.lastYear);
        }
    });
    return newArray;
}

export function getMemberJoiningDate(date) {
    try {
        const memberJoinDate = new Date(date).getDate()
        const memberJoinMonth = new Date(date).getMonth()
        const memberJoinYear = new Date(date).getFullYear();
        const memberJoiningDate = (new Date(memberJoinYear, memberJoinMonth, memberJoinDate).getTime()) / 1000; // starting year
        return memberJoiningDate;
    } catch (error) { console.log(error?.message); }

}


export function getTaskStartDate(currentyear, month, date) {
    // We will get the first year
    let [taskStartingYear] = currentyear.split('-');
    const taskStartingDate =
        new Date(taskStartingYear, month, 0).getDate() == date
            ? 1
            : Number(date) + 1;
    const taskStartingMonth = new Date(taskStartingYear, month, 0).getMonth() == 11 ? 0 : Number(month);
    // because month starts with 0 hence 3 is April and not march. Therefore, we are not increamenting the month.
    if (month == 12) {
        taskStartingYear = Number(taskStartingYear) + 1;
    }
    const yearTimeStamp = Math.floor(new Date(taskStartingYear, taskStartingMonth, taskStartingDate).getTime() / 1000
    );
    return yearTimeStamp;
}