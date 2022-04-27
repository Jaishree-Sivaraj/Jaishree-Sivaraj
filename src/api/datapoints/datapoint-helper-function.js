'use strict'
import _ from "lodash";
import { Datapoints } from ".";
import { StandaloneDatapoints } from "../standalone_datapoints";
import { BoardMembersMatrixDataPoints } from "../boardMembersMatrixDataPoints";
import { KmpMatrixDataPoints } from "../kmpMatrixDataPoints";
import { ClientTaxonomy } from "../clientTaxonomy";
import { Functions } from "../functions";
import { TaskAssignment } from "../taskAssignment";
import { ErrorDetails } from "../errorDetails";
import { CompanySources } from "../companySources";
import { MeasureUoms } from "../measure_uoms";
import { Measures } from "../measures";
import { PlaceValues } from "../place_values";
import { getConditionForQualitativeAndQuantitativeDatapoints } from './get-category-helper-function';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from "../../constants/dp-type";
import {
    CorrectionPending,
    ReassignmentPending,
    Error,
    Correction,
    CorrectionCompleted,
} from "../../constants/task-status";
import {
    getPreviousNextDataPoints,
    getHeaders,
    getSortedYear,
} from "./dp-details-functions";
import { NUMBER } from "../../constants/dp-datatype";
import { CURRENCY, NA } from "../../constants/measure-type";
import { getTaskStartDate, getMemberJoiningDate } from './dp-details-functions';

export function getVariablesValues(taskDetails, currentYear, datapointId, taskId, dpTypeValues) {

    const [currentQuery, historyQuery] = [
        {
            taskId: taskId,
            companyId: taskDetails.companyId.id,
            datapointId: datapointId,
            year: {
                $in: currentYear,
            },
            isActive: true,
            status: true,
        },
        {
            companyId: taskDetails.companyId.id,
            datapointId: datapointId,
            $and: [
                { year: { $nin: currentYear } },
                { year: { $lt: currentYear[0] } },
            ],
            isActive: true,
            status: true,
        },
    ];

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
        status: "",
    };

    let sourceDetails = {
        url: "",
        sourceName: "",
        value: "",
        publicationDate: "",
        sourceFile: "",
    };

    return { currentQuery, historyQuery, datapointsObject, sourceDetails };
}

export async function getTaskDetailsFunctionIdPlaceValuesAndMeasureType(taskId) {
    try {
        const [taskDetails, functionId, measureTypes, allPlaceValues] =
            await Promise.all([
                TaskAssignment.findOne({
                    _id: taskId,
                })
                    .populate({
                        path: "companyId",
                        populate: {
                            path: "clientTaxonomyId",
                        },
                    })
                    .populate("categoryId"),
                Functions.findOne({
                    functionType: "Negative News",
                    status: true,
                }),
                Measures.find({ status: true }),
                PlaceValues.find({ status: true }).sort({ orderNumber: 1 }),
            ]);
        return { taskDetails, functionId, measureTypes, allPlaceValues };
    } catch (error) {
        console.log(error?.message);
    }
}

export async function getClientTaxonomyAndDpTypeDetails(functionId, taskDetails, datapointId) {
    try {
        const [dpTypeValues, clienttaxonomyFields] = await Promise.all([
            Datapoints.findOne({
                dataCollection: 'Yes',
                functionId: {
                    "$ne": functionId.id
                },
                categoryId: taskDetails.categoryId.id,
                _id: datapointId,
                status: true
            }).populate('keyIssueId').populate('categoryId'),
            ClientTaxonomy.findOne({
                _id: taskDetails.companyId.clientTaxonomyId.id,
            }).lean()
        ]);

        return { dpTypeValues, clienttaxonomyFields }

    } catch (error) {
        console.log(error?.message);
    }
}

export async function getErrorDetailsCompanySourceDetailsChildHeaders(taskDetails, datapointId, currentYear) {
    try {
        const [errorDataDetails, companySourceDetails, chilDpHeaders] = await Promise.all([

            ErrorDetails.find({
                taskId: taskDetails?._id,
                companyId: taskDetails.companyId.id,
                year: {
                    $in: currentYear
                },
                datapointId,
                categoryId: taskDetails.categoryId.id,
                status: true
            }).populate('errorTypeId'),
            CompanySources.find({ companyId: taskDetails.companyId.id }),
            getHeaders(taskDetails.companyId.clientTaxonomyId.id, datapointId)
        ]);
        return { errorDataDetails, companySourceDetails, chilDpHeaders };
    } catch (error) {
        console.log(error?.message)
    }
}

export function getCompanySourceDetails(companySourceDetails) {
    try {
        let sourceTypeDetails = [];
        companySourceDetails?.map(company => {
            sourceTypeDetails.push({
                sourceName: company.name,
                value: company.id,
                url: company.sourceUrl,
                isPublicationDateRequired: company.sourceTypeId?.typeName == 'Webpages' ? false : true,
                publicationDate: company.publicationDate,
                sourceFile: company?.sourceFile ? company?.sourceFile : '',
                title: company?.sourceTitle ? company?.sourceTitle : '',
            })
        });

        return sourceTypeDetails;
    } catch (error) {
        console.log(error?.message);
    }
}

export function getSortedCurrentYearAndDisplayFields(year, clienttaxonomyFields, taskDetails, dpTypeValues) {
    try {
        let [currentYear, displayFields] = [
            year?.split(', '),
            clienttaxonomyFields.filter(obj => obj?.toDisplay == true && obj?.applicableFor != 'Only Controversy')
        ];
        currentYear = getSortedYear(currentYear);

        if (!taskDetails.companyId.clientTaxonomyId?.isDerivedCalculationRequired && dpTypeValues?.dataType !== NUMBER) {
            currentYear.length = 1
        }
        return { currentYear, displayFields };
    } catch (error) {
        console.log(error?.message);
    }
}

export async function getUomAndPlaceValues(measureTypes, dpTypeValues, allPlaceValues) {
    try {
        let dpMeasureType = measureTypes?.filter(obj => obj?.measureName.toLowerCase() == dpTypeValues?.measureType.toLowerCase());
        let dpMeasureTypeId = dpMeasureType?.length > 0 ? dpMeasureType[0]?.id : null;
        let taxonomyUoms = await MeasureUoms.find({
            measureId: dpMeasureTypeId,
            status: true
        }).sort({ orderNumber: 1 });

        let placeValues = [], uomValues = [];

        if (dpTypeValues && dpTypeValues?.measureType != null && dpTypeValues?.measureType != NA && dpTypeValues?.measureType) {
            for (let uomIndex = 0; uomIndex < taxonomyUoms.length; uomIndex++) {
                const element = taxonomyUoms[uomIndex];
                uomValues.push({ value: element.id, label: element.uomName });
            }
        }
        if (dpTypeValues && (dpTypeValues?.measureType == CURRENCY || dpTypeValues?.dataType == NUMBER)) {
            for (let pvIndex = 0; pvIndex < allPlaceValues.length; pvIndex++) {
                const element = allPlaceValues[pvIndex];
                placeValues.push({ value: element.name, label: element.name });
            }
        }

        return { uomValues, placeValues };
    } catch (error) {
        console.log(error?.message);
    }
}

export function getInputValues(unit) {
    try {
        let inputValues = [];
        let inputs = unit.split('/');
        for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
            const element = {
                label: inputs[inputIndex],
                value: inputs[inputIndex]
            }
            inputValues.push(element);
        }
        return inputValues;
    } catch (error) {

    }
}

export async function getPrevAndNextDatapointsDetails(functionId, memberType, taskDetails, isRep, keyIssueId, dataType, isPriority, memberId, memberName, datapointId, year) {
    try {
        let prevDatapoint = {}, nextDatapoint = {};

        let datapointQuery = {
            dataCollection: "Yes",
            functionId: {
                $ne: functionId.id,
            },
            dpType: memberType,
            clientTaxonomyId: taskDetails?.companyId?.clientTaxonomyId,
            categoryId: taskDetails?.categoryId.id,
            status: true,
        };

        if (isPriority == true) {
            datapointQuery = { ...datapointQuery, isPriority: true };
        }

        if (!isRep) {
            datapointQuery = await getQueryBasedOnTaskStatus(taskDetails, datapointQuery, memberName, memberType);
        }
        console.log(isRep);
        console.log(datapointQuery);
        datapointQuery =
            keyIssueId == "" ? datapointQuery : { ...datapointQuery, keyIssueId };
        datapointQuery = dataType !== '' ? { ...datapointQuery, ...getConditionForQualitativeAndQuantitativeDatapoints(dataType) }
            : datapointQuery;
        const allDatapoints = await Datapoints.find(datapointQuery)
            .populate("keyIssueId")
            .populate("categoryId")
            .sort({ code: 1 });

        for (let i = 0; i < allDatapoints?.length; i++) {
            if (allDatapoints[i].id == datapointId) {
                prevDatapoint = i - 1 >= 0
                    ? getPreviousNextDataPoints(allDatapoints[i - 1], taskDetails, year, memberId, memberName)
                    : {};
                nextDatapoint = i + 1 <= allDatapoints?.length - 1
                    ? getPreviousNextDataPoints(allDatapoints[i + 1], taskDetails, year, memberId, memberName)
                    : {};
                break;
            }
        }
        return { prevDatapoint, nextDatapoint };
    } catch (error) { console.log(error?.message); }
}

async function getQueryBasedOnTaskStatus(taskDetails, datapointQuery, memberName, memberType) {
    try {
        if (
            taskDetails?.taskStatus == CorrectionPending ||
            taskDetails?.taskStatus == ReassignmentPending ||
            taskDetails?.taskStatus == CorrectionCompleted
        ) {
            let allDpDetails;
            let dpStatus =
                taskDetails?.taskStatus == CorrectionCompleted ? Correction : Error;

            const errQuery = {
                taskId: taskDetails?._id,
                status: true,
                isActive: true,
                dpStatus,
            };
            switch (memberType) {
                case STANDALONE:
                    allDpDetails = await StandaloneDatapoints.distinct(
                        "datapointId",
                        errQuery
                    );
                    break;
                case BOARD_MATRIX:
                    allDpDetails = await BoardMembersMatrixDataPoints.distinct(
                        "datapointId",
                        { ...errQuery, memberName: { $regex: memberName, $options: "i" } }
                    );
                    break;
                case KMP_MATRIX:
                    allDpDetails = await KmpMatrixDataPoints.distinct("datapointId", {
                        ...errQuery,
                        memberName: { $regex: memberName, $options: "i" },
                    });
                    break;
                default:
                    break;
            }
            datapointQuery = { ...datapointQuery, _id: { $in: allDpDetails } };
        }
        return datapointQuery;
    } catch (error) {
        console.log(error?.message);
    }
}

export function getTotalYearsForDataCollection(currentYear, memberDetails, fiscalYearEndMonth, fiscalYearEndDate) {
    try {
        // const memberStartDate = new Date(memberDetails?.startDate).getFullYear();
        // let memberCollectionYears = [];
        // for (let yearIndex = 0; yearIndex < currentYear?.length; yearIndex++) {
        //     const splityear = currentYear[yearIndex].split("-");
        //     if (
        //         memberStartDate <= splityear[0] ||
        //         memberStartDate <= splityear[1]
        //     ) {
        //         memberCollectionYears.push(currentYear[yearIndex]);
        //     }
        // }

        const memberJoiningDate = getMemberJoiningDate(memberDetails?.startDate);
        let memberCollectionYears = [];
        for (let yearIndex = 0; yearIndex < currentYear?.length; yearIndex++) {
            const splityear = currentYear[yearIndex].split('-');
            const firstHalfDate = getTaskStartDate(currentYear[yearIndex], fiscalYearEndMonth, fiscalYearEndDate);
            const secondHalfDate = (new Date(splityear[1], fiscalYearEndMonth - 1, fiscalYearEndDate).getTime()) / 1000
            const logicForDecidingWhetherToConsiderYear = (memberJoiningDate <= firstHalfDate || memberJoiningDate <= secondHalfDate)
                && (memberDetails.endDateTimeStamp == 0 || memberDetails.endDateTimeStamp > firstHalfDate);
            if (logicForDecidingWhetherToConsiderYear) {
                memberCollectionYears.push(currentYear[yearIndex])
            }

        }
        return memberCollectionYears;
    } catch (error) { console.log(error?.message); }
}






