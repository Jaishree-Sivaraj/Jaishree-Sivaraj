'use strict';

import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from "../../constants/dp-type";
import { saveScreenShot, getData, getChildData } from '../standalone_datapoints/data-collection';
import { StandaloneDatapoints } from '../standalone_datapoints';
import { ChildDp } from '../child-dp';

export const saveHistoricalDatapoint = async ({ body, user }, res, next) => {
    try {
        const { memberType, taskId, companyId, dpCodeId, data } = body;

        let historyData, childpDpDataDetails, formattedScreenShots, childDp, create;
        const updateQuery = {
            companyId: companyId,
            datapointId: dpCodeId,
            isActive: true,
            status: true
        }
        switch (memberType) {
            case STANDALONE:
                formattedScreenShots = await saveScreenShot(data?.saveScreenShot, companyId, dpCodeId, data?.fiscalYear);
                historyData = getData(body, data, user, formattedScreenShots);
                // Getting child dp using fiscal year, childDp array and historyData.
                childpDpDataDetails = await getChildData(body, { ...taskDetailsObject, companyId }, data?.fiscalYear, data?.childDp, historyData);

                [, childDp, create] = await Promise.all([
                    StandaloneDatapoints.updateMany({ year: data?.fiscalYear, ...updateQuery },
                        { $set: { isActive: false } }),
                    ChildDp.insertMany(childpDpDataDetails),
                    StandaloneDatapoints.create(historyData)
                ]);
                if (!create || !childDp) {
                    return res.status(409).json({
                        status: 409,
                        message: 'Failed to save the historical data'
                    })

                }
                return res.status(200).json({
                    status: 200,
                    message: 'Successful in saving the historical data',
                    data: historyData
                });

            case BOARD_MATRIX:
                formattedScreenShots = await saveScreenShot(data?.saveScreenShot, companyId, dpCodeId, data?.fiscalYear);
                historyData = getData(body, data, user, formattedScreenShots);
                historyData = { ...historyData, memberName: body.memberName };

                // Getting child dp using fiscal year, childDp array and historyData.
                childpDpDataDetails = await getChildData(body, { ...taskDetailsObject, companyId }, data?.fiscalYear, data?.childDp, historyData);

                [, childDp, create] = await Promise.all([
                    BoardMembersMatrixDataPoints.updateMany({ year: item['fiscalYear'], memberName: body.memberName, ...updateQuery },
                        { $set: { isActive: false } }),
                    ChildDp.insertMany(childpDpDataDetails),
                    StandaloneDatapoints.create(historyData)
                ]);
                if (!create || !childDp) {
                    return res.status(409).json({
                        status: 409,
                        message: 'Failed to save the historical data'
                    })

                }
                return res.status(200).json({
                    status: 200,
                    message: 'Successful in saving the historical data',
                    data: historyData
                });

            case KMP_MATRIX:
                formattedScreenShots = await saveScreenShot(data?.saveScreenShot, companyId, dpCodeId, data?.fiscalYear);
                historyData = getData(body, data, user, formattedScreenShots);
                historyData = { ...historyData, memberName: body.memberName };

                // Getting child dp using fiscal year, childDp array and historyData.
                childpDpDataDetails = await getChildData(body, { ...taskDetailsObject, companyId }, data?.fiscalYear, data?.childDp, historyData);

                [, childDp, create] = await Promise.all([
                    BoardMembersMatrixDataPoints.updateMany({ year: item['fiscalYear'], memberName: body.memberName, ...updateQuery },
                        { $set: { isActive: false } }),
                    ChildDp.insertMany(childpDpDataDetails),
                    StandaloneDatapoints.create(historyData)
                ]);
                if (!create || !childDp) {
                    return res.status(409).json({
                        status: 409,
                        message: 'Failed to save the historical data'
                    });

                }
                return res.status(200).json({
                    status: 200,
                    message: 'Successful in saving the historical data',
                    data: historyData
                });

            default:
                return res.status(409).json({
                    status: 409,
                    message: 'Invalid Member Type'
                })

        }
        
    } catch (error) {
        return res.status(409).json({
            status: 409,
            message: error?.message ? error?.message : 'Failed to save historical datapoint'
        })
    }

}