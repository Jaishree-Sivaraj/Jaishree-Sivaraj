'use strict';
import mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export function getTaskDetailQuery(taskId) {
    return [
        {
            $match: {
                _id: ObjectId(taskId)
            }
        }, {
            $lookup:
            {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categoryId'
            }

        },
        {
            $unwind: {
                path: "$categoryId",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup:
            {
                from: 'companies',
                localField: 'companyId',
                foreignField: '_id',
                as: 'companyId'
            }

        }, {
            $unwind:
            {
                path: "$companyId",
                preserveNullAndEmptyArrays: true
            }

        },
        {
            $lookup:
            {
                from: 'clienttaxonomies',
                localField: 'companyId.clientTaxonomyId',
                foreignField: "_id",
                as: 'clientTaxonomyId'
            }

        },
        {
            $unwind: {
                path: "$clientTaxonomyId",
                preserveNullAndEmptyArrays: true
            }
        }
    ]
}

export function getCurrentStandaloneQuery(taskId, taskDetails, datapointId, currentYear) {
    return [
        {
            $match: {

                taskId: ObjectId(taskId),
                companyId: taskDetails.companyId._id,
                datapointId: ObjectId(datapointId),
                year: {
                    $in: currentYear
                },
                isActive: true,
                status: true

            }
        }, {
            $lookup: {
                from: 'datapoints',
                localField: 'datapointId',
                foreignField: '_id',
                as: 'datapointId'
            }
        }, {
            $unwind: {
                path: "$datapointId",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from: 'companies',
                localField: 'companyId',
                foreignField: '_id',
                as: 'companyId'
            }
        }, {
            $unwind: {
                path: "$companyId",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from: 'taskassignments',
                localField: 'taskId',
                foreignField: '_id',
                as: 'taskId'
            }
        }, {
            $unwind: {
                path: "$taskId",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from: 'measureuoms',
                localField: 'uom',
                foreignField: '_id',
                as: 'uom'
            }
        }, {
            $unwind: {
                path: "$uom",
                preserveNullAndEmptyArrays: true
            }
        },
    ]
}

export function getAllDatapointQuery(datapointQuery) {
    return [
        {
            $match: datapointQuery
        },
        {
            $lookup: {
                from: 'keyissues',
                localField: 'keyIssueId',
                foreignField: '_id',
                as: 'keyIssueId'
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categoryId'
            }
        }, {
            $unwind: {
                path: "$keyIssueId",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $unwind: {
                path: "$categoryId",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $sort: {
                code: 1
            }
        }
    ]
}

export function getdpTypeValuesQuery(query) {
    return [{
        $match: query
    },
    {
        $lookup: {
            from: 'keyissues',
            localField: 'keyIssueId',
            foreignField: '_id',
            as: 'keyIssueId'
        }
    },
    {
        $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryId'
        }
    }, {
        $unwind: {
            path: "$keyIssueId",
            preserveNullAndEmptyArrays: true
        }
    }, {
        $unwind: {
            path: "$categoryId",
            preserveNullAndEmptyArrays: true
        }
    }]
}