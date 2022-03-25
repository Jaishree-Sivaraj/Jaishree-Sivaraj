'use strict';

import { StandaloneDatapoints } from '../standalone_datapoints';
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints';
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { BOARD_MATRIX, KMP_MATRIX, STANDALONE } from "../../constants/dp-type";
import { getSourceDetails, getHistoryDataObjectYearWise, getDisplayFields, getChildDp, getS3ScreenShot } from './dp-details-functions';
/*
I need to send all the historical years and send the data of the first historical year.
*/
export const getHistoricalData = async (req, res, next) => {
    try {
        // send current year as an array and historical year as a single data.
        const { year, taskId, datapointId, memberType, memberName, memberId, dpTypeValues, sourceList, displayFields, subDataType, companyId } = req.body;
        /*   
         *  When incoming year is an array => Current Year
        ? The incoming year will be in descending order 
         *  When incoming year is a string => Historical Year.
        */

        if (Array.isArray(year) && year?.length < 0) {
            return res.status(409).json({
                status: 409,
                message: 'Incorrect fiscal year'
            });
        }

        let historyQuery = {
            companyId,
            datapointId: datapointId,
            isActive: true,
            status: true
        }

        historyQuery = Array.isArray(year) ? {
            ...historyQuery,
            $and: [{ year: { $nin: year } }, { year: { $lt: year[0] } }]

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
        let historicalDatapointsObject, historicalYears = [], childDp, currenthistoricalYear, historicalYearData, screen = [];

        switch (memberType) {
            case STANDALONE:
                currenthistoricalYear = await StandaloneDatapoints.find(historyQuery).lean();
                currenthistoricalYear.map(history => {
                    historicalYears.push(history?.year)
                });
                [historicalYearData] = currenthistoricalYear;
                sourceDetails = await getSourceDetails(historicalYearData, sourceDetails);
                historicalDatapointsObject = getHistoryDataObjectYearWise(dpTypeValues, historicalYearData, sourceList, sourceDetails, historicalYearData?.year, subDataType);
                historicalDatapointsObject = {
                    standaradDeviation: historicalYearData?.standaradDeviation,
                    average: historicalYearData?.average, ...historicalDatapointsObject
                }
                historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, 'history', historicalYearData?.year, historicalDatapointsObject, false, false);
                childDp = await getChildDp(datapointId, historicalDatapointsObject.fiscalYear, taskId, companyId)

                historicalDatapointsObject.childDp = childDp;
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
                sourceDetails = await getSourceDetails(historicalYearData, sourceDetails);
                historicalDatapointsObject = getHistoryDataObjectYearWise(dpTypeValues, historicalYearData, sourceList, sourceDetails, historicalYearData?.year, subDataType);
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
                });

                currenthistoricalYear.map(history => {
                    historicalYears.push(history?.year)
                });
                [historicalYearData] = currenthistoricalYear;
                sourceDetails = await getSourceDetails(historicalYearData, sourceDetails);
                historicalDatapointsObject = getHistoryDataObjectYearWise(dpTypeValues, historicalYearData, sourceList, sourceDetails, historicalYearData?.year, subDataType);
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
        return res.status(200).json({
            url: screenShotData?.url
        })
    } catch (error) {
        res.status(409).json({
            status: 409,
            message: error?.message ? error?.message : 'Failed to fetch screenshot'
        })
    }
}

function getShot(screenShot) {
    console.log(screenShot);
    let image = []
    if (screenShot?.length > 0) {
        for (let i = 0; i < screenShot?.length; i++) {
            image.push({
                id: i,
                name: '',
                url: screenShot[i]
            });
        }
    } else {
        image.push({
            id: '',
            name: '',
            url: ''
        });
    }
    return image;

}




































