import _ from 'lodash';
import { StandaloneDatapoints } from '../standalone_datapoints';
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints';
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { BoardMembers } from '../boardMembers';
import { Kmp } from '../kmp';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import {
  YetToStart,
} from '../../constants/task-status';
import {
  getError,
  getS3ScreenShot,
  getSourceDetails,
  getCurrentDatapointObject,
  getCurrentEmptyObject,
  getS3RefScreenShot,
  getDisplayFields,
  getChildDp,
} from './dp-details-functions';
import {
  getVariablesValues,
  getTaskDetailsFunctionIdPlaceValuesAndMeasureType,
  getErrorDetailsCompanySourceDetailsChildHeaders,
  getCompanySourceDetails,
  getSortedCurrentYearAndDisplayFields,
  getUomAndPlaceValues,
  getInputValues,
  getPrevAndNextDatapointsDetails,
  getTotalYearsForDataCollection,
  getClientTaxonomyAndDpTypeDetails
}
  from './datapoint-helper-function';
import { SELECT } from '../../constants/dp-datatype';

export const datapointDetails = async (req, res, next) => {
  try {
    let timeDetails = [];
    const {
      year,
      taskId,
      datapointId,
      memberType,
      memberName,
      memberId,
      isPriority,
      keyIssueId,
      dataType
    } = req.body;
    const { taskDetails, functionId, measureTypes, allPlaceValues } = await getTaskDetailsFunctionIdPlaceValuesAndMeasureType(taskId);
    const fiscalYearEndMonth = taskDetails.companyId.fiscalYearEndMonth;
    const fiscalYearEndDate = taskDetails.companyId.fiscalYearEndDate;
    const { dpTypeValues, clienttaxonomyFields } = await getClientTaxonomyAndDpTypeDetails(functionId, taskDetails, datapointId);
    let { currentYear, displayFields } = getSortedCurrentYearAndDisplayFields(year, clienttaxonomyFields?.fields, taskDetails, dpTypeValues);
    const { errorDataDetails, companySourceDetails, chilDpHeaders } = await getErrorDetailsCompanySourceDetailsChildHeaders(taskDetails, datapointId, currentYear)
    const sourceTypeDetails = getCompanySourceDetails(companySourceDetails);
    const { uomValues, placeValues } = await getUomAndPlaceValues(measureTypes, dpTypeValues, allPlaceValues);
    let inputValues = [];
    if (dpTypeValues?.dataType == SELECT) {
      inputValues = getInputValues(dpTypeValues?.unit);
    }
    const { prevDatapoint, nextDatapoint } = await getPrevAndNextDatapointsDetails(functionId, memberType, taskDetails,
      false,
      keyIssueId, dataType, isPriority, memberId, memberName, datapointId, year);
    let { currentQuery, historyQuery, datapointsObject, sourceDetails } = getVariablesValues(taskDetails, currentYear, datapointId, taskId, dpTypeValues);
    let isSFDR = false;
    if (!clienttaxonomyFields?.isDerivedCalculationRequired) {
      isSFDR = true;
    }
    // let historyYear;
    let historicalYears = [];
    let s3DataScreenshot = [];
    let s3DataRefErrorScreenshot = [];
    let childDp = [];

    let memberCollectionYears = [];
    switch (memberType) {
      case STANDALONE:
        let currentHistoryAllStandaloneDetailsStartTime = Date.now();
        const [currentAllStandaloneDetails, historyAllStandaloneDetails] =
          await Promise.all([
            StandaloneDatapoints.find(currentQuery)
              .populate('datapointId')
              .populate('companyId')
              .populate('taskId')
              .populate('uom'),
            ,
            StandaloneDatapoints.find(historyQuery),
          ]);

        trackTime(
          timeDetails,
          currentHistoryAllStandaloneDetailsStartTime,
          Date.now(),
          'Current and History All standalone Details'
        );

        historyAllStandaloneDetails?.map((historyYearData) => {
          let historyYearObject = {};
          historyYearObject[historyYearData?.year] = historyYearData?.response;
          historicalYears.push(historyYearObject);
        });

        datapointsObject = {
          ...datapointsObject,
          status: '',
        };

        let CurrentYearLoopStartTime = Date.now();
        for (
          let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(errorDataDetails, function (object) {
            if (object.year == currentYear[currentYearIndex]) {
              datapointsObject.comments.push(object.comments);
              datapointsObject.comments.push(object.rejectComment);
            }
          });

          let currentYearStandaloneLoopStartTime = Date.now();
          for (let currentIndex = 0; currentIndex < currentAllStandaloneDetails.length; currentIndex++) {
            const object = currentAllStandaloneDetails[currentIndex];
            const { errorTypeId, errorDetailsObject } = getError(
              errorDataDetails,
              currentYear[currentYearIndex],
              taskId,
              datapointId
            );

            const condition =
              object.datapointId._id == datapointId &&
              object.year == currentYear[currentYearIndex];
            if (condition && object.hasError) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                currentYear[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comments: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              ); //here we need to update the errorCaughtbyRep screenshot
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllStandaloneDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            } else if (condition && object.hasCorrection) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                currentYear[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comments: object.comments,
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllStandaloneDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            } else if (condition && !object.hasCorrection && !object.hasError) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                currentYear[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comments: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllStandaloneDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            }

            if (currentIndex == currentAllStandaloneDetails.length - 1) {
              trackTime(
                timeDetails,
                currentYearStandaloneLoopStartTime,
                Date.now(),
                `Standalone Loop `
              );
            }
          }

          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = getCurrentEmptyObject(
              dpTypeValues,
              currentYear[currentYearIndex],
              sourceTypeDetails,
              inputValues,
              uomValues,
              placeValues,
              isSFDR
            );
            currentDatapointsObject = getDisplayFields(
              dpTypeValues,
              displayFields,
              currentAllStandaloneDetails,
              currentYear[currentYearIndex],
              currentDatapointsObject,
              true,
              false
            );
            datapointsObject.status = YetToStart;
          }

          childDp = await getChildDp(
            datapointId,
            currentDatapointsObject.fiscalYear,
            taskId,
            taskDetails?.companyId?.id,
            uomValues,
            placeValues
          );
          currentDatapointsObject.childDp = childDp;
          datapointsObject.comments = datapointsObject.comments.filter(
            (value) => Object.keys(value).length !== 0
          );
          datapointsObject.currentData.push(currentDatapointsObject);

          if (currentYearIndex == currentYear.length - 1) {
            trackTime(
              timeDetails,
              CurrentYearLoopStartTime,
              Date.now(),
              `Current Year Standalone Loop `
            );
          }
        }

        if (chilDpHeaders && chilDpHeaders.length > 2) {
          chilDpHeaders.push({
            id: chilDpHeaders.length + 2,
            displayName: 'Source',
            fieldName: 'source',
            dataType: 'Select',
            options: sourceTypeDetails,
            isRequired: true,
            orderNumber: chilDpHeaders.length + 2,
          });
        }
        datapointsObject = { ...datapointsObject, isSFDR };
        return res.status(200).send({
          status: 200,
          message: 'Data collection dp codes retrieved successfully!',
          response: {
            prevDatapoint,
            nextDatapoint,
            chilDpHeaders,
            dpTypeValues,
            displayFields,
            historicalYears,
            timeDetails,
            dpCodeData: datapointsObject,
          },
        });
      case BOARD_MATRIX:
        const [
          currentAllBoardMemberMatrixDetails,
          historyAllBoardMemberMatrixDetails,
          memberDetails,
        ] = await Promise.all([
          BoardMembersMatrixDataPoints.find({
            ...currentQuery,
            memberName: { $regex: memberName, $options: 'i' },
          })
            .populate('datapointId')
            .populate('companyId')
            .populate('taskId')
            .populate('uom'),
          BoardMembersMatrixDataPoints.find({
            ...historyQuery,
            memberName: { $regex: memberName, $options: 'i' },
          }),
          BoardMembers.findOne({
            BOSP004: memberName,
            status: true,
          }),
        ]);

        memberCollectionYears = getTotalYearsForDataCollection(currentYear, memberDetails, fiscalYearEndMonth, fiscalYearEndDate);

        historyAllBoardMemberMatrixDetails?.map((historyYearData) => {
          let historyYearObject = {};
          historyYearObject[historyYearData?.year] = historyYearData?.response;
          historicalYears.push(historyYearObject);
        });
        // historyYear = _.orderBy(_.uniqBy(historyAllBoardMemberMatrixDetails, 'year'), 'year', 'desc');
        // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;

        datapointsObject = {
          ...datapointsObject,
          status: '',
        };
        let currentYearLoopBoardMemberStartTime = Date.now();
        for (let currentYearIndex = 0; currentYearIndex < memberCollectionYears?.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(errorDataDetails, function (object) {
            if (object.year == memberCollectionYears[currentYearIndex]) {
              datapointsObject.comments.push(object.comments);
              datapointsObject.comments.push(object.rejectComment);
            }
          });

          let currentYearLoopBoardMemberStartTime = Date.now();
          for (
            let currentIndex = 0;
            currentIndex < currentAllBoardMemberMatrixDetails?.length;
            currentIndex++
          ) {
            const object = currentAllBoardMemberMatrixDetails[currentIndex];
            const { errorTypeId, errorDetailsObject } = getError(
              errorDataDetails,
              memberCollectionYears[currentYearIndex],
              taskId,
              datapointId
            );

            const condition =
              object.datapointId._id == datapointId &&
              object.year == memberCollectionYears[currentYearIndex];

            if (condition && object.hasError) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                memberCollectionYears[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comments: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllBoardMemberMatrixDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            } else if (condition && object.hasCorrection) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                memberCollectionYears[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comments: object.comments,
              };

              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep.screenShot
              );
              currentDatapointsObject.error.refData.screenShot =
                s3DataRefErrorScreenshot;
              currentDatapointsObject.error.refData['additionalDetails'] = [];
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllBoardMemberMatrixDetails,
                memberCollectionYears[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              );
            } else if (condition && !object.hasCorrection && !object.hasError) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                memberCollectionYears[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comments: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]
                  ? errorDetailsObject[0]?.errorCaughtByRep
                    ? errorDetailsObject[0]?.errorCaughtByRep?.screenShot
                      ? errorDetailsObject[0]?.errorCaughtByRep?.screenShot
                      : []
                    : []
                  : []
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllBoardMemberMatrixDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            }
            datapointsObject.status = 'Completed';
          }
          trackTime(
            timeDetails,
            currentYearLoopBoardMemberStartTime,
            Date.now(),
            `BoardMatrix Loop `
          );

          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = getCurrentEmptyObject(
              dpTypeValues,
              memberCollectionYears[currentYearIndex],
              sourceTypeDetails,
              inputValues,
              uomValues,
              placeValues.includes,
              isSFDR
            );
            currentDatapointsObject = {
              ...currentDatapointsObject,
              memberName: memberName,
            };

            currentDatapointsObject = getDisplayFields(
              dpTypeValues,
              displayFields,
              currentAllBoardMemberMatrixDetails,
              '',
              currentDatapointsObject,
              true,
              false
            );
            datapointsObject.status = YetToStart;
          }
          childDp = await getChildDp(
            datapointId,
            currentDatapointsObject.fiscalYear,
            taskId,
            taskDetails?.companyId?.id,
            uomValues,
            placeValues
          );
          currentDatapointsObject.childDp = childDp;
          datapointsObject.comments = datapointsObject.comments.filter(
            (value) => Object.keys(value).length !== 0
          );
          datapointsObject.currentData.push(currentDatapointsObject);
        }
        trackTime(
          timeDetails,
          currentYearLoopBoardMemberStartTime,
          Date.now(),
          `Current Year BoardMatrix Loop `
        );

        // for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories; hitoryYearIndex++) {
        //     let historicalDatapointsObject = {};
        //     for (let historyBoardMemberIndex = 0; historyBoardMemberIndex < historyAllBoardMemberMatrixDetails.length; historyBoardMemberIndex++) {
        //         let object = historyAllBoardMemberMatrixDetails[historyBoardMemberIndex];
        //         [s3DataScreenshot, sourceDetails] = await Promise.all([
        //             getS3ScreenShot(object.screenShot),
        //             getSourceDetails(object, sourceDetails)
        //         ]);
        //         if (object.year == historyYear[hitoryYearIndex].year && object.memberName.toLowerCase() == memberName.toLowerCase()) {
        //             historicalDatapointsObject = getHistoryDataObject(dpTypeValues, object, s3DataScreenshot, sourceTypeDetails, sourceDetails, historyYear[hitoryYearIndex].year, uomValues, placeValues);
        //             historicalDatapointsObject = getDisplayFields(dpTypeValues, displayFields, historyAllBoardMemberMatrixDetails, historyYear[hitoryYearIndex].year, historicalDatapointsObject, false, false);
        //             childDp = await getChildDp(datapointId, historicalDatapointsObject.fiscalYear, taskId, taskDetails?.companyId?.id, uomValues, placeValues)
        //             historicalDatapointsObject.childDp = childDp;
        //             datapointsObject.historicalData.push(historicalDatapointsObject);
        //         }
        //     }
        // }

        if (chilDpHeaders && chilDpHeaders.length > 2) {
          chilDpHeaders.push({
            id: chilDpHeaders.length + 2,
            displayName: 'Source',
            fieldName: 'source',
            dataType: 'Select',
            options: sourceTypeDetails,
            isRequired: true,
            orderNumber: chilDpHeaders.length + 2,
          });
        }
        datapointsObject = { ...datapointsObject, isSFDR };
        return res.status(200).send({
          status: 200,
          message: 'Data collection dp codes retrieved successfully!',
          response: {
            prevDatapoint,
            nextDatapoint,
            chilDpHeaders,
            dpTypeValues,
            displayFields,
            historicalYears,
            timeDetails,
            dpCodeData: datapointsObject,
          },
        });
      case KMP_MATRIX:
        let currentHistoryAllKmpMatrixDetailsStartTime = Date.now();
        const [
          currentAllKmpMatrixDetails,
          historyAllKmpMatrixDetails,
          kmpMemberDetails,
        ] = await Promise.all([
          KmpMatrixDataPoints.find({
            ...currentQuery,
            memberName: { $regex: memberName, $options: 'i' },
          })
            .populate('datapointId')
            .populate('companyId')
            .populate('taskId')
            .populate('uom'),
          KmpMatrixDataPoints.find({
            ...historyQuery,
            memberName: { $regex: memberName, $options: 'i' },
          }),
          Kmp.findOne({
            MASP003: memberName,
            status: true,
          }),
        ]);

        memberCollectionYears = getTotalYearsForDataCollection(currentYear, kmpMemberDetails, fiscalYearEndMonth, fiscalYearEndDate);

        trackTime(
          timeDetails,
          currentHistoryAllKmpMatrixDetailsStartTime,
          Date.now(),
          `Current and history Kmp`
        );

        historyAllKmpMatrixDetails?.map((historyYearData) => {
          let historyYearObject = {};
          historyYearObject[historyYearData?.year] = historyYearData?.response;
          historicalYears.push(historyYearObject);
        });
        // historyYear = _.orderBy(_.uniqBy(historyAllKmpMatrixDetails, 'year'), 'year', 'desc');
        datapointsObject = {
          ...datapointsObject,
          status: YetToStart,
        };
        // totalHistories = historyYear.length > 5 ? 5 : historyYear.length;
        const startKmpLoop = Date.now();
        for (
          let currentYearIndex = 0;
          currentYearIndex < memberCollectionYears?.length;
          currentYearIndex++
        ) {
          let currentDatapointsObject = {};
          _.filter(errorDataDetails, function (object) {
            if (
              object.year == memberCollectionYears[currentYearIndex]
            ) {
              datapointsObject.comments.push(object.comments);
              datapointsObject.comments.push(object.rejectComment);
            }
          });
          let currentYearLoopKmpMatrixDetailsLoopStartTime = Date.now();
          for (
            let currentIndex = 0;
            currentIndex < currentAllKmpMatrixDetails.length;
            currentIndex++
          ) {
            const object = currentAllKmpMatrixDetails[currentIndex];
            const { errorTypeId, errorDetailsObject } = getError(
              errorDataDetails,
              memberCollectionYears[currentYearIndex],
              taskId,
              datapointId
            );

            const condition =
              object.datapointId._id == datapointId &&
              object.year == memberCollectionYears[currentYearIndex];
            if (condition && object.hasError == true) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                memberCollectionYears[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comment: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllKmpMatrixDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            } else if (condition && object.hasCorrection == true) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                memberCollectionYears[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comment: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]?.errorCaughtByRep?.screenShot
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllKmpMatrixDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            } else if (
              condition &&
              object.hasCorrection == false &&
              object.hasError == false
            ) {
              [s3DataScreenshot, sourceDetails] = await Promise.all([
                getS3ScreenShot(object?.screenShot),
                getSourceDetails(object),
              ]);
              currentDatapointsObject = getCurrentDatapointObject(
                s3DataScreenshot,
                dpTypeValues,
                memberCollectionYears[currentYearIndex],
                inputValues,
                object,
                sourceTypeDetails,
                sourceDetails,
                errorDetailsObject,
                errorTypeId,
                uomValues,
                placeValues,
                isSFDR
              );
              currentDatapointsObject = {
                ...currentDatapointsObject,
                comment: [],
              };
              s3DataRefErrorScreenshot = await getS3RefScreenShot(
                errorDetailsObject.length,
                errorDetailsObject[0]
                  ? errorDetailsObject[0]?.errorCaughtByRep
                    ? errorDetailsObject[0]?.errorCaughtByRep?.screenShot
                      ? errorDetailsObject[0]?.errorCaughtByRep?.screenShot
                      : []
                    : []
                  : []
              );
              if (currentDatapointsObject?.error?.refData?.screenShot) {
                currentDatapointsObject.error.refData.screenShot =
                  s3DataRefErrorScreenshot;
                currentDatapointsObject.error.refData['additionalDetails'] = [];
              }
              currentDatapointsObject = getDisplayFields(
                dpTypeValues,
                displayFields,
                currentAllKmpMatrixDetails,
                currentYear[currentYearIndex],
                currentDatapointsObject,
                false,
                true
              );
            }
            if (currentIndex == currentAllKmpMatrixDetails.length - 1) {
              trackTime(
                timeDetails,
                currentYearLoopKmpMatrixDetailsLoopStartTime,
                Date.now(),
                `Kmp Loop`
              );
            }
          }
          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = getCurrentEmptyObject(
              dpTypeValues,
              memberCollectionYears[currentYearIndex],
              sourceTypeDetails,
              inputValues,
              uomValues,
              placeValues,
              isSFDR
            );
            currentDatapointsObject = {
              ...currentDatapointsObject,
              memberName: memberName,
            };
            currentDatapointsObject = getDisplayFields(
              dpTypeValues,
              displayFields,
              currentAllKmpMatrixDetails,
              '',
              currentDatapointsObject,
              true,
              false
            );
            datapointsObject.status = YetToStart;
          }
          childDp = await getChildDp(
            datapointId,
            currentDatapointsObject.fiscalYear,
            taskId,
            taskDetails?.companyId?.id,
            uomValues,
            placeValues
          );
          currentDatapointsObject.childDp = childDp;
          datapointsObject.comments = datapointsObject.comments.filter(
            (value) => Object.keys(value).length !== 0
          );
          datapointsObject.currentData.push(currentDatapointsObject);
          if (currentYearIndex == currentYear.length - 1) {
            trackTime(timeDetails, startKmpLoop, Date.now(), `Kmp year Loop`);
          }
        }

        if (chilDpHeaders && chilDpHeaders.length > 2) {
          chilDpHeaders.push({
            id: chilDpHeaders.length + 2,
            displayName: 'Source',
            fieldName: 'source',
            dataType: 'Select',
            options: sourceTypeDetails,
            isRequired: true,
            orderNumber: chilDpHeaders.length + 2,
          });
        }

        datapointsObject = { ...datapointsObject, isSFDR };
        return res.status(200).send({
          status: 200,
          message: 'Data collection dp codes retrieved successfully!',
          response: {
            prevDatapoint,
            nextDatapoint,
            chilDpHeaders,
            dpTypeValues,
            displayFields,
            timeDetails,
            historicalYears,
            dpCodeData: datapointsObject,
          },
        });
      default:
        return res.status(409).json({
          message: 'Invalid Member Type.',
        });
        break;
    }
  } catch (error) {
    return res.status(409).json({
      message: error.message,
    });
  }
};

function trackTime(arr, startTime, endTime, blockName) {
  arr.push({
    blockName,
    timeTaken: endTime - startTime,
  });
}