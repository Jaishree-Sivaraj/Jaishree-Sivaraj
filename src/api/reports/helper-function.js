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
        pillar: task?.categoryId?.categoryName,
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
    let numberOfControversy = await Controversy.count({ taskId: controversery.id, status: true, isActive: true });
    return {
        analyst: controversery?.analystId?.name,
        analystId: controversery?.analystId?._id,
        company: controversery?.companyId?.companyName,
        companyId: controversery?.companyId?._id,
        createdBy: getUserDetails(user),
        taskId: controversery?._id,
        taskNumber: controversery?.taskNumber,
        taskStatus: controversery?.taskStatus,
        totalNoOfControversy: numberOfControversy,
        reviewDate: controversery?.reassessmentDate,
        lastModifiedDate: controversery?.updatedAt,
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

export function getSFDRExportOutputFields(details) {
    const additionalSource = 'additionalSourceUsed?';
    return {
        taskNumber: details?.taskNumber,
        company: details?.company,
        pillar: details?.company,
        dpCode: details?.dpCode,
        description: details?.description,
        collectionYear: details?.collectionYear,
        year: details?.year,
        response: details?.response,
        placeValue: details?.placeValue,
        measureUom: details?.measureUom,
        uom: details?.uom,
        pageNumber: details?.pageNumber,
        sourceName: details?.sourceName,
        hasError: details?.hasError,
        errorType: details?.hasError,
        errorComments: details?.errorComments,
        didTheCompanyReport: details?.additionalDetails.didTheCompanyReport,
        typeOfValueActualDerivedProxy: details?.additionalDetails.typeOfValueActualDerivedProxy,
        companyDataElementLabel: details?.additionalDetails.companyDataElementLabel,
        companyDataElementSubLabel: details?.additionalDetails.companyDataElementSubLabel,
        totalOrSubLineItemForNumbers: details?.additionalDetails.totalOrSubLineItemForNumbers,
        formatOfDataProvidedByCompanyChartTableText: details?.additionalDetails.formatOfDataProvidedByCompanyChartTableText,
        textSnippet: details?.textSnippet,
        sectionOfDocument: details?.additionalDetails.sectionOfDocument,
        keywordUsed: details?.additionalDetails.keywordUsed,
        commentG: details?.additionalDetails.commentG,
        additionalSourceUsed: details?.additionalDetails[additionalSource],
        _id: details?._id,
        taskId: details?.taskId,
        companyId: details?.companyId,
        pillarId: details?.pillarId,
        dpCodeId: details?.dpCodeId,
    }
}

export function getAcuiteOutputFields(details) {
    return {
        taskNumber: details?.taskNumber,
        company: details?.company,
        pillar: details?.company,
        dpCode: details?.dpCode,
        description: details?.description,
        collectionYear: details?.collectionYear,
        year: details?.year,
        response: details?.response,
        placeValue: details?.placeValue,
        measureUom: details?.measureUom,
        uom: details?.uom,
        pageNumber: details?.pageNumber,
        sourceName: details?.sourceName,
        cin: details?.companyDetails?.cin,
        cmieProwessCode: details?.companyDetails?.cmieProwessCode,
        nicCode: details?.companyDetails?.nicCode,
        isinCode: details?.companyDetails?.isinCode,
        nicIndustry: details?.companyDetails?.nicIndustry,
        analystName: details?.analystDetails?.name,
        qaName: details?.qaDetails?.name,
        hasError: details?.hasError,
        errorType: details?.hasError,
        errorComments: details?.errorComments,
        _id: details?._id,
        taskId: details?.taskId,
        companyId: details?.companyId,
        pillarId: details?.pillarId,
        dpCodeId: details?.dpCodeId,



    }
}