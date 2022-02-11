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
        const getChildDpDetails = await ChildDp.find({ parentDpId: datapointId, year, taskId, companyId, isActive: true });
        let childDp = [];
        getChildDpDetails.map(child => {
            childDp.push(child.childFields);
        });

        return childDp;

    } catch (error) {
        console.log(error?.message);
        return error?.message;
    }
}

export async function getHeaders(clientTaxonomyId, datapointId) {
    try {

        const [ clientTaxData, dpDetails, measureDetail, uoms, placeValues ] = await Promise.all([
            ClientTaxonomy.findOne({
                _id: clientTaxonomyId
            }),
            Datapoints.findOne({ _id: datapointId }),
            Measures.find({ status: true }),
            MeasureUoms.find({ status: true }).populate('measureId'),
            PlaceValues.aggregate([
                { $match: { status: true } }, { $project: { _id: 0, value: "$name", label: "$name" } }])
        ]);
        let headers = [];
        if (clientTaxData?.childFields?.additionalFields?.length > 0) {
            headers.push(clientTaxData?.childFields.dpCode, clientTaxData?.childFields?.dpName)
            clientTaxData.childFields.additionalFields = _.sortBy(clientTaxData?.childFields?.additionalFields, 'orderNumber');
            let responseIndex = clientTaxData?.childFields?.additionalFields.findIndex((obj) => obj.fieldName == 'response');
            clientTaxData?.childFields?.additionalFields.map(field => {
                headers.push(field);
            });
            if(dpDetails.measureType != ''){
                let measureDtl = measureDetail.find(obj => obj.measureName == dpDetails.measureType);
                let measureUoms = uoms.filter(obj => obj.measureId.id == measureDtl.id);
                let uomValues = [];
                for (let uomIndex = 0; uomIndex < measureUoms.length; uomIndex++) {
                    const element = measureUoms[uomIndex];
                    uomValues.push({ value: element.uomName, label: element.uomName });
                }
                if (uomValues.length > 0) {
                    headers.push({ 
                        "id": clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length, 
                        "displayName": "Unit",
                        "fieldName": "uom",
                        "dataType": "Select",
                        "options": uomValues,
                        "isRequired": true,
                        "orderNumber": clientTaxData?.childFields?.additionalFields[responseIndex].orderNumber 
                        ? 
                        clientTaxData?.childFields?.additionalFields[responseIndex].orderNumber + 1
                        :
                        clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length 
                    })
                    if (measureDtl.measureName == 'Currency') {
                        headers.push({ 
                            "id": clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length + 1, 
                            "displayName": "Place Value",
                            "fieldName": "placeValue",
                            "dataType": "Select",
                            "options": placeValues,
                            "isRequired": true,
                            "orderNumber": clientTaxData?.childFields?.additionalFields[responseIndex].orderNumber 
                            ? 
                            clientTaxData?.childFields?.additionalFields[responseIndex].orderNumber + 1
                            :
                            clientTaxData?.childFields?.additionalFields?.length + clientTaxData?.childFields?.additionalFields?.length
                        })
                    }
                }
            }
        } else {
            headers.push(clientTaxData?.childFields.dpCode, clientTaxData?.childFields?.dpName)

        }
        headers = _.sortBy(headers, 'orderNumber');
        return headers;


    } catch (error) {
        console.log(error?.message)
    }
}

