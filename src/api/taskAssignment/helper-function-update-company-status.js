'use strict';
import { TaskAssignment } from ".";
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp';
import { NUMBER } from '../../constants/dp-datatype';
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from "../../constants/dp-type";
import { Companies } from "../companies";
import { QA, Analyst } from "../../constants/roles";
import {
    VerificationCompleted,
    CorrectionPending,
    ReassignmentPending,
    CorrectionCompleted,
    Completed,
    CollectionCompleted,
    Correction,
    Incomplete,
    Error,
    Collection
} from '../../constants/task-status';
import { getMemberJoiningDate, getTaskStartDate } from '../datapoints/dp-details-functions';

export async function getTotalExpectedYear(memberName, distinctYears, dpType, fiscalYearEndMonth, fiscalYearEndDate) {
    try {
        let totalCollectionYearForMembers = []
        if (memberName?.length > 0) {
            let memberDetails = []
            if (dpType == BOARD_MATRIX) {
                memberDetails = await BoardMembers.find({
                    BOSP004: { $in: memberName },
                    status: true
                });
            } else if (dpType == KMP_MATRIX) {
                memberDetails = await Kmp.find({
                    MASP003: { $in: memberName },
                    status: true
                })
            }

            for (let memberIndex = 0; memberIndex < memberDetails?.length; memberIndex++) {
                let totalCollectedYears = 0;
                const memberJoiningDate = getMemberJoiningDate(memberDetails[memberIndex]?.startDate);
                for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
                    const splityear = distinctYears[yearIndex].split('-');
                    const firstHalfDate = getTaskStartDate(distinctYears[yearIndex], fiscalYearEndMonth, fiscalYearEndDate);
                    const secondHalfDate = (new Date(splityear[1], fiscalYearEndMonth - 1, fiscalYearEndDate).getTime()) / 1000
                    const logicForDecidingWhetherToConsiderYear = (memberJoiningDate <= firstHalfDate || memberJoiningDate <= secondHalfDate)
                        && (memberDetails[memberIndex].endDateTimeStamp == 0 || memberDetails[memberIndex].endDateTimeStamp > firstHalfDate);
                    if (logicForDecidingWhetherToConsiderYear) {
                        totalCollectedYears += 1;
                    }
                }
                totalCollectionYearForMembers.push(totalCollectedYears);
            }
        }
        return totalCollectionYearForMembers;
    } catch (error) {
        console.log(error?.message);
    }
}

export async function getTotalMultipliedValues(standaloneDatapoints, boardMatrixDatapoints, kmpMatrixDatapoints, allBoardMemberMatrixDetails, allKmpMatrixDetails, distinctYears, isSFDR, fiscalYearEndMonth, fiscalYearEndDate) {
    try {
        let totalExpectedBoardMatrixCount = 0, totalExpectedKmpMatrixCount = 0;
        const totalBoardMemberYearsCount = await getTotalExpectedYear(allBoardMemberMatrixDetails, distinctYears, BOARD_MATRIX, fiscalYearEndMonth, fiscalYearEndDate);
        const totalKmpMemberYearsCount = await getTotalExpectedYear(allKmpMatrixDetails, distinctYears, KMP_MATRIX, fiscalYearEndMonth, fiscalYearEndDate);

        let multipliedValue = 0;
        if (totalBoardMemberYearsCount && totalKmpMemberYearsCount) {
            if (!isSFDR) {
                totalExpectedBoardMatrixCount = getTotalCount(totalBoardMemberYearsCount, boardMatrixDatapoints);
                totalExpectedKmpMatrixCount = getTotalCount(totalKmpMemberYearsCount, kmpMatrixDatapoints);
                multipliedValue = totalExpectedBoardMatrixCount + totalExpectedKmpMatrixCount + standaloneDatapoints?.length * distinctYears?.length;
            } else {
                const totalStandaloneDatapoints = getQualitativeAndQuantitativeCount(standaloneDatapoints);
                const standaloneQualitative = totalStandaloneDatapoints[0], standaloneQuantitative = totalStandaloneDatapoints[1];
                const totalBMDatapoints = getQualitativeAndQuantitativeCount(boardMatrixDatapoints);
                const bmQualitative = totalBMDatapoints[0], bmQuantitative = totalBMDatapoints[1];
                const totalKMDatapoints = getQualitativeAndQuantitativeCount(kmpMatrixDatapoints);
                const kmQualitative = totalKMDatapoints[0], kmQuantitative = totalKMDatapoints[1];
                const totalQualitativeDatapoints = standaloneQualitative + bmQualitative + kmQualitative;
                if (totalBoardMemberYearsCount && totalKmpMemberYearsCount) {
                    totalExpectedBoardMatrixCount = getTotalCount(totalBoardMemberYearsCount, bmQuantitative);
                    totalExpectedKmpMatrixCount = getTotalCount(totalKmpMemberYearsCount, kmQuantitative);
                }

                const totalQuantativeDatapoints = standaloneQuantitative * distinctYears.length + totalExpectedBoardMatrixCount + totalExpectedKmpMatrixCount;
                multipliedValue = totalQualitativeDatapoints + totalQuantativeDatapoints;
            }

            return multipliedValue;
        }

    } catch (error) {
        console.log(error?.message)

    }
}

export function checkIfAllDpCodeAreFilled(datapoint, collectedData, dpType) {
    let errorMessage = {}
    if (datapoint?.length > 0 && collectedData?.length <= 0) {
        errorMessage = { status: 409, message: `Task Status not updated. Check ${dpType} DPcodes` }
    }
    return errorMessage;
}


function getQualitativeAndQuantitativeCount(datapoints) { // here datpoints can be standalone or board-matrix or kmp-matrix.
    let totalQualitativeDatapoints = 0, totalQuantativeDatapoints = 0;
    let totalDatapoints = [];
    datapoints.map((datapoint) => {
        if (datapoint?.dataType !== NUMBER) {
            totalQualitativeDatapoints += 1
        } else {
            totalQuantativeDatapoints += 1
        }
    });
    totalDatapoints.push(totalQualitativeDatapoints, totalQuantativeDatapoints)

    return totalDatapoints;
}

function getTotalCount(yearCount, data) {
    let counter = 0;
    yearCount?.map(total => {
        let datapointLength = Array.isArray(data) ? data.length : data;
        counter += datapointLength * total;
        console.log(counter);
    });

    return counter;
}

export async function conditionalResult(body, hasError, hasCorrection, condition) {
    try {
        let taskStatusValue;
        if (hasError && condition) {
            taskStatusValue = body.role == QA ? CorrectionPending : ReassignmentPending

            const [query, update, query1, update1] = [
                { taskId: body.taskId, isActive: true, status: true, hasError: true },
                { $set: { dpStatus: Error, correctionStatus: Incomplete } },
                { taskId: body.taskId, isActive: true, status: true, hasError: false },
                { $set: { dpStatus: Collection, correctionStatus: Completed } }
            ]
            await Promise.all([
                KmpMatrixDataPoints.updateMany(query, update),
                BoardMembersMatrixDataPoints.updateMany(query, update),
                StandaloneDatapoints.updateMany(query, update),
                KmpMatrixDataPoints.updateMany(query1, update1),
                BoardMembersMatrixDataPoints.updateMany(query1, update1),
                StandaloneDatapoints.updateMany(query1, update1),
                TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue } })])
            return { message: '', taskStatusValue };
        } else if (hasCorrection && condition) {
            if (body.role == QA) {
                taskStatusValue = VerificationCompleted;
            } else if (body.role == Analyst) {
                taskStatusValue = CorrectionCompleted;
            } else {
                taskStatusValue = Completed;
            }
            const [query, update,] = [
                { taskId: body.taskId, isActive: true, status: true, hasCorrection: true },
                { $set: { dpStatus: Correction, correctionStatus: Incomplete } }
            ]
            await Promise.all([
                KmpMatrixDataPoints.updateMany(query, update),
                BoardMembersMatrixDataPoints.updateMany(query, update),
                StandaloneDatapoints.updateMany(query, update),
                TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue } })
            ]);
            return { message: '', taskStatusValue };
        } else if (!hasError && !hasCorrection && condition) {
            taskStatusValue = body.role == QA ? VerificationCompleted : Completed
            taskStatusValue = body.role == Analyst ? CollectionCompleted : Completed
            const [query, update,] = [
                { taskId: body.taskId, isActive: true, status: true },
                { $set: { dpStatus: Correction, correctionStatus: Incomplete } }
            ]
            await Promise.all([
                KmpMatrixDataPoints.updateMany(query, update),
                BoardMembersMatrixDataPoints.updateMany(query, update),
                StandaloneDatapoints.updateMany(query, update),
                TaskAssignment.updateOne({ _id: body.taskId }, { $set: { taskStatus: taskStatusValue } })
            ]);
            return { message: '', taskStatusValue };
        } else {
            return {
                message: "Task Status not updated. Check all DPcodes",
                taskStatusValue
            };
        }
    } catch (error) {
        console.log(error?.message);
        return error?.message;
    }
}

export async function getCompanyDetails(companyId) {
    const cmpDetail = await Companies.findOne({ _id: companyId })
    const [clientRep, companyRep] = await Promise.all([
        ClientRepresentatives.find({ companiesList: { $in: [companyId] } }).populate('userId'),
        CompanyRepresentatives.find({ companiesList: { $in: [companyId] } }).populate('userId')
    ])
    let companyRepEmail = [], clientRepEmail = []

    clientRep.map(async (client) => {
        clientRepEmail.push(client?.userId?.email)
    })

    companyRep.map(async (company) => {
        companyRepEmail.push(company?.userId?.email)
    })

    let email = _.concat(companyRepEmail, clientRepEmail);
    email = email.filter(e => e !== undefined);
    return { email, companyName: cmpDetail?.companyName }
}