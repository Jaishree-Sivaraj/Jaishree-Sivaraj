'use strict';
import { Controversy } from '../controversy';

export function getTaskDetails(task, user) {
    return {
        analyst: task?.analystId?.name,
        analystId: task?.analystId?._id,
        analystSLA: task?.analystSLADate,
        batch: task?.batchId?.batchName,
        batchId: task?.batchId?._id,
        company: task?.companyId?.companyName,
        companyId: task?.companyId?._id,
        createdBy: getUserDetails(user),
        createdById: user?._id,
        fiscalYear: task?.fiscalYear,
        group: task?.groupId?.groupName,
        groupId: task?.groupId?._id,
        pillar: task?.groupId?._id,
        pillarId: task?.categoryId?._id,
        qa: task?.qaId?.name,
        qaId: task?.qaId?._id,
        qaSLA: task?.qaSLADate,
        taskId: task?._id,
        taskNumber: task?.taskNumber,
        taskStatus: task?.taskStatus
    }
}

export async function getControveryDetails(controversery, user) {
    let numberoOfControversy = await Controversy.count({ taskId: controversery.id, status: true, isActive: true });
    return {
        analyst: controversery?.analystId?.name,
        analystId: controversery?.analystId?._id,
        company: controversery?.companyId?.companyName,
        companyId: controversery?.companyId?._id,
        createdBy: getUserDetails(user),
        taskId: controversery?._id,
        taskNumber: controversery?.taskNumber,
        taskStatus: controversery?.taskStatus,
        totalNoOfControversy: numberoOfControversy?.length
    }
}

function getUserDetails(user) {
    return {
        _id: user?._id,
        otp: user?.otp,
        role: user?.role,
        status: user?.status,
        keywords: user?.keywords,
        picture: user?.picture,
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
        roleDetails: user?.roleDetails,
        userType: user?.userType,
        isAssignedToGroup: user?.isAssignedToGroup,
        isUserActive: user?.isUserActive,
        isUserApproved: user?.isUserApproved,
        isUserRejected: user?.isUserRejected,
        isRoleAssigned: user?.isRoleAssigned,
        phoneNumber: user?.phoneNumber

    }
}