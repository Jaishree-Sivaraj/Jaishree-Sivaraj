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
        // let timeDetails=[]
        const taskDetailsObjectStartTime=Date.now()
        const taskDetailsObject = await TaskAssignment.findOne({
            _id: body.taskId
        }).populate({
            path: "companyId",
            populate: {
                path: "clientTaxonomyId"
            }
        }).populate('categoryId');
        // let taskDetailsObjectEndTime=Date.now()
        // timeDetails.push({
        //     blockName:'task Details,company Details,Clienttaxonomy Details and category Details',
        //     timeTaken:taskDetailsObjectEndTime-taskDetailsObjectStartTime
        // })

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
                            let isUpdatedDetailsStandaloneStartTime=Date.now()
                            isUpdated = await updateDerivedCalculationCompletedStatus(STANDALONE, updateQuery, body, dpCodesDetails);
                            // let isUpdatedDetailsStandaloneEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:' To Update the dervied Caluculation status of Standalone DataPoints',
                            //     timeTaken:isUpdatedDetailsStandaloneEndTime-isUpdatedDetailsStandaloneStartTime
                            // })
                            //! Current Data
                            let dpCodeDetailsStandaloneLoopStartTime=Date.now()
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];

                                // Getting the screenShot for current Data 
                                let formattedScreenShotsStandaloneStartTime=Date.now()

                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentData = getData(body, item, user, formattedScreenShots);
                                let formattedScreenShotsStandaloneEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'Getting Formated ScreenShot for Current Data',
                                //     timeTaken:formattedScreenShotsStandaloneEndTime-formattedScreenShotsStandaloneStartTime
                                // })
                                currentData = { ...currentData, correctionStatus: Completed };
                                let dpCodeDetailsStandaloneLoopEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:`Current Data for Standalone Datapoints ${dpIndex}`,
                                //     timeTaken:dpCodeDetailsStandaloneLoopEndTime-dpCodeDetailsStandaloneLoopStartTime
                                // })
                                // Getting Child dp to insert using fiscal year and current Data and ofcourse array of child Dp.
                               let  childDpDataDetailsInsertStandaloneStartTime=Date.now()
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
                            // let childpDpDataDetailsInsertStandaloneEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:`childDpDataDetails inseration od Standalone Datapoints ${currentData}`,
                            //     timeTaken:childDpDataDetailsInsertStandaloneStartTime-childpDpDataDetailsInsertStandaloneEndTime
                            // })

                            //! History Data //can history data be 
                            let historyYearStandalneLoopStartTime=Date.now()
                            for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
                                let item = dpHistoricalDpDetails[dpHistoryIndex];

                                // Getting formatted screenShot for current Data.
                                let historyFormattedScreenShotsStandaloneStartTime=Date.now()
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyData = getData(body, item, user, formattedScreenShots);
                                // let historyFormattedScreenShotsStandaloneEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'Getting Formated ScreenShot for Current Data of Standalone Datapoints ',
                                //     timeTaken:historyFormattedScreenShotsStandaloneEndTime-historyFormattedScreenShotsStandaloneStartTime
                                // })
                                // let historyYearStandalneLoopEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:`History Data for Standalone Datapoints${dpHistoryIndex}`,
                                //     timeTaken:historyYearStandalneLoopEndTime-historyYearStandalneLoopStartTime
                                // })
                                // Getting child dp using fiscal year, childDp array and historyData.
                                
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item.fiscalYear, item?.childDp, historyData);
                                let histroyChildDpDetailsStandaloneStartTime=Date.now()

                                await Promise.all([
                                    StandaloneDatapoints.updateMany({ year: item['fiscalYear'], ...updateQuery },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                historyYearData.push(historyData);
                            }
                            // let histroyChildDpDetailsStandaloneEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'Histroy childDpDeatils Inseration of Standalone Datapoints',
                            //     timeTaken:histroyChildDpDetailsStandaloneStartTime-histroyChildDpDetailsStandaloneEndTime
                            // })

                            //! concatinating history and current data
                            const structuredStandaloneDetails = _.concat(currentYearData, historyYearData);
                            // ! Inserting new Data
                            let standaloneDatapointsDetailsStartTime=Date.now()
                            const standaloneDp = await StandaloneDatapoints.insertMany(structuredStandaloneDetails);
                            if (standaloneDp) {
                                return res.status(200).json({
                                    status: 200,
                                    message: 'Data inserted Successfully',
                                    isDerviedCalculationCompleted: isUpdated ? false : true
                                });
                            }
                            // let standaloneDatapointsDetailsEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'Inserting a New Data of Standalone Datapoints',
                            //     timeTaken:standaloneDatapointsDetailsEndTime-standaloneDatapointsDetailsStartTime
                            // })
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
                            let isUpdatedBoardMatrixDetailsStartTime=Date.now()
                            isUpdated = await updateDerivedCalculationCompletedStatus(BOARD_MATRIX, updateQuery, body, dpCodesDetails);
                            // let isUpdatedBoardMatrixDetailsEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'To Update the Dervied Calculation Status for Board Matrix',
                            //     timeTaken:isUpdatedBoardMatrixDetailsEndTime-isUpdatedBoardMatrixDetailsStartTime
                            // })
                            //! Current Data
                            let dpCodeDetailsBoardMemberLoopStartTime=Date.now()
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                            
                               
                                // Getting formatted screenShot for current Data.
                                let formattedScreenShotsBoardMemberStartTime=Date.now()
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentData = getData(body, item, user, formattedScreenShots);
                                currentData = getData(body, item, user, formattedScreenShots);
                                // let formattedScreenShotsBoardMemberEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'Getting Formated ScreenShot for Current Data of Board Member',
                                //     timeTaken:formattedScreenShotsBoardMemberEndTime-formattedScreenShotsBoardMemberStartTime
                                // })

                                currentData = { ...currentData, memberName: body.memberName, correctionStatus: Completed };
                                // let dpCodeDetailsBoardMemberLoopEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:`Current Data for Board Matrix ${dpIndex}`,
                                //     timeTaken:dpCodeDetailsBoardMemberLoopEndTime-dpCodeDetailsBoardMemberLoopStartTime
                                // })
                                // Getting childDp to insert using array of child Dp, current Data and fiscal year.

                                let childDpDataDetailsBoardMemberStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentData);
                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                currentYearData.push(currentData);
                            }
                            // let childpDpDataDetailsBoardMemberEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:`childDpDataDetails inseration  of Board Member ${currentData}`,
                            //     timeTaken:childDpDataDetailsBoardMemberStartTime-childpDpDataDetailsBoardMemberEndTime
                            // })
                            //! History
                                let historyYearBoardMatrixLoopStartTime=Date.now()

                            for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
                                let item = dpHistoricalDpDetails[dpHistoryIndex];
                                // getting formatted image for history data.
                                let historyFormattedScreenShotsBoardMemberStartTime=Date.now()
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyData = getData(body, item, user, formattedScreenShots);
                                // let historyFormattedScreenShotsBoardMemberEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'Getting Formated ScreenShot for Current Data of Board Member',
                                //     timeTaken:historyFormattedScreenShotsBoardMemberEndTime-historyFormattedScreenShotsBoardMemberStartTime
                                // })
                                historyData = { ...historyData, memberName: body.memberName };
                                // getting child dp using history data, child Dp and fiscal year.
                                let historyChildDpDataDetailsBoardMemberStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyData);
                                // let historyChildpDpDataDetailsBoardMemberEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:`childDpDataDetails inseration of Board Member ${currentData}`,
                                //     timeTaken:chistoryChildDpDataDetailsBoardMemberStartTime-historyChildpDpDataDetailsBoardMemberEndTime
                                // })
                                // updating and inserting data for BoardMembersMatrixDataPoints and child dp respectively.
                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ year: item['fiscalYear'], memberName: body.memberName, ...updateQuery },
                                        { $set: { isActive: false } }),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ])
                                historyYearData.push(historyData);
                            }
                            // let historyYearBoardMatrixLoopEndTime=Date.now()
                            //     timeDetails.push({
                            //         blockName:`History Data for Board Matrix Datapoints${historyData}`,
                            //         timeTaken:historyYearBoardMatrixLoopEndTime-historyYearBoardMatrixLoopStartTime
                            //     })

                            //! Saving new data
                            const boardMemberDetails = _.concat(currentYearData, historyYearData);
                            let saveBoardMatrixDetailsStartTime=Date.now()
                            const saveBoardMatrix = await BoardMembersMatrixDataPoints.insertMany(boardMemberDetails);

                            if (saveBoardMatrix) {
                                res.status(200).json({
                                    status: 200,
                                    message: 'Data inserted Successfully',
                                    isDerviedCalculationCompleted: isUpdated ? false : true
                                });
                            }
                            // let saveBoardMatrixDetailsEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'Inserting a New Data for BoardMatrix',
                            //     timeTaken:saveBoardMatrixDetailsEndTime-saveBoardMatrixDetailsStartTime
                            // })
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
                            let isUpdatedKmpMatrixDetailsStartTime=Date.now()
                            isUpdated = await updateDerivedCalculationCompletedStatus(KMP_MATRIX, updateQuery, body, dpCodesDetails);
                            // let isUpdatedKmpMatrixDetailsEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'Updating Dervied Data Calculaion for KMp Matrix',
                            //     timeTaken:isUpdatedKmpMatrixDetailsEndTime-isUpdatedKmpMatrixDetailsStartTime
                            // })
                            //! Current Data
                            let currentYearLoopKMpMatrixStartTime=Date.now()
                            for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
                                let item = dpCodesDetails[dpIndex];
                                // Getting formatted screenShot for currentData.
                                let formattedScreenShotsKmpMatrixStartTime=Date.now()
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                currentData = getData(body, item, user, formattedScreenShots);
                                // let formattedScreenShotsKmpMatrixEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:' Getting Formatted Screnshot for Current Data',
                                //     timeTaken:formattedScreenShotsKmpMatrixEndTime-formattedScreenShotsKmpMatrixStartTime
                                // })
                                currentData = { ...currentData, memberName: body.memberName, correctionStatus: Completed };
                                // let currentYearLoopKMpMatrixEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:`Curent Year Data for Kmp Matrix${dpIndex}`,
                                //     timeTaken:currentYearLoopKMpMatrixEndTime-currentYearLoopKMpMatrixStartTime
                                // })
                                // Getting child dp using current Data, array of child dp and fiscal year.
                                let childDpDataDetailsKmpMatrixStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentData);
                                // let childDpDataDetailsKmpMatrixEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'Getting Child Dp using Current Data for KMp Matrix',
                                //     timeTaken:childDpDataDetailsStartTime-childDpDataDetailsEndTime

                                // })

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
                                // let formattedScreenShotsKmpMatrixStartTime=Date.now()
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyData = getData(body, item, user, formattedScreenShots);
                                // timeDetails.push({
                                //     blockName:'Getting Formated ScreenShot for Current Data of Kmp Matrix',
                                //     timeTaken:formattedScreenShotsKmpMatrixEndTime-formattedScreenShotsKmpMatrixStartTime
                                // })
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
                            // let isUpdatedDetailsStandaloneStartTime=Date.now()
                        
                            isUpdated = await updateDerivedCalculationCompletedStatus(STANDALONE, updateQuery, body, dpCodesDetails);
                            // let isUpdatedDetailsStandaloneEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:' To Update the dervied Caluculation status of Standalone DataPoints',
                            //     timeTaken:isUpdatedDetailsStandaloneEndTime-isUpdatedDetailsStandaloneStartTime
                            // })
                            // ! Current Data
                            let currentDpDetailsForCorrectionPendingStartTime=Date.now()

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
                                let errorDetailsStartTime=Date.now()
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
                                        // let errorDetailsEndTime=Date.now()
                                        // timeDetails.push({
                                        //     blockName:'To update the Error Details',
                                        //     timeTaken:errorDetailsEndTime-errorDetailsStartTime
                                        // })
                                        // let currentDpDetailsForCorrectionPendingEndTime=Date.now()
                                        // timeDetails.push({
                                        //     blockName:'current Data for Standalone Datapoints for correction Pending',
                                        //     timeTaken:currentDpDetailsForCorrectionPendingEndTime-currentDpDetailsForCorrectionPendingStartTime
                                        // })

                                        let formattedScreenShotsForCorrectionPendingStartTime=Date.now()


                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);

                                currentDataCorrection = getData(body, item, user, formattedScreenShots);
                                currentDataCorrection = {
                                    ...currentDataCorrection,
                                    dpStatus: "Error",
                                    hasCorrection: hasCorrectionValue,
                                    correctionStatus: Completed,
                                }
                                // let formattedScreenShotsForCorrectionPendingEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'getting screenshot of standalone Datapoints for Correction Pending',
                                //     timeTaken:formattedScreenShotsForCorrectionPendingEndTime-formattedScreenShotsForCorrectionPendingStartTime
                                // })
                                //! Saving current  Child Data
                                let childDpDataDetailsStandaloneatapointsCorrectionPendingStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, currentDataCorrection);
                                let standaloneDatapointsDetailsStartTime=Date.now()
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
                            // let childDpDataDetailsStandaloneatapointsCorrectionPendingEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'child DP Details for standalone Datapoints for Correction Pending',
                            //     timeTaken:childDpDataDetailsStandaloneatapointsCorrectionPendingStartTime-childDpDataDetailsStandaloneatapointsCorrectionPendingEndTime
                            // })
                            let standaloneDatapointsDetailsEndTime=Date.now()
                            timeDetails.push({
                                blockName:'To Update the Standalone Datapoints',
                                timeTaken:standaloneDatapointsDetailsEndTime-standaloneDatapointsDetailsStartTime
                            })

                            //! Historical Data
                            let historyDetailsOfStandaloneDatapointsStartTime=Date.now()
                            for (let historyDetails = 0; historyDetails < dpHistoricalDpDetails.length; historyDetails++) {
                                let item = dpHistoricalDpDetails[historyDetails];
                                //   Getting formatted screenShot for historyData.
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyDataCorrection = getData(body, item, user, formattedScreenShots)
                                //    Getting history child Dp.
                                let histroyChildDpDetailsStandaloneStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyDataCorrection);
                                await Promise.all([
                                    StandaloneDatapoints.updateMany({ ...updateQuery, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    StandaloneDatapoints.create(historyDataCorrection),
                                    ChildDp.insertMany(childpDpDataDetails)

                                ]);
                            }
                            // let histroyChildDpDetailsStandaloneEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'history child Dp details for Standalone Details for Correction Pending',
                            //     timeTaken:histroyChildDpDetailsStandaloneStartTime-historyChildpDpDataDetailsBoardMemberEndTime
                            // })
                            // let historyDetailsOfStandaloneDatapointsEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'History Data for Standalone Datapoints For corretion Pending',
                            //     timeTaken:historyDetailsOfStandaloneDatapointsEndTime-historyDetailsOfStandaloneDatapointsStartTime
                            // })

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
                            let isUpdatedBoardMatrixForCorrectionPendingStartTime=Date.now()
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
                                        // let isUpdatedBoardMatrixForCorrectionPendingEndTime=Dtae.now()
                                        // timeDetails.push({
                                        //     blockName:'update Dervied Calculation for Board Matrix of Correction Pending',
                                        //     timeTaken:isUpdatedBoardMatrixForCorrectionPendingEndTime-isUpdatedBoardMatrixForCorrectionPendingStartTime
                                        // })
                                // Getting formatted screenShot 
                                let formattedScreenShotsBoardMemberForCorrectionPendingStartTime=Date.now()
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
                                // let formattedScreenShotsBoardMemberForCorrectionPendingEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'Formatted screenshots for current data for Correction Pending',
                                //     timeTaken:formattedScreenShotsForCorrectionPendingEndTime-formattedScreenShotsBoardMemberForCorrectionPendingStartTime
                                // })
                                // Getting child Dp.
                                let childDpDataDetailsBoardMemberCorrectionPendingStartTime=Date.now()
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
                            // let childDpDataDetailsBoardMemberCorrectionPendingEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'getting child Dp for Board member for correction pending',
                            //     timeTaken:childDpDataDetailsBoardMemberCorrectionPendingStartTime-childDpDataDetailsBoardMemberCorrectionPendingEndTime
                            // })
                            //! Historical Data
                            let historyDataForBoardMemberOfCorrectionPendingStartTime=Date.now()
                            for (let historyIndex = 0; historyIndex < dpHistoricalDpDetails.length; historyIndex++) {
                                let item = dpHistoricalDpDetails[historyIndex];
                                // let historyDataForBoardMemberOfCorrectionPendingEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'History Year data for Board Matrix for Correction Pending',
                                //     timeTaken:historyDataForBoardMemberOfCorrectionPendingEndTime-historyDataForBoardMemberOfCorrectionPendingStartTime
                                // })
                                // Getting formatted screenShot 
                                historyFormattedScreenShotsBoardMemberForCorrectionPendingStartTime=Date.now()
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyDataCorrection = getData(body, item, user, formattedScreenShots);
                                historyDataCorrection = { ...historyDataCorrection, memberName: body.memberName };
                                // let historyFormattedScreenShotsBoardMemberForCorrectinPendingEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:'History data for Formatted ScreenShot  for BoardMember for correction pending',

                                //     timeTaken:historyFormattedScreenShotsBoardMemberForCorrectinPendingEndTime-historyDataForBoardMemberOfCorrectionPendingStartTime
                                // })
                                // Getting child Dp.
                                let historicalChildDpDataDetailsForBoardMemberForCorrectionPendingStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyDataCorrection);
                                await Promise.all([
                                    BoardMembersMatrixDataPoints.updateMany({ ...updateQuery, memberName: body.memberName, year: item['fiscalYear'] },
                                        { $set: { isActive: false } }),
                                    BoardMembersMatrixDataPoints.create(historicalDataYear),
                                    ChildDp.insertMany(childpDpDataDetails)
                                ]);
                            }
                            // let historicalChildDpDataDetailsForBoardMemberForCorrectionPendingEndTime=Date.now()
                            // timeDetails.push({
                            //     blockName:'geeting child Dp for Board Member for Correction pending',
                            //     timeTaken:historicalChildDpDataDetailsForBoardMemberForCorrectionPendingStartTime-historicalChildDpDataDetailsForBoardMemberForCorrectionPendingEndTime
                            // })

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
                            let isUpdatedKmpMatrixForCorrectionPendingStartTime=Date.now()
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
                                        // let isUpdatedKmpMatrixForCorrectionPendingEndTime=Date.now()
                                        // timeDetails.push({
                                        //     blockName:'Updating the dervied calculation for KmpMatrix for Correction Pending',
                                        //     timeTaken:isUpdatedKmpMatrixForCorrectionPendingEndTime-isUpdatedKmpMatrixForCorrectionPendingStartTime
                                        // })
                                // getting screenShot
                                //let formattedScreenShotsForCorrectionPendingEndTime
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
                                // timeDetails.push({
                                //     blockName:`childDpDataDetails inseration ${currentData}`,
                                //     timeTaken:childDpDataDetailsStartTime-childpDpDataDetailsEndTime
                                // })

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
                            // let historyYearKmpMatrixLoopStartTime=Date.now()
                            for (let historyIndex = 0; historyIndex < dpHistoricalDpDetails.length; historyIndex++) {
                                let item = dpHistoricalDpDetails[historyIndex];
                                historyChildDetails.push({
                                    year: item?.fiscalYear,
                                    childDp: item?.childDp
                                });
                                // let historyYearKmpMatrixLoopEndTime=Date.now()
                                // timeDetails.push({
                                //     blockName:`History Year Data for KMPmATRIX ${historyIndex}`,
                                //     timeTaken:historyYearKmpMatrixLoopEndTime-historyYearKmpMatrixLoopStartTime
                                // })
                                // Getting formatted ScreenShot 
                                let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
                                historyDataCorrection = getData(body, item, user, formattedScreenShots);

                                historyDataCorrection = { ...historyDataCorrection, memberName: body.memberName };
                                
                                // Getting Child Dp.
                                // let childDpDat.aDetailsStartTime=Date.now()
                                childpDpDataDetails = await getChildData(body, taskDetailsObject, item?.fiscalYear, item?.childDp, historyDataCorrection);
                                // timeDetails.push({
                                //     blockName:'Histroy childDpDeatils Inseration of Kmp Matrix',
                                //     timeTaken:histroyChildDpDetailsStartTime-histroyChildDpDetailsEndTime
                                // })

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

export async function saveScreenShot(screenShot, companyId, dpCodeId, fiscalYear) {
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
        const screenShotFileType = screenShot?.base64?.split(';')[0].split('/')[1];
        let screenshotFileName = companyId + '_' + dpCodeId + '_' + fiscalYear + '.' + screenShotFileType;
        await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenShot.base64);
        return screenshotFileName;

    }
    return formattedScreenShots;
}

export function getData(body, item, user, formattedScreenShots) {
    const { ...withoutPasswordUser } = user;
    const { password, ...users } = withoutPasswordUser._doc
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
        publicationDate: item?.source?.publicationDate,
        url: item.source['url'],
        sourceName: item?.source['sourceName'] + ";" + item.source['value'],
        isActive: true,
        status: true,
        additionalDetails: item['additionalDetails'],
        uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
        placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
        createdBy: users,
        createdAt: Date.now(),
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

export async function updateDerivedCalculationCompletedStatus(type, updateQuery, body, dpCodesDetails) {
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
                isDpDependent = await Rules.find({ parameter: { '$regex': getDataPointCode?.code, '$options': 'i' } }).lean();
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
                isDpDependent = await Rules.find({ parameter: { '$regex': getDataPointCode?.code, '$options': 'i' } }).lean();
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
                isDpDependent = await Rules.find({ parameter: { '$regex': getDataPointCode?.code, '$options': 'i' } }).lean();
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
export async function getChildData(body, taskDetailsObject, fiscalYear, childDp, data) { //current/history data
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
                childDetailsDatas.dpName = data?.dpName;
                if (Array.isArray(childDetailsDatas?.screenShot)) {
                    const url = await saveScreenShot(childDetailsDatas?.screenShot, taskDetailsObject?.companyId?.id, body?.dpCodeId, fiscalYear);
                    childDetailsDatas.screenShot = {
                        url,
                        name: childDetailsDatas.screenShot.name,
                        uid: childDetailsDatas.screenShot.uid

                    }
                }

                childDetailsDatas.units = {
                    measure: data?.subDataType?.measure ? data?.subDataType?.measure : '',
                    placeValues: data?.subDataType?.measure ? data?.subDataType?.measure : [],
                    uoms: data?.subDataType?.uoms ? data?.subDataType?.uoms : []
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
