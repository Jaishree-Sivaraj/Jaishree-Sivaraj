'use strict';

export function getErrorData(body, item, errorTypeObject, errorCaughtByRep, user) {
    return {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        categoryId: body.pillarId,
        year: item.fiscalYear,
        taskId: body.taskId,
        errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
        raisedBy: item.error.raisedBy,
        errorStatus: item.error.errorStatus,
        errorCaughtByRep: errorCaughtByRep,
        isErrorAccepted: null,
        isErrorRejected: false,
        comments: {
            author: item.error.raisedBy,
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.error.comment
        },
        status: true,
        uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
        placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
        createdBy: user
    }
}