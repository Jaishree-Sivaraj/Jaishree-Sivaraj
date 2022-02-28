'use strict';

import { StandaloneDatapoints } from '../standalone_datapoints';
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints';
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from "../../constants/dp-type";
import { getSourceDetails, getHistoryDataObject, getDisplayFields, getChildDp, getS3ScreenShot } from './dp-details-functions';
/*
I need to send all the historical years and send the data of the first historical year.
*/
export const getHistoricalData = async (req, res, next) => {
    try {

        // send current year as an array and historical year as a single data.
        const { year, taskId, datapointId, memberType, memberName, memberId, dpTypeValues, sourceList, displayFields, subDataType, companyId } = req.body;
        // This year can be current years of historical year.
        let historyQuery = {
            companyId,
            datapointId: datapointId,
            isActive: true,
            status: true
        }
        historyQuery = Array.isArray(year) ? {
            ...historyQuery,
            year: {
                $nin: year
            }
        } : {
            ...historyQuery,
            year: year
        }

        let sourceDetails = {
            url: '',
            sourceName: "",
            value: "",
            publicationDate: ''
        };
        let historicalDatapointsObject, historicalYears = [], childDp, currenthistoricalYear, historicalYearData;

        switch (memberType) {
            case STANDALONE:
                currenthistoricalYear = await StandaloneDatapoints.find(historyQuery).lean();
                BoardMembersMatrixDataPoints.find({
                    ...historyQuery,
                    memberName: memberName,
                })
                currenthistoricalYear.map(history => {
                    historicalYears.push(history?.year)
                });
                [historicalYearData] = currenthistoricalYear;
                sourceDetails = await getSourceDetails(historicalYearData, sourceDetails)
                historicalDatapointsObject = getHistoryDataObject(dpTypeValues, historicalYearData, sourceList, sourceDetails, historicalYearData?.year, subDataType);
                historicalDatapointsObject = {
                    standaradDeviation: historicalYearData.standaradDeviation,
                    average: historicalYearData.average, ...historicalDatapointsObject
                }
                historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, 'history', historicalYearData?.year, historicalDatapointsObject, false, false);
                childDp = await getChildDp(datapointId, historicalDatapointsObject.fiscalYear, taskId, companyId)

                historicalDatapointsObject.childDp = childDp;
                console.log(historicalDatapointsObject)
                break;
            case BOARD_MATRIX:
                currenthistoricalYear = await BoardMembersMatrixDataPoints.find({
                    ...historyQuery,
                    memberName: memberName,
                })
                currenthistoricalYear.map(history => {
                    historicalYears.push(history?.year)
                });
                [historicalYearData] = currenthistoricalYear;
                sourceDetails = await getSourceDetails(historicalYearData, sourceDetails)
                historicalDatapointsObject = getHistoryDataObject(dpTypeValues, historicalYearData, sourceList, sourceDetails, historicalYearData?.year, subDataType);
                historicalDatapointsObject = {
                    standaradDeviation: historicalYearData?.standaradDeviation,
                    average: historicalYearData?.average, ...historicalDatapointsObject
                }
                historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, 'history', historicalYearData?.year, historicalDatapointsObject, false, false);
                childDp = await getChildDp(datapointId, historicalDatapointsObject?.fiscalYear, taskId, companyId)
                historicalDatapointsObject.childDp = childDp;
                break;
            case KMP_MATRIX:
                currenthistoricalYear = await KmpMatrixDataPoints.find({
                    ...historyQuery,
                    memberName: memberName,
                })
                currenthistoricalYear.map(history => {
                    historicalYears.push(history?.year)
                });
                [historicalYearData] = currenthistoricalYear;
                sourceDetails = await getSourceDetails(historicalYearData, sourceDetails)
                historicalDatapointsObject = getHistoryDataObject(dpTypeValues, historicalYearData, sourceList, sourceDetails, historicalYearData?.year, subDataType);
                historicalDatapointsObject = {
                    standaradDeviation: historicalYearData?.standaradDeviation,
                    average: historicalYearData?.average, ...historicalDatapointsObject
                }
                historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, 'history', historicalYearData?.year, historicalDatapointsObject, false, false);
                childDp = await getChildDp(datapointId, historicalDatapointsObject?.fiscalYear, taskId, companyId)
                historicalDatapointsObject.childDp = childDp;
                break;
            default:
                break;
        }
        return res.status(200).json({
            status: 200,
            message: 'Successful in fetching all the data',
            response: { historicalData: historicalDatapointsObject, historicalYears }
        });

    } catch (error) {
        return res.json(409).json({
            status: 409,
            message: error?.message ? error?.message : 'Failed to fetch all datas'
        });
    }
}

export const getScreenShot = async (req, res, next) => {
    try {

        const { screenShot } = req.query;
        console.log(screenShot);
        const screenShotData = await getS3ScreenShot(screenShot);
        if (!screenShotData) {
            res.status(409).json({
                status: 409,
                message: 'Screenshot does not exist'
            });

        }
        res.status(200).json({
            status: 200,
            screenShot: screenShotData
        });
    } catch (error) {
        res.status(409).json({
            status: 409,
            message: error?.message ? error?.message : 'Failed to fetch screenshot'
        })
    }
}





































