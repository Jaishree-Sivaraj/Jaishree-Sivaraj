import {
  success,
  notFound,
  authorOrAdmin
} from '../../services/response/'
import {
  ErrorDetails
} from '.'
import {
  BoardMembersMatrixDataPoints
} from '../boardMembersMatrixDataPoints'
import {
  KmpMatrixDataPoints
} from '../kmpMatrixDataPoints'
import { Errors } from '../error'
import XLSX from 'xlsx'
import _ from 'lodash'
import { TaskAssignment } from '../taskAssignment'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { storeFileInS3 } from "../../services/utils/aws-s3";
import { ChildDp } from '../child-dp';
import { getChildData, getData, saveScreenShot } from '../standalone_datapoints/data-collection';
import { getErrorData } from './helper-function';
import { Completed } from '../../constants/task-status';
import { QA } from '../../constants/roles'


export const create = ({
  user,
  bodymen: {
    body
  }
}, res, next) =>
  ErrorDetails.create({
    ...body,
    createdBy: user
  })
    .then((errorDetails) => errorDetails.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({
  querymen: {
    query,
    select,
    cursor
  }
}, res, next) =>
  ErrorDetails.count(query)
    .then(count => ErrorDetails.find(query, select, cursor)
      .populate('createdBy')
      .populate('errorTypeId')
      .populate('taskId')
      .populate('datapointsId')
      .populate('categoryId')
      .populate('companyId')
      .then((errorDetails) => ({
        count,
        rows: errorDetails.map((errorDetails) => errorDetails.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({
  params
}, res, next) =>
  ErrorDetails.findById(params.id)
    .populate('createdBy')
    .populate('errorTypeId')
    .populate('taskId')
    .populate('datapointsId')
    .populate('categoryId')
    .populate('companyId')
    .then(notFound(res))
    .then((errorDetails) => errorDetails ? errorDetails.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({
  user,
  bodymen: {
    body
  },
  params
}, res, next) =>
  ErrorDetails.findById(params.id)
    .populate('createdBy')
    .populate('errorTypeId')
    .populate('taskId')
    .populate('datapointsId')
    .populate('categoryId')
    .populate('companyId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((errorDetails) => errorDetails ? Object.assign(errorDetails, body).save() : null)
    .then((errorDetails) => errorDetails ? errorDetails.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({
  user,
  params
}, res, next) =>
  ErrorDetails.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((errorDetails) => errorDetails ? errorDetails.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const trackError = async ({
  user,
  bodymen: {
    body
  },
  params
}, res, next) => {
  try {
    console.log(body.isErrorAccepted, body.isErrorRejected, body.rejectComment, body.taskId, body.datapointId);
    if (body.isErrorAccepted == true) {
      await ErrorDetails.update({
        taskId: body.taskId,
        datapointId: body.datapointId
      }, {
        $set: {
          isErrorAccepted: true
        }
      });
      return res.status(200).json({
        message: "Error Accepted"
      })
    } else if (body.isErrorRejected == true) {
      await ErrorDetails.update({
        taskId: body.taskId,
        datapointId: body.datapointId
      }, {
        $set: {
          isErrorRejected: true,
          rejectComment: body.rejectComment
        }
      });
      return res.status(200).json({
        message: "Error Rejected and updated the status"
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message
    })
  }

}

export const saveErrorDetails = async ({
  user,
  bodymen: {
    body
  },
  params
}, res, next) => {
  try {
    let dpCodesDetails = body.currentData;
    let dpHistoricalDpDetails = body.historicalData;
    let currentYearValues = [...new Set(dpCodesDetails.map(obj => obj.fiscalYear))];
    let historicalDataYear = [...new Set(dpHistoricalDpDetails.map(obj => obj.fiscalYear))];
    let yearValue = _.concat(currentYearValues, historicalDataYear)
    let errorTypeDetails = await Errors.find({
      status: true
    });
    let errorCaughtByRep = {}, dpCodeDetails = [];
    let dpStatus = "";
    let taskDetails = await TaskAssignment.findOne({ _id: body.taskId });
    if (taskDetails.taskStatus == 'Collection Completed') {
      dpStatus = "Collection";
    } else {
      dpStatus = "Correction";
    }
    if (body.memberType == 'Standalone') {
      for (let index = 0; index < dpCodesDetails.length; index++) {
        try {
          let item = dpCodesDetails[index];
          //store in s3 bucket with filename     

          if (item?.collectionYear) {
            item.additionalDetails.collectionYear = item?.collectionYear;
          }
          if (item.isUnfreezed == true && item.error.isThere == true) {
            await StandaloneDatapoints.updateMany({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true }, { $set: { status: false } });
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
            let standaloneDatapoints = getErrorData(body, item, errorTypeObject, errorCaughtByRep, user)
            let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
            let data = getData(body, item, user, formattedScreenShots);
            data = {
              ...data,
              hasError: true, hasCorrection: false, correctionStatus: Completed,
              dpStatus: dpStatus,
            }
            let childpDpDataDetails = await getChildData(body, { companyId: { id: body?.companyId }, id: body?.taskId }, item?.fiscalYear, item?.childDp, data);
            await Promise.all([
              StandaloneDatapoints.create(data),
              ChildDp.insertMany(childpDpDataDetails),
              ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
                { $set: standaloneDatapoints }, { upsert: true })
            ])
          }
          else if (item.isUnfreezed == true) {
            await StandaloneDatapoints.updateMany({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true }, { $set: { status: false } });
            let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
            let data = getData(body, item, user, formattedScreenShots);
            data = {
              ...data, dpStatus, hasError: false,
              hasCorrection: false,
              correctionStatus: Completed,
            }
            let childpDpDataDetails = await getChildData(body, { companyId: { id: body?.companyId }, id: body?.taskId }, item?.fiscalYear, item?.childDp, data);
            await Promise.all([
              StandaloneDatapoints.create(data),
              ChildDp.insertMany(childpDpDataDetails)
            ])

          } else if (item.error.isThere == true) {
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
            let standaloneDatapoints = getErrorData(body, item, errorTypeObject, errorCaughtByRep, user)
            await Promise.all([
              StandaloneDatapoints.updateMany({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true }, { $set: { hasError: true, hasCorrection: false, correctionStatus: 'Completed' } }),
              ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
                { $set: standaloneDatapoints }, { upsert: true })
            ])
          } else {
            await StandaloneDatapoints.updateMany({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true }, { $set: { hasError: false, hasCorrection: false, correctionStatus: 'Completed' } });
          }
        } catch (error) {
          return next(error);
        }
      }
      for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
        let item = dpHistoricalDpDetails[index];
        await StandaloneDatapoints.updateOne({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
          { $set: { status: false } });
        await StandaloneDatapoints.create({
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          taskId: item.taskId,
          year: item['fiscalYear'],
          response: item['response'],
          screenShot: item['screenShot'],
          textSnippet: item['textSnippet'],
          pageNumber: item['pageNo'],
          optionalAnalystComment: item['optionalAnalystComment'],
          isRestated: item['isRestated'],
          restatedForYear: item['restatedForYear'],
          restatedInYear: item['restatedInYear'],
          restatedValue: item['restatedValue'],
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          correctionStatus: 'Completed',
          isActive: true,
          status: true,
          uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
          placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
          createdBy: user
        })
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
    } else if (body.memberType == 'Board Matrix') {
      for (let index = 0; index < dpCodesDetails.length; index++) {
        try {
          let item = dpCodesDetails[index];

          if (item?.collectionYear) {
            item.additionalDetails.collectionYear = item?.collectionYear;
          }
          if (item.isUnfreezed && item.error.isThere) {
            await BoardMembersMatrixDataPoints.updateMany({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
              { $set: { status: false } });
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
            let errorDp = getErrorData(body, item, errorTypeObject, errorCaughtByRep, user)

            let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
            let data = getData(body, item, user, formattedScreenShots);
            data = {
              ...data,
              hasError: true,
              hasCorrection: false,
              correctionStatus: Completed,
              dpStatus: dpStatus,
              memberName: body.memberName,
              memberStatus: true,
            };
            let childpDpDataDetails = await getChildData(body, { companyId: { id: body?.companyId }, id: body?.taskId }, item?.fiscalYear, item?.childDp, data);
            await Promise.all([
              BoardMembersMatrixDataPoints.create(data).catch(error => {
                res.status('500').json({
                  message: error.message
                })
              }),
              ChildDp.insertMany(childpDpDataDetails),
              ErrorDetails.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
                { $set: errorDp }, { upsert: true })
            ])
          }
          else if (item.isUnfreezed == true) {
            await BoardMembersMatrixDataPoints.updateMany({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
              { $set: { status: false } });
            let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);

            let data = getData(body, item, user, formattedScreenShots);
            data = {
              ...data,
              hasError: false,
              hasCorrection: false,
              correctionStatus: Completed,
              dpStatus: dpStatus,
              memberName: body.memberName,
              memberStatus: true,
            }

            let childpDpDataDetails = await getChildData(body, { companyId: { id: body?.companyId }, id: body?.taskId }, item?.fiscalYear, item?.childDp, data);

            await Promise.all([
              BoardMembersMatrixDataPoints.create(data).catch(error => {
                res.status('500').json({
                  message: error.message
                })
              }),
              ChildDp.insertMany(childpDpDataDetails)
            ]);

          } else if (item.error.isThere == true) {
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
            let errorDp = getErrorData(body, item, errorTypeObject, errorCaughtByRep, user)
            await Promise.all([
              ErrorDetails.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
                { $set: errorDp }, { upsert: true }),
              BoardMembersMatrixDataPoints.updateMany({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
                { $set: { hasError: true, hasCorrection: false, correctionStatus: 'Completed' } })
            ]);
          } else {
            await BoardMembersMatrixDataPoints.updateMany({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
              { $set: { hasError: false, hasCorrection: false, correctionStatus: 'Completed' } });
          }
        } catch (error) {
          return next(error);
        }
      }
      for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
        try {
          let item = dpHistoricalDpDetails[index];
          await BoardMembersMatrixDataPoints.updateOne({ companyId: body.companyId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { status: false } });
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64 ? screenshotItem.base64.split(';')[0].split('/')[1] : '';
              if (screenshotItem.base64) {
                let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
                await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
                formattedScreenShots.push(screenshotFileName);
              }
            }
          }
          await BoardMembersMatrixDataPoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            correctionStatus: 'Completed',
            memberStatus: true,
            isActive: true,
            status: true,
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            createdBy: user
          })
        } catch (error) {
          return next(error);
        }
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
    } else if (body.memberType == 'KMP Matrix') {
      for (let index = 0; index < dpCodesDetails.length; index++) {
        try {
          let item = dpCodesDetails[index];

          if (item?.collectionYear) {
            item.additionalDetails.collectionYear = item?.collectionYear;
          }
          if (item.isUnfreezed && item.error.isThere) {
            await KmpMatrixDataPoints.updateMany({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
              { $set: { status: false } });
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
            let errorDp = getErrorData(body, item, errorTypeObject, errorCaughtByRep, user)

            let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);
            let data = getData(body, item, user, formattedScreenShots);
            data = {
              ...data,
              hasError: true,
              hasCorrection: false,
              correctionStatus: Completed,
              dpStatus: dpStatus,
              memberName: body.memberName,
              memberStatus: true,
            };
            let childpDpDataDetails = await getChildData(body, { companyId: { id: body?.companyId }, id: body?.taskId }, item?.fiscalYear, item?.childDp, data);
            await Promise.all([
              KmpMatrixDataPoints.create(data).catch(error => {
                res.status('500').json({
                  message: error.message
                })
              }),
              ChildDp.insertMany(childpDpDataDetails),
              ErrorDetails.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
                { $set: errorDp }, { upsert: true })
            ])
          } else if (item.isUnfreezed == true) {
            await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
              { $set: { status: false } });
            let formattedScreenShots = await saveScreenShot(item['screenShot'], body.companyId, body.dpCodeId, item['fiscalYear']);

            let childpDpDataDetails = await getChildData(body, { companyId: { id: body?.companyId }, id: body?.taskId }, item?.fiscalYear, item?.childDp, data);
            let data = getData(body, item, user, formattedScreenShots);
            data = {
              ...data,
              hasError: false,
              hasCorrection: false,
              correctionStatus: Completed,
              dpStatus: dpStatus,
              memberName: body.memberName,
              memberStatus: true,
            };
            await Promise.all([
              KmpMatrixDataPoints.create(data).catch(error => {
                res.status('500').json({
                  message: error.message
                });
              }),
              ChildDp.insertMany(childpDpDataDetails)
            ]);
          } else if (item.error.isThere == true) {
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
            let errorDp = getErrorData(body, item, errorTypeObject, errorCaughtByRep, user)

            await Promise.all([
              KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
                { $set: { hasError: true, hasCorrection: false, correctionStatus: 'Completed' } }),
              ErrorDetails.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
                { $set: errorDp }, { upsert: true })
            ])
          } else {
            await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
              { $set: { hasError: false, hasCorrection: false, correctionStatus: 'Completed' } });
          }
        } catch (error) {
          return next(error);
        }
      }
      for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
        try {
          let item = dpHistoricalDpDetails[index];
          await KmpMatrixDataPoints.updateOne({ companyId: body.companyId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
            { $set: { status: false } });
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64 ? screenshotItem.base64.split(';')[0].split('/')[1] : '';
              if (screenshotItem.base64) {
                let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
                await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
                formattedScreenShots.push(screenshotFileName);
              }
            }
          }
          await KmpMatrixDataPoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            correctionStatus: 'Completed',
            isActive: true,
            memberStatus: true,
            status: true,
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            createdBy: user
          })
        } catch (error) {
          return next(error);
        }
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
    }
  } catch (error) {
    return res.status(400).json({ status: "400", message: "Failed to save the error details!" });
  }
}

export const saveRepErrorDetails = async ({ user, bodymen: { body }, params }, res, next) => {
  try {
    let dpCodesDetails = body.currentData;
    let errorTypeDetails = await Errors.find({
      status: true
    });
    let errorCaughtByRep = {};
    if (body.memberType == 'Standalone') {
      for (let index = 0; index < dpCodesDetails.length; index++) {
        let item = dpCodesDetails[index];

        if (item?.collectionYear) {
          item.additionalDetails.collectionYear = item?.collectionYear;
        }
        //store in s3 bucket with filename       
        if (item.error.isThere == true) {
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
          if (item?.error?.refData === '' || item?.error?.refData === "") {
            errorCaughtByRep == null
          } else {
            let formattedScreenShots = [];
            if (item?.error?.refData?.screenShot && item?.error?.refData?.screenShot?.length > 0) {
              for (let screenshotIndex = 0; screenshotIndex < item?.error?.refData?.screenShot?.length; screenshotIndex++) {
                let screenshotItem = item?.error?.refData?.screenShot[screenshotIndex];
                let screenShotFileType = screenshotItem?.base64 ? screenshotItem?.base64.split(';')[0].split('/')[1] : '';
                if (screenshotItem?.base64) {
                  let screenshotFileName = body?.companyId + '_' + body?.dpCodeId + '_' + item['fiscalYear'] + '_' + screenshotIndex + '.' + screenShotFileType;
                  await storeFileInS3(process?.env?.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem?.base64)
                    .catch((error) => { return res.status(400).json({ status: "400", message: error?.message ? error?.message : "Failed to store the screenshot!" }) });
                  formattedScreenShots.push(screenshotFileName);
                }
              }
            }
            errorCaughtByRep = {
              description: item?.error?.refData?.description,
              response: item?.error?.refData?.response,
              screenShot: formattedScreenShots,
              dataType: item?.error?.refData?.dataType,
              fiscalYear: item?.fiscalYear,
              textSnippet: item?.error?.refData?.textSnippet,
              pageNo: item?.error?.refData?.pageNo,
              optionalAnalystComment: item?.error?.refData?.optionalAnalystComment,
              isRestated: item?.error?.refData?.isRestated,
              restatedForYear: item?.error?.refData?.restatedForYear,
              restatedInYear: item?.error?.refData?.restatedInYear,
              restatedValue: item?.error?.refData?.restatedValue,
              source: {
                publicationDate: item?.error?.refData?.source?.publicationDate,
                url: item?.error?.refData?.source?.url,
                sourceName: item?.error?.refData?.source?.sourceName
              },
              additionalDetails: item?.error?.refData?.additionalDetails
            }
          }
          let standaloneDatapoints = {
            datapointId: body?.dpCodeId,
            companyId: body?.companyId,
            categoryId: body?.pillarId,
            year: item?.fiscalYear,
            taskId: body?.taskId,
            errorTypeId: errorTypeObject[0] ? errorTypeObject[0]?.id : null,
            raisedBy: item?.error?.raisedBy,
            errorStatus: item?.error?.errorStatus,
            errorCaughtByRep: errorCaughtByRep,
            isErrorAccepted: null,
            isErrorRejected: false,
            comments: {
              author: item?.error?.raisedBy,
              fiscalYear: item?.fiscalYear,
              dateTime: Date.now(),
              content: item?.error?.comment
            },
            status: true,
            createdBy: user
          }
          await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { hasCorrection: false, hasError: true, correctionStatus: 'Completed' } })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the task details!" }) });
          await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, raisedBy: item.error.raisedBy, year: item['fiscalYear'], status: true },
            { $set: standaloneDatapoints }, { upsert: true })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the error details!" }) });
        } else {
          await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { hasCorrection: false, hasError: false, correctionStatus: 'Completed' } })
            .catch((error) => { return res.status(400).json({ status: "400", message: error?.message ? error?.message : "Failed to update the task details!" }) });
        }
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
    } else if (body.memberType == 'Board Matrix') {
      for (let index = 0; index < dpCodesDetails.length; index++) {
        let item = dpCodesDetails[index];

        if (item?.collectionYear) {
          item.additionalDetails.collectionYear = item?.collectionYear;
        }
        if (item.error.isThere == true) {
          if (item?.error?.refData == null || item?.error?.refData === '' || item?.error?.refData === "") {
            errorCaughtByRep == null
          } else {
            let formattedScreenShots = [];
            if (item?.error?.refData?.screenShot && item?.error?.refData?.screenShot?.length > 0) {
              for (let screenshotIndex = 0; screenshotIndex < item?.error?.refData?.screenShot?.length; screenshotIndex++) {
                let screenshotItem = item?.error?.refData?.screenShot[screenshotIndex];
                let screenShotFileType = screenshotItem?.base64 ? screenshotItem?.base64.split(';')[0].split('/')[1] : '';
                if (screenshotItem?.base64) {
                  let screenshotFileName = body?.companyId + '_' + body?.dpCodeId + '_' + item['fiscalYear'] + '_' + body?.memberName + '_' + screenshotIndex + '?.' + screenShotFileType;
                  await storeFileInS3(process?.env?.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem?.base64)
                    .catch((error) => { return res.status(400).json({ status: "400", message: error?.message ? error?.message : "Failed to store the screenshot!" }) });
                  formattedScreenShots.push(screenshotFileName);
                }
              }
            }
            errorCaughtByRep = {
              description: item?.error?.refData?.description,
              response: item?.error?.refData?.response,
              screenShot: formattedScreenShots,
              dataType: item?.error?.refData?.dataType,
              fiscalYear: item?.error?.refData?.fiscalYear,
              textSnippet: item?.error?.refData?.textSnippet,
              pageNo: item?.error?.refData?.pageNo,
              optionalAnalystComment: item?.error?.refData?.optionalAnalystComment,
              isRestated: item?.error?.refData?.isRestated,
              restatedForYear: item?.error?.refData?.restatedForYear,
              restatedInYear: item?.error?.refData?.restatedInYear,
              restatedValue: item?.error?.refData?.restatedValue,
              source: {
                publicationDate: item?.error?.refData?.source?.publicationDate,
                url: item?.error?.refData?.source?.url,
                sourceName: item?.error?.refData?.source?.sourceName
              },
              additionalDetails: item?.error?.refData?.additionalDetails
            }
          }
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
          let errorDp = {
            datapointId: body?.dpCodeId,
            companyId: body?.companyId,
            categoryId: body?.pillarId,
            year: item?.fiscalYear,
            taskId: body?.taskId,
            errorTypeId: errorTypeObject[0] ? errorTypeObject[0]?.id : null,
            raisedBy: item?.error?.raisedBy,
            errorStatus: item?.error?.errorStatus,
            errorCaughtByRep: errorCaughtByRep,
            isErrorRejected: false,
            isErrorAccepted: null,
            comments: {
              author: item?.error?.raisedBy,
              fiscalYear: item?.fiscalYear,
              dateTime: Date.now(),
              content: item?.error?.comment
            },
            status: true,
            createdBy: user
          }
          await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { hasCorrection: false, hasError: true, correctionStatus: 'Completed' } })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          await ErrorDetails.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, raisedBy: item.error.raisedBy, year: item['fiscalYear'], status: true },
            { $set: errorDp }, { upsert: true })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the error details!" }) });
        } else {
          await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { hasCorrection: false, hasError: false, correctionStatus: 'Completed' } })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
        }
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
    } else if (body.memberType == 'KMP Matrix') {
      for (let index = 0; index < dpCodesDetails.length; index++) {
        let item = dpCodesDetails[index];

        if (item?.collectionYear) {
          item.additionalDetails.collectionYear = item?.collectionYear;
        }
        if (item?.error?.isThere == true) {
          if (item?.error?.refData == null || item?.error?.refData === '' || item?.error?.refData === "") {
            errorCaughtByRep == null
          } else {
            let formattedScreenShots = [];
            if (item?.error?.refData?.screenShot && item?.error?.refData?.screenShot?.length > 0) {
              for (let screenshotIndex = 0; screenshotIndex < item?.error?.refData?.screenShot?.length; screenshotIndex++) {
                let screenshotItem = item?.error?.refData?.screenShot[screenshotIndex];
                let screenShotFileType = screenshotItem?.base64 ? screenshotItem?.base64.split(';')[0].split('/')[1] : '';
                if (screenshotItem?.base64) {
                  let screenshotFileName = body?.companyId + '_' + body?.dpCodeId + '_' + item['fiscalYear'] + '_' + body?.memberName + '_' + screenshotIndex + '?.' + screenShotFileType;
                  await storeFileInS3(process?.env?.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem?.base64)
                    .catch((error) => { return res.status(400).json({ status: "400", message: error?.message ? error?.message : "Failed to store the screenshot!" }) });
                  formattedScreenShots.push(screenshotFileName);
                }
              }
            }
            errorCaughtByRep = {
              description: item?.error?.refData?.description,
              response: item?.error?.refData?.response,
              screenShot: formattedScreenShots,
              dataType: item?.error?.refData?.dataType,
              fiscalYear: item?.error?.refData?.fiscalYear,
              textSnippet: item?.error?.refData?.textSnippet,
              pageNo: item?.error?.refData?.pageNo,
              optionalAnalystComment: item?.error?.refData?.optionalAnalystComment,
              isRestated: item?.error?.refData?.isRestated,
              restatedForYear: item?.error?.refData?.restatedForYear,
              restatedInYear: item?.error?.refData?.restatedInYear,
              restatedValue: item?.error?.refData?.restatedValue,
              source: {
                publicationDate: item?.error?.refData?.source?.publicationDate,
                url: item?.error?.refData?.source?.url,
                sourceName: item?.error?.refData?.source?.sourceName
              },
              additionalDetails: item?.error?.refData?.additionalDetails
            }
          }
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);
          let errorDp = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: item.fiscalYear,
            taskId: body.taskId,
            errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
            raisedBy: item.error.raisedBy,
            errorStatus: item.error.errorStatus,
            errorCaughtByRep: errorCaughtByRep,
            isErrorRejected: false,
            isErrorAccepted: null,
            comments: {
              author: item.error.raisedBy,
              fiscalYear: item.fiscalYear,
              dateTime: Date.now(),
              content: item.error.comment
            },
            status: true,
            createdBy: user
          }
          await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { hasCorrection: false, hasError: true, correctionStatus: 'Completed' } })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          await ErrorDetails.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, raisedBy: item.error.raisedBy, year: item['fiscalYear'], status: true },
            { $set: errorDp }, { upsert: true })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the error details!" }) });
        } else {
          await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: { "$regex": body.memberName, "$options": "i" }, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: { hasCorrection: false, hasError: false, correctionStatus: 'Completed' } })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
        }
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
    }
  } catch (error) {
    return res.status(400).json({ status: "400", message: "Failed to save the rep error details!" });
  }
}

export const uploadQAVerificationData = async (req, res, next) => {
  try {
    let convertedWorkbook = [];
    convertedWorkbook = XLSX.read(req.body.companiesFile.replace(/^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/, ""));
    if (convertedWorkbook?.SheetNames?.length > 0) {
      let worksheet = convertedWorkbook.Sheets[convertedWorkbook.SheetNames[0]];
      try {
        // Converting it excel into json.
        let sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: " " });
        if (sheetAsJson?.length > 0) {
          let errorObjectsToInsert = [], hasError = [], noError = [];
          let allErrorTypes = await Errors.find({ status: true }, { _id: 1, errorType: 1 });
          for (let index1 = 0; index1 < sheetAsJson.length; index1++) {
            const rowObject = sheetAsJson[index1];
            if (rowObject?.hasError != ' ' && rowObject?.errorType != ' ' && rowObject?.hasError != '' && rowObject?.errorType != '') {
              let errorTypeDetail = allErrorTypes.find((obj) => obj.errorType.toLowerCase() == rowObject.errorType.trim().toLowerCase());
              errorTypeDetail = errorTypeDetail?.id;
              if (errorTypeDetail && errorTypeDetail != null && errorTypeDetail != undefined) {
                let splitDpCodeWithDot = rowObject['dpCode'].split('.');
                //! Why 2, need clarification.
                if (splitDpCodeWithDot.length >= 2) {
                  return res.status(400).json({ status: "400", message: `Cannot raise error for child dp data ${rowObject['dpCode']}` });
                } else {
                  let errorObject = getErrorTypeObject(rowObject, errorTypeDetail, req);
                  errorObjectsToInsert.push(errorObject);
                }
              } else {
                return res.status(400).json({ status: "400", message: `Invalid errorType ${rowObject.errorType} at line number ${index1 + 1}, Please enter valid errorType` });
              }
              hasError.push(rowObject["_id"]);
            } else {
              noError.push(rowObject["_id"]);
            }
          }
          /*
          If any error, take the errorTypeId from errors master
          * Frame the object to make an insert in errorDetails collection
          * Push that object into an array errorDataToInsert
          * If entered error type is not matching break the loop and throw error
          * If any error take _id of standalone and push to hasError array
          * If no error take _id of standalone and push to noError array
           
          * Query Details.
          * Inserting errorDetails for particular Dp, further updating 
          * Once with error as hasError:true and hasCorrection:false
          * Once with no error as hasError:false and hasCorrection:false
          */
        
          await Promise.all([
            ErrorDetails.insertMany(errorObjectsToInsert),
            StandaloneDatapoints.updateMany({ _id: { $in: hasError } }, { $set: { "hasError": true, hasCorrection: false, correctionStatus: Completed } }),
            StandaloneDatapoints.updateMany({ _id: { $in: noError } }, { $set: { "hasError": false, hasCorrection: false, correctionStatus: Completed } })
          ]);
          return res.status(200).json({ status: "200", message: "Verification Data Imported Successfully!" });
        } else {
          return res.status(400).json({ status: "400", message: "No values present in the uploaded file, please check!" })
        }
      } catch (error) {
        return res.status(400).json({ message: error.message })
      }
    } else {
      return res.status(400).json({ status: "400", message: "Invalid excel file please check!" })
    }
  } catch (error) {
    if (error) {
      return res.status(403).json({
        message: error.message ? error.message : 'Failed to import!',
        status: 403
      });
    }
  }
}

function getErrorTypeObject(rowObject, errorTypeDetail, req) {
  return {
    "datapointId": rowObject["dpCodeId"],
    "companyId": rowObject["companyId"],
    "categoryId": rowObject["pillarId"],
    "year": rowObject["year"],
    "taskId": rowObject["taskId"],
    "errorTypeId": errorTypeDetail,
    "raisedBy": QA,
    "errorStatus": Completed,
    "errorCaughtByRep": {},
    "isErrorAccepted": null,
    "isErrorRejected": false,
    "comments": {
      "author": QA,
      "fiscalYear": rowObject["year"],
      "dateTime": new Date().getTime(),
      "content": rowObject["errorComments"] ? rowObject["errorComments"] : ''
    },
    "status": true,
    "createdBy": req.user
  };
}


// removed commented code from line 816

// if (splitDpCodeWithDot[0] != '' && splitDpCodeWithDot[1] != '') {
//   let errorObject = {
//     "datapointId": rowObject["dpCodeId"],
//     "companyId": rowObject["companyId"],
//     "categoryId": rowObject["pillarId"],
//     "year": rowObject["year"],
//     "taskId": rowObject["taskId"],
//     "errorTypeId": errorTypeDetail,
//     "raisedBy": "QA",
//     "errorStatus": "Completed",
//     "errorCaughtByRep": {},
//     "isErrorAccepted": null,
//     "isErrorRejected": false,
//     "comments": {
//       "author": "QA",
//       "fiscalYear": rowObject["year"],
//       "dateTime": new Date().getTime(),
//       "content": rowObject["errorComments"] ? rowObject["errorComments"] : ''
//     },
//     "status": true,
//     "createdBy": req.user
//   };
//   errorObjectsToInsert.push(errorObject);
// } else {
//   return res.status(400).json({ status: "400", message: `Cannot raise error for child dp data ${rowObject['dpCode']}` });
// }
// } else if (splitDpCodeWithDot.length >= 2) {