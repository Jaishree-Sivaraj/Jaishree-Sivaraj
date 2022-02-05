import { StandaloneDatapoints } from '.';
import _ from 'lodash'
import { Rules } from "../rules";
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { ErrorDetails } from '../errorDetails';
import { Datapoints } from '../datapoints'
import { TaskAssignment } from '../taskAssignment';
import { storeFileInS3 } from "../../services/utils/aws-s3";
import { Pending, CorrectionPending, Completed, CollectionCompleted } from '../../constants/task-status';
import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from '../../constants/dp-type';
import { ChildDp } from '../child-dp';
import { Analyst } from '../../constants/roles';
import { isAwaitExpression } from '@babel/types';
// Incoming payload
// currentDatapoint:
// [
//     {
//         child-dp-code:[{}].
//     }],
//  }
//  historyDatapoint:[
//     {
//     child-dp-code:[{}] // last priority.
//     }]

export const dataCollection = async ({
    user, body,
}, res) => {
    try {
        const taskDetailsObject = await TaskAssignment.findOne({
            _id: body.taskId
        }).populate({
            path: "companyId",
            populate: {
                path: "clientTaxonomyId"
            }
        }).populate('categoryId');

        const dpCodesDetails = body.currentData;
        const dpHistoricalDpDetails = body.historicalData;
        const updateQuery = {
            companyId: body.companyId,
            datapointId: body.dpCodeId,
            isActive: true,
            status: true
        }

        let isUpdated, childpDpDataDetails;
        switch (taskDetailsObject.taskStatus) {
            case Pending:
                let historyYearData = [], currentYearData = [], currentData, historyData;
                switch (body.memberType) {
                    case STANDALONE:
                        try {
                            // For updating isDerviedDatapointCompleted.
                            isUpdated = await updateDerivedCalculationCompletedStatus(STANDALONE, updateQuery, body, dpCodesDetails);
                            //! Current Data
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                // Getting the screenShot for current Data 
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentData = getData(body, item, user, formattedScreenShots);
                                currentData = { ...currentData, correctionStatus: Completed };
                                // Getting Child dp to insert using fiscal year and current Data and ofcourse array of child Dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentData);
                                await Promise.all([
                                    StandaloneDatapoints.updateMany(
                                        {
                                            ...updateQuery,
                                            year: item['fiscalYear'],
                                        },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                currentYearData.push(currentData);

                            }

                            //! History Data //can history data be 
                            for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
                                let item = dpHistoricalDpDetails[dpHistoryIndex];
                                // Getting formatted screenShot for current Data.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyData = getData(body, item, user, formattedScreenShots);
                                // Getting child dp using fiscal year, childDp array and historyData.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item.fiscalYear, item?.childDp, historyData);

                                await Promise.all([
                                    StandaloneDatapoints.updateMany({ year: item['fiscalYear'], ...updateQuery },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                historyYearData.push(historyData);
                            }

                            //! concatinating history and current data
                            const structuredStandaloneDetails = _.concat(currentYearData, historyYearData);
                            // ! Inserting new Data
                            const standaloneDp = await StandaloneDatapoints.insertMany(structuredStandaloneDetails);
                            if (standaloneDp) {
                                return res.status(200).json({
                                    status: 200,
                                    message: 'Data inserted Successfully',
                                    isDerviedCalculationCompleted: isUpdated ? false : true
                                });
                            }
                            return res.status(409).json({
                                status: 409,
                                message: 'Failed to save the data'
                            });

                        } catch (error) {
                            return res.status(500).json({
                                message: error.message ? error.message : 'Failed to save the data'
                            });

                        }
                        break;
                    case BOARD_MATRIX:
                        try {
                            isUpdated = await updateDerivedCalculationCompletedStatus(BOARD_MATRIX, updateQuery, body, dpCodesDetails);
                            //! Current Data
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                // Getting formatted screenShot for current Data.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentData = getData(body, item, user, formattedScreenShots);
                                currentData = { ...currentData, memberName: body.memberName, correctionStatus: Completed };
                                // Getting childDp to insert using array of child Dp, current Data and fiscal year.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentData);
                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                currentYearData.push(currentData);
                            }
                            //! History
                            for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
                                let item = dpHistoricalDpDetails[dpHistoryIndex];
                                // getting formatted image for history data.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyData = getData(body, item, user, formattedScreenShots);
                                historyData = { ...historyData, memberName: body.memberName };
                                // getting child dp using history data, child Dp and fiscal year.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyData);
                                // updating and inserting data for BoardMembersMatrixDataPoints and child dp respectively.
                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ year: item['fiscalYear'], memberName: body.memberName, ...updateQuery },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                historyYearData.push(historyData);
                            }

                            //! Saving new data
                            const boardMemberDetails = _.concat(currentYearData, historyYearData);
                            const saveBoardMatrix = await BoardMembersMatrixDataPoints.insertMany(boardMemberDetails);

                            if (saveBoardMatrix) {
                                res.status(200).json({
                                    status: 200,
                                    message: 'Data inserted Successfully',
                                    isDerviedCalculationCompleted: isUpdated ? false : true
                                });
                            }
                            return res.status(409).json({
                                status: 409,
                                message: 'Failed to save the data'
                            });
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error.message ? error.message : 'Failed to save the data'
                            });

                        }
                    case KMP_MATRIX:
                        try {
                            isUpdated = await updateDerivedCalculationCompletedStatus(KMP_MATRIX, updateQuery, body, dpCodesDetails);
                            //! Current Data
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                // Getting formatted screenShot for currentData.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentData = getData(body, item, user, formattedScreenShots);
                                currentData = { ...currentData, memberName: body.memberName, correctionStatus: Completed };
                                // Getting child dp using current Data, array of child dp and fiscal year.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentData);
                                // Updating and inserting data to KmpMatrixDataPoints and ChildDp respectively.
                                await Promise.all([
                                    KmpMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                currentYearData.push(currentData);
                            }
                            //! History Data
                            for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
                                let item = dpHistoricalDpDetails[dpHistoryIndex];
                                // Getting formatted screenShot for history data.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyData = getData(body, item, user, formattedScreenShots);
                                historyData = { ...historyData, memberName: body.memberName };
                                // Getting child dp using current data, fiscal year,array of child dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyData);
                                // Updating and inserting data to KmpMatrixDataPoints and ChildDp respectively.
                                await Promise.all([
                                    KmpMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                historyYearData.push(historyData);
                            }

                            //! Saving New Data
                            const kmpMemberDetails = _.concat(currentYearData, historyYearData);
                            const saveKmpMatrix = await KmpMatrixDataPoints.insertMany(kmpMemberDetails);
                            if (saveKmpMatrix) {
                                return res.status(200).json({
                                    message: "Data inserted Successfully",
                                    isDerviedCalculationCompleted: isUpdated ? false : true
                                });
                            }
                            return res.status(409).json({
                                status: 409,
                                message: 'Failed to save the data'
                            });
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error.message ? error.message : 'Failed to save the data'
                            });

                        }
                    default:
                        return res.json({
                            status: 500,
                            message: 'Invalid member type'
                        })
                }
            case CorrectionPending:
                let currentDataCorrection, historyDataCorrection;
                switch (body.memberType) {
                    case STANDALONE:
                        try {
                            isUpdated = await updateDerivedCalculationCompletedStatus(STANDALONE, updateQuery, body, dpCodesDetails);
                            // ! Current Data
                            for (let dpDetailsIndex = 0; dpDetailsIndex < dpCodesDetails.length; dpDetailsIndex++) {
                                let item = dpCodesDetails[dpDetailsIndex]
                                let hasCorrectionValue = true;
                                const query = {
                                    taskId: body.taskId,
                                    datapointId: body.dpCodeId,
                                    year: item['fiscalYear'],
                                    raisedBy: item.rejectedTo,
                                    status: true
                                }
                                item?.isAccepted
                                    ? await ErrorDetails.updateOne(query,
                                        { $set: { isErrorAccepted: true, isErrorRejected: false } })
                                    : await ErrorDetails.updateOne(query,
                                        {
                                            $set: {
                                                rejectComment:
                                                {
                                                    author: Analyst,
                                                    fiscalYear: item.fiscalYear,
                                                    dateTime: Date.now(),
                                                    content: item.rejectComment
                                                }
                                            }, isErrorAccepted: false, isErrorRejected: true
                                        });
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);

                                currentDataCorrection = getData(body, item, user, formattedScreenShots);
                                currentDataCorrection = {
                                    ...currentDataCorrection,
                                    dpStatus: "Error",
                                    hasCorrection: hasCorrectionValue,
                                    correctionStatus: Completed,
                                }
                                //! Saving current  Child Data
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentDataCorrection);

                                await Promise.all([
                                    StandaloneDatapoints.updateMany({
                                        ...updateQuery,
                                        year: item['fiscalYear']
                                    }, {
                                        $set: { isActive: false }
                                    }),
                                    StandaloneDatapoints.create(currentDataCorrection)
                                        .catch(err => {
                                            return res.status('500').json({
                                                message: err.message ? err.message : "Failed to save the data"
                                            });
                                        }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ]);
                            }

                            //! Historical Data
                            for (let historyDetails = 0; historyDetails < dpHistoricalDpDetails.length; historyDetails++) {
                                let item = dpHistoricalDpDetails[historyDetails];
                                //   Getting formatted screenShot for historyData.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyDataCorrection = getData(body, item, user, formattedScreenShots)
                                //    Getting history child Dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyDataCorrection);
                                await Promise.all([
                                    StandaloneDatapoints.updateMany({ ...updateQuery, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    StandaloneDatapoints.create(historyDataCorrection),
                                    ChildDp.insertMany(childpDpDataDetails)

                                ]);
                            }

                            return res.status(200).json({
                                status: 200,
                                message: "Data inserted Successfully",
                                isDerviedCalculationCompleted: isUpdated ? false : true

                            });
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error.message ? error.message : 'Failed to save the data'
                            });

                        }

                    case BOARD_MATRIX:
                        try {
                            isUpdated = await updateDerivedCalculationCompletedStatus(BOARD_MATRIX, updateQuery, body, dpCodesDetails);
                            //! Current Data
                            for (let dpDetailsIndex = 0; dpDetailsIndex < dpCodesDetails.length; dpDetailsIndex++) {
                                let item = dpCodesDetails[dpDetailsIndex];
                                let hasCorrectionValue = true;
                                const query = {
                                    taskId: body.taskId,
                                    datapointId: body.dpCodeId,
                                    year: item['fiscalYear'],
                                    raisedBy: item.rejectedTo,
                                    status: true
                                }
                                item?.isAccepted
                                    ? await ErrorDetails.updateOne({ ...query, memberName: body.memberName },
                                        { $set: { isErrorAccepted: true, isErrorRejected: false } })
                                    : await ErrorDetails.updateOne({ ...query, memberName: body.memberName },
                                        {
                                            $set: {
                                                rejectComment:
                                                {
                                                    author: 'Analyst',
                                                    fiscalYear: item.fiscalYear,
                                                    dateTime: Date.now(),
                                                    content: item.rejectComment
                                                }
                                            }, isErrorAccepted: false, isErrorRejected: true
                                        });
                                // Getting formatted screenShot 
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentDataCorrection = getData(body, item, user, formattedScreenShots);
                                currentDataCorrection = {
                                    ...currentDataCorrection,
                                    memberName: body.memberName,
                                    dpStatus: "Error",
                                    hasError: false,
                                    hasCorrection: hasCorrectionValue,
                                    correctionStatus: 'Completed',
                                }
                                // Getting child Dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentDataCorrection);

                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    BoardMembersMatrixDataPoints.create(currentDataCorrection).catch(err => {
                                        return res.status('500').json({
                                            message: err.message ? err.message : "Failed to save the data"
                                        }),
                                            ChildDp.insertMany(childpDpDataDetails)
                                    })
                                ])
                            }
                            //! Historical Data
                            for (let historyIndex = 0; historyIndex < dpHistoricalDpDetails.length; historyIndex++) {
                                let item = dpHistoricalDpDetails[historyIndex];
                                // Getting formatted screenShot 
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyDataCorrection = getData(body, item, user, formattedScreenShots);
                                historyDataCorrection = { ...historyDataCorrection, memberName: body.memberName };
                                // Getting child Dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyDataCorrection);
                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    BoardMembersMatrixDataPoints.create(historicalDataYear),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ]);
                            }
                            return res.status(200).json({
                                status: 200,
                                message: 'Data Saved',
                                isDerviedCalculationCompleted: isUpdated ? false : true
                            });
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error.message ? error.message : 'Failed to save the data'
                            });

                        }

                    case KMP_MATRIX:
                        try {
                            isUpdated = await updateDerivedCalculationCompletedStatus(KMP_MATRIX, updateQuery, body, dpCodesDetails);
                            //! Current Data
                            for (let dpDetailsIndex = 0; dpDetailsIndex < dpCodesDetails.length; dpDetailsIndex++) {
                                let item = dpCodesDetails[dpDetailsIndex];
                                let hasCorrectionValue = true;
                                const query = {
                                    taskId: body.taskId,
                                    datapointId: body.dpCodeId,
                                    year: item['fiscalYear'],
                                    raisedBy: item.rejectedTo,
                                    status: true
                                }
                                item?.isAccepted
                                    ? await ErrorDetails.updateOne({ ...query, memberName: body.memberName },
                                        { $set: { isErrorAccepted: true, isErrorRejected: false } })
                                    : await ErrorDetails.updateOne({ ...query, memberName: body.memberName },
                                        {
                                            $set: {
                                                rejectComment:
                                                {
                                                    author: 'Analyst',
                                                    fiscalYear: item.fiscalYear,
                                                    dateTime: Date.now(),
                                                    content: item.rejectComment
                                                }
                                            }, isErrorAccepted: false, isErrorRejected: true
                                        });
                                // getting screenShot
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentDataCorrection = getData(body, item, user, formattedScreenShots);
                                currentDataCorrection = {
                                    ...currentDataCorrection, hasError: false,
                                    hasCorrection: hasCorrectionValue,
                                    dpStatus: "Error",
                                    memberName: body.memberName,
                                    correctionStatus: 'Completed',
                                };
                                // Getting Child Dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentDataCorrection);

                                await Promise.all([
                                    KmpMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    KmpMatrixDataPoints.create(currentDataCorrection).catch(err => {
                                        return res.status('500').json({
                                            message: err.message ? err.message : "Failed to save the data"
                                        }),
                                            ChildDp.insertMany(childpDpDataDetails)
                                    })
                                ])

                            }
                            //! Historical Data
                            for (let historyIndex = 0; historyIndex < dpHistoricalDpDetails.length; historyIndex++) {
                                let item = dpHistoricalDpDetails[historyIndex];
                                historyChildDetails.push({
                                    year: item?.fiscalYear,
                                    childDp: item?.childDp
                                });
                                // Getting formatted ScreenShot 
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyDataCorrection = getData(body, item, user, formattedScreenShots);
                                historyDataCorrection = { ...historyDataCorrection, memberName: body.memberName };
                                // Getting Child Dp.
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyDataCorrection);

                                await Promise.all([
                                    KmpMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    KmpMatrixDataPoints.create(historyDataCorrection)
                                        .catch(err => {
                                            return res.status('500').json({
                                                message: err.message ? err.message : "Failed to save the data"
                                            });
                                        }),
                                    ChildDp.insertMany(childpDpDataDetails)

                                ])
                            }
                            return res.status(200).json({
                                status: 200,
                                message: 'Data Saved',
                                isDerviedCalculationCompleted: isUpdated ? false : true
                            });
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error.message ? error.message : 'Failed to save the data'
                            });

                        }
                    default:
                        return res.json({
                            status: 500,
                            message: 'Invalid member type'
                        });
                }

            case CollectionCompleted:
                // Get the current data of standalone and update the child data.
                switch (body.memberType) {
                    case STANDALONE:
                        try {

                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                const getCurrentData = await StandaloneDatapoints({ ...updateQuery, year: item.fiscalYear });
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, getCurrentData);
                                const saveChildDp = await ChildDp.insertMany(childpDpDataDetails);
                                if (!saveChildDp) {
                                    return res.status(409).json({
                                        status: 409,
                                        message: 'Failed to save child dp'
                                    });
                                }
                                return res.status(200).json({
                                    status: 200,
                                    message: 'Saved Child Dp'
                                });
                            }
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error?.message ? error?.message : 'Failed to save data'
                            });
                        }
                        break;
                    case BOARD_MATRIX:
                        try {
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                const getCurrentData = await BoardMembersMatrixDataPoints({ ...updateQuery, year: item.fiscalYear, memberName: body.memberName, });
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, getCurrentData);
                                const saveChildDp = await ChildDp.insertMany(childpDpDataDetails);
                                if (!saveChildDp) {
                                    return res.status(409).json({
                                        status: 409,
                                        message: 'Failed to save child dp'
                                    });
                                }
                                return res.status(200).json({
                                    status: 200,
                                    message: 'Saved Child Dp'
                                });
                            }
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error?.message ? error?.message : 'Failed to save data'
                            });
                        }
                        break;
                    case KMP_MATRIX:
                        try {
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                const getCurrentData = await KmpMatrixDataPoints({ ...updateQuery, year: item.fiscalYear, memberName: body.memberName, });
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, getCurrentData);
                                const saveChildDp = await ChildDp.insertMany(childpDpDataDetails);
                                if (!saveChildDp) {
                                    return res.status(409).json({
                                        status: 409,
                                        message: 'Failed to save child dp'
                                    });
                                }
                                return res.status(200).json({
                                    status: 200,
                                    message: 'Saved Child Dp'
                                });
                            }
                        } catch (error) {
                            return res.status(500).json({
                                status: 500,
                                message: error?.message ? error?.message : 'Failed to save data'
                            });
                        }
                        break;
                    default:
                        break;

                }


            default:
                return res.json({
                    status: 500,
                    message: 'Invalid task status'
                })

        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: 500
        });
    }
}

async function saveScreenShot(screenShot, companyId, dpCodeId, fiscalYear) {
    let formattedScreenShots = [];
    if (screenShot && screenShot.length > 0) {
        for (let screenshotIndex = 0; screenshotIndex < screenShot.length; screenshotIndex++) {
            let screenshotItem = screenShot[screenshotIndex];
            let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
            let screenshotFileName = companyId + '_' + dpCodeId + '_' + fiscalYear + '_' + screenshotIndex + '.' + screenShotFileType;
            await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
            formattedScreenShots.push(screenshotFileName);
        }
    }
    if (screenShot && !Array.isArray(screenShot)) {
        const screenShotFileType = screenShot.base64.split(';')[0].split('/')[1];
        let screenshotFileName = companyId + '_' + dpCodeId + '_' + fiscalYear + '.' + screenShotFileType;
        await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenShot.base64);
        return screenshotFileName;

    }
    return formattedScreenShots;
}

function getData(body, item, user, formattedScreenShots) {
    return {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        year: item['fiscalYear'],
        taskId: body.taskId,
        response: item['response'],
        screenShot: formattedScreenShots, //aws filename todo
        textSnippet: item['textSnippet'],
        pageNumber: item['pageNo'],
        optionalAnalystComment: item['optionalAnalystComment'],
        isRestated: item['isRestated'],
        restatedForYear: item['restatedForYear'],
        restatedInYear: item['restatedInYear'],
        restatedValue: item['restatedValue'],
        publicationDate: item?.source['publicationDate'],
        url: item.source['url'],
        sourceName: item?.source['sourceName'] + ";" + item.source['value'],
        isActive: true,
        status: true,
        additionalDetails: item['additionalDetails'],
        uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
        placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
        createdBy: user,
        updatedAt: Date.now()
        // member name for other dptype except Standalone
        // correctionStatus for currentDataCorrection.

        // ! this is for correctionCompleted data.   
        // hasError: false,
        // hasCorrection: hasCorrectionValue,
        // dpStatus: "Error",
        // memberName: body.memberName,
        // correctionStatus: 'Completed',
    }
}

async function updateDerivedCalculationCompletedStatus(type, updateQuery, body, dpCodesDetails) {
    try {
        let datapointDataBeenChanged, getDataPointCode, isDpDependent;
        let isDatapointChanged = false;
        switch (type) {
            case STANDALONE:
                [datapointDataBeenChanged, getDataPointCode] = await Promise.all([
                    StandaloneDatapoints.findOne(updateQuery, { response: 1, _id: 0 }).lean(),
                    Datapoints.findOne({ _id: body.dpCodeId }, { _id: 0, code: 1 }).lean()
                ]);
                dpCodesDetails.map(obj => {
                    if (obj.response !== datapointDataBeenChanged?.response) {
                        // If the collected response is not same as the existing response then datapoint has not been changed 
                        isDatapointChanged = true; // datapoint response have been changed.
                    }
                });
                isDpDependent = await Rules.find({ parameter: getDataPointCode?.code }).lean();
                console.log(isDpDependent);
                if (isDpDependent.length > 0 && isDatapointChanged) {
                    await TaskAssignment.findOneAndUpdate({
                        _id: body.taskId,
                        isDerviedCalculationCompleted: true
                    }, { isDerviedCalculationCompleted: false }, { new: true });
                }
                break;
            case BOARD_MATRIX:
                [datapointDataBeenChanged, getDataPointCode] = await Promise.all([
                    BoardMembersMatrixDataPoints.findOne({ ...updateQuery, memberName: body.memberName }, { response: 1, _id: 0 }).lean(),
                    Datapoints.findOne({ _id: body.dpCodeId }, { _id: 0, code: 1 }).lean()
                ]);
                dpCodesDetails.map(obj => {
                    if (obj.response !== datapointDataBeenChanged?.response) {
                        isDatapointChanged = true;
                    }
                });
                isDpDependent = await Rules.find({ parameter: getDataPointCode?.code }).lean();
                if (isDpDependent.length > 0 && isDatapointChanged) {
                    await TaskAssignment.findOneAndUpdate({
                        _id: body.taskId,
                        isDerviedCalculationCompleted: true
                    }, { isDerviedCalculationCompleted: false }, { new: true });
                }
                break;
            case KMP_MATRIX:
                [datapointDataBeenChanged, getDataPointCode] = await Promise.all([
                    KmpMatrixDataPoints.findOne({ ...updateQuery, memberName: body.memberName }, { response: 1, _id: 0 }).lean(),
                    Datapoints.findOne({ _id: body.dpCodeId }, { _id: 0, code: 1 }).lean()
                ]);
                dpCodesDetails.map(obj => {
                    if (obj.response !== datapointDataBeenChanged?.response) {
                        isDatapointChanged = true;
                    }
                });
                isDpDependent = await Rules.find({ parameter: getDataPointCode?.code }).lean();
                if (isDpDependent.length > 0 && isDatapointChanged) {
                    await TaskAssignment.findOneAndUpdate({
                        _id: body.taskId,
                        isDerviedCalculationCompleted: true
                    }, { isDerviedCalculationCompleted: false }, { new: true });
                }

                break;
            default:
                updatedDerivedCalculation = {};
                break;

        }
        return isDpDependent.length > 0 && isDatapointChanged
    } catch (error) {
        console.log(error);
        return error;

    }
}

// check if child dp is empty or not 
async function getChildData(body, taskDetailsObject, fiscalYear, childDp, data) { //current/history data
    try {
        let childData = [];
        if (childDp?.length >= 0) {
            await ChildDp.updateMany(
                {
                    companyId: taskDetailsObject?.companyId?.id,
                    parentDpId: body.dpCodeId,
                    isActive: true,
                    status: true,
                    year: fiscalYear,
                },
                { $set: { isActive: false } });

            // Formatting docs to save data.
            for (let childIndex = 0; childIndex < childDp.length; childIndex++) {
                let childDetailsDatas = childDp[childIndex];
                if (childDetailsDatas?.screenShot) {
                    const url = await saveScreenShot(childDetailsDatas.screenShot, taskDetailsObject?.companyId?.id, body?.dpCodeId, fiscalYear);
                    childDetailsDatas.screenShot = {
                        url,
                        name: childDetailsDatas.screenShot.name,
                        uid: childDetailsDatas.screenShot.uid

                    }
                }
                childData.push({
                    parentDpId: body?.dpCodeId,
                    companyId: taskDetailsObject?.companyId?.id,
                    taskId: taskDetailsObject?.id,
                    year: fiscalYear,
                    childFields: childDetailsDatas,
                    parentFields: data
                });
            }

        }
        // returning the configured data.
        return childData;

    } catch (error) {
        console.log(error?.message);
        return
    }
}

// current Year Data.
