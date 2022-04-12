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

export async function getTotalExpectedYear(allCollectedData, distinctYears, dpType) {
    try {
        let allMember = [];
        let totalYearByAllMembers = []
        if (allCollectedData?.length > 0) {
            allCollectedData.map(member => {
                allMember.push(member?.memberName);
            });
            let memberDetails = []
            if (dpType == BOARD_MATRIX) {
                memberDetails = await BoardMembers.find({
                    BOSP004: { $in: allMember },
                    status: true
                });
            } else if (dpType == KMP_MATRIX) {
                memberDetails = Kmp.find({
                    MASP003: { $in: allMember },
                    status: true
                })
            }
            for (let memberIndex = 1; memberIndex < memberDetails?.length; memberIndex++) {
                let totalCollectedYears = 0;
                let memberStartYear = memberDetails[memberIndex]?.startDate.getFullYear();
                for (let yearIndex = 1; yearIndex < distinctYears.length; yearIndex++) {
                    const splityear = distinctYears[yearIndex].split('-');
                    if (memberStartYear == splityear[0] || memberStartYear == splityear[1]) {
                        totalCollectedYears = +1;
                    }
                }
                totalYearByAllMembers.push(totalCollectedYears);
            }
        }
        return totalYearByAllMembers;
    } catch (error) {
        console.log(error?.message);
    }
}

export async function getTotalMultipliedValues(standaloneDatapoints, boardMatrixDatapoints, kmpMatrixDatapoints, allBoardMemberMatrixDetails, allKmpMatrixDetails, distinctYears, isSFDR) {
    try {
        let totalExpectedBoardMatrixCount = 0, totalExpectedKmpMatrixCount = 0;
        const [totalBoardMemberYearsCount, totalKmpMemberYearsCount] = await ([
            getTotalExpectedYear(allBoardMemberMatrixDetails, distinctYears, BOARD_MATRIX),
            getTotalExpectedYear(allKmpMatrixDetails, distinctYears, KMP_MATRIX)
        ]);
        let multipliedValue;
        if (isSFDR) {
            totalExpectedBoardMatrixCount = getTotalCount(totalBoardMemberYearsCount, boardMatrixDatapoints);
            totalExpectedKmpMatrixCount = getTotalCount(totalKmpMemberYearsCount, kmpMatrixDatapoints);

            multipliedValue = totalExpectedBoardMatrixCount + totalExpectedKmpMatrixCount + standaloneDatapoints.length * distinctYears.length
        } else {
            const { standaloneQualitative, standaloneQuantitative } = getQualitativeAndQuantitativeCount(standaloneDatapoints);
            const { bmQualitative, bmQuantitative } = getQualitativeAndQuantitativeCount(boardMatrixDatapoints);
            const { kmQualitative, kmQuantitative } = getQualitativeAndQuantitativeCount(kmpMatrixDatapoints);
            const totalQualitativeDatapoints = standaloneQualitative + bmQualitative + kmQualitative;
            if (totalBoardMemberYearsCount && totalKmpMemberYearsCount) {
                totalExpectedBoardMatrixCount = getTotalCount(totalBoardMemberYearsCount, bmQuantitative);
                totalExpectedKmpMatrixCount = getTotalCount(totalKmpMemberYearsCount, kmQuantitative);
            }

            const totalQuantativeDatapoints = standaloneQuantitative * distinctYears.length + totalExpectedBoardMatrixCount + totalExpectedKmpMatrixCount;
            multipliedValue = totalQualitativeDatapoints + totalQuantativeDatapoints;
        }

        return multipliedValue;
    } catch (error) {
        console.log(error?.message)

    }
}

function getQualitativeAndQuantitativeCount(datapoints) { // here datpoints can be standalone or boar-matrix or kmp-matrix.
    let totalQualitativeDatapoints = 0, totalQuantativeDatapoints = 0;
    datapoints.map((datapoint) => {
        if (datapoint?.dataType !== NUMBER) {
            totalQualitativeDatapoints += 1
        } else {
            totalQuantativeDatapoints += 1
        }
    });

    return { totalQualitativeDatapoints, totalQuantativeDatapoints };
}

function getTotalCount(yearCount, datapoint) {
    let count = 0;
    yearCount.map(total => {
        count += datapoint.length * total;
    });

    return count;
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
            ])
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
            ])
        } else {
            return {
                message: "Task Status not updated. Check all DPcodes",
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