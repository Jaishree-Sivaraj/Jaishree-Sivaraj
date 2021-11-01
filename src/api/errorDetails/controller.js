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
import _ from 'lodash'
import { TaskAssignment } from '../taskAssignment'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { storeFileInS3 } from "../../services/utils/aws-s3"

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

export const saveErrorDetails = async({
  user,
  bodymen: {
    body
  },
  params
}, res, next) =>{
  
  let dpCodesDetails = body.currentData;
  let dpHistoricalDpDetails = body.historicalData;
  let currentYearValues = [...new Set( dpCodesDetails.map(obj => obj.fiscalYear)) ];    
  let historicalDataYear = [...new Set( dpHistoricalDpDetails.map(obj => obj.fiscalYear)) ];  
  let yearValue = _.concat(currentYearValues,historicalDataYear)
  let errorTypeDetails = await Errors.find({
    status: true
  });
  let errorCaughtByRep = {}, dpCodeDetails = [];
  let dpStatus = "";
  let taskDetails = await TaskAssignment.findOne({_id: body.taskId});
  if(taskDetails.taskStatus == 'Collection Completed')
  {
    dpStatus = "Collection";
  } else{
    dpStatus = "Correction";
  }
  if(body.memberType == 'Standalone'){
    for (let index = 0; index < dpCodesDetails.length; index++) {
      let item = dpCodesDetails[index];
        //store in s3 bucket with filename       
        if(item.error.isThere == true){
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);  
          let standaloneDatapoints = {
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
            createdBy: user
          }
          await StandaloneDatapoints.updateMany({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },{$set: { hasError: true, hasCorrection: false, correctionStatus: 'Completed'}});
          await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: standaloneDatapoints }, { upsert: true });
        } else {         
          await StandaloneDatapoints.updateMany({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },{$set: {isActive:false}});
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await StandaloneDatapoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            isActive: true,
            dpStatus: dpStatus,
            status: true,
            hasError: false,
            hasCorrection: false,
            correctionStatus: 'Completed',
            createdBy: user
          });
        }
    }
    for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
      let item = dpHistoricalDpDetails[index];
      await StandaloneDatapoints.updateOne({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
      { $set:{isActive: false}});
      await StandaloneDatapoints.create({
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        taskId: item.taskId,
        year: item['fiscalYear'],
        response: item['response'],
        screenShot: item['screenShot'],
        textSnippet: item['textSnippet'],
        pageNumber: item['pageNo'],
        publicationDate: item.source['publicationDate'],
        url: item.source['url'],
        sourceName: item.source['sourceName'] + ";" + item.source['value'],
        additionalDetails: item['additionalDetails'],
        correctionStatus: 'Completed',
        isActive: true,
        status: true,
        createdBy: user
      })
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  } else if(body.memberType == 'Board Matrix'){
    for (let index = 0; index < dpCodesDetails.length; index++) {
      let item = dpCodesDetails[index];
      if(item.error.isThere == true){
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
        await BoardMembersMatrixDataPoints.updateMany({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
        { $set: {hasError: true ,hasCorrection: false,correctionStatus: 'Completed'}});
        await ErrorDetails.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await BoardMembersMatrixDataPoints.updateMany({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
        { $set: {isActive: false}});
        let formattedScreenShots = [];
        if (item['screenShot'] && item['screenShot'].length > 0) {
          for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
            let screenshotItem = item['screenShot'][screenshotIndex];
            let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
            let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '.' + screenShotFileType;
            await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
            formattedScreenShots.push(screenshotFileName);
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
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          memberStatus: true,
          isActive: true,
          status: true,          
          dpStatus: dpStatus,
          hasCorrection: false,
          hasError: false,
          correctionStatus: 'Completed',
          createdBy: user
        }).catch(error =>{
          res.status('500').json({
            message: error.message
          });
        })
      }
    }
    for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
      let item = dpHistoricalDpDetails[index];
      await BoardMembersMatrixDataPoints.updateOne({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true,status: true },
        { $set: {isActive: false} });
      let formattedScreenShots = [];
      if (item['screenShot'] && item['screenShot'].length > 0) {
        for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
          let screenshotItem = item['screenShot'][screenshotIndex];
          let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
          let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '.' + screenShotFileType;
          await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
          formattedScreenShots.push(screenshotFileName);
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
        publicationDate: item.source['publicationDate'],
        url: item.source['url'],
        sourceName: item.source['sourceName'] + ";" + item.source['value'],
        additionalDetails: item['additionalDetails'],
        memberName: body.memberName,
        correctionStatus: 'Completed',
        memberStatus: true,
        isActive: true,
        status: true,
        createdBy: user
      })      
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  } else if(body.memberType == 'KMP Matrix'){
    for (let index = 0; index < dpCodesDetails.length; index++) {
      let item = dpCodesDetails[index];
      if(item.error.isThere == true){
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
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive:true, status: true },
        { $set: {hasError: true ,hasCorrection: false, correctionStatus: 'Completed'}});
        await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive:true, status: true },
        { $set: {isActive: false}});
        let formattedScreenShots = [];
        if (item['screenShot'] && item['screenShot'].length > 0) {
          for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
            let screenshotItem = item['screenShot'][screenshotIndex];
            let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
            let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '.' + screenShotFileType;
            await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
            formattedScreenShots.push(screenshotFileName);
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
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          memberStatus: true,
          hasCorrection: false, 
          dpStatus: dpStatus,
          hasError: false , 
          correctionStatus: 'Completed',
          status: true,
          isActive:true,
          createdBy: user
        }).catch(error =>{
          res.status('500').json({
            message: error.message
          });
        })
      }
    }
    for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
      let item = dpHistoricalDpDetails[index];
      await KmpMatrixDataPoints.updateOne({ companyId: body.companyId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: {isActive: false}});
        let formattedScreenShots = [];
        if (item['screenShot'] && item['screenShot'].length > 0) {
          for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
            let screenshotItem = item['screenShot'][screenshotIndex];
            let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
            let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '.' + screenShotFileType;
            await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
            formattedScreenShots.push(screenshotFileName);
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
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          correctionStatus: 'Completed',
          isActive: true,
          memberStatus: true,
          status: true,
          createdBy: user
        })
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  }
}

export const saveRepErrorDetails = async({ user, bodymen: { body }, params}, res, next) =>{  
  let dpCodesDetails = body.currentData;
  let errorTypeDetails = await Errors.find({
    status: true
  });
  let errorCaughtByRep = {};
  if(body.memberType == 'Standalone'){      
      for (let index = 0; index < dpCodesDetails.length; index++) {
        let item = dpCodesDetails[index];
          //store in s3 bucket with filename       
          if(item.error.isThere == true){
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type']);  
            if(item.error.refData === '' || item.error.refData === ""){
              errorCaughtByRep == null
            } else {
              let formattedScreenShots = [];
              if (item.error.refData.screenShot && item.error.refData.screenShot.length > 0) {
                for (let screenshotIndex = 0; screenshotIndex < item.error.refData.screenShot.length; screenshotIndex++) {
                  let screenshotItem = item.error.refData.screenShot[screenshotIndex];
                  let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
                  let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '.' + screenShotFileType;
                  await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
                  formattedScreenShots.push(screenshotFileName);
                }
              }
              errorCaughtByRep = {
                description: item.error.refData.description,
                response: item.error.refData.response,
                screenShot: formattedScreenShots,
                dataType: item.error.refData.dataType,
                fiscalYear: item.fiscalYear,
                textSnippet: item.error.refData.textSnippet,
                pageNo: item.error.refData.pageNo,
                source:{
                  publicationDate: item.error.refData.source.publicationDate,
                  url: item.error.refData.source.url,
                  sourceName: item.error.refData.source.sourceName
                },
                additionalDetails: item.error.refData.additionalDetails
              }
            }
            let standaloneDatapoints = {
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
              createdBy: user
            } 
            await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: {hasCorrection: false, hasError: true, correctionStatus: 'Completed'} });
            await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, raisedBy: item.error.raisedBy, year: item['fiscalYear'], status: true },
            { $set: standaloneDatapoints }, { upsert: true });
          } else{
            await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
            { $set: {hasCorrection: false, hasError: false, correctionStatus: 'Completed'} });
          }
      }
      res.status('200').json({
        message: "Data inserted Successfully"
      });
  } else if(body.memberType == 'Board Matrix'){      
    for (let index = 0; index < dpCodesDetails.length; index++) {
      let item = dpCodesDetails[index];
      if(item.error.isThere == true){
        if(item.error.refData == null || item.error.refData === '' || item.error.refData === ""){
          errorCaughtByRep == null
        } else {
          let formattedScreenShots = [];
          if (item.error.refData.screenShot && item.error.refData.screenShot.length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item.error.refData.screenShot.length; screenshotIndex++) {
              let screenshotItem = item.error.refData.screenShot[screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
              formattedScreenShots.push(screenshotFileName);
            }
          }
          errorCaughtByRep = {
            description: item.error.refData.description,
            response: item.error.refData.response,
            screenShot: formattedScreenShots,
            dataType: item.error.refData.dataType,
            fiscalYear: item.error.refData.fiscalYear,
            textSnippet: item.error.refData.textSnippet,
            pageNo: item.error.refData.pageNo,
            source:{
              publicationDate: item.error.refData.source.publicationDate,
              url: item.error.refData.source.url,
              sourceName: item.error.refData.source.sourceName
            },
            additionalDetails: item.error.refData.additionalDetails
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
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
        { $set: {hasCorrection: false, hasError: true, correctionStatus: 'Completed'}});
        await ErrorDetails.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, raisedBy: item.error.raisedBy, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
        { $set: {hasCorrection: false, hasError: false, correctionStatus: 'Completed'}});
      }    
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  } else if(body.memberType == 'KMP Matrix'){     
    for (let index = 0; index < dpCodesDetails.length; index++) {
      let item = dpCodesDetails[index];
      if(item.error.isThere == true){
        if(item.error.refData == null || item.error.refData === '' || item.error.refData === ""){
          errorCaughtByRep == null
        } else {
          let formattedScreenShots = [];
          if (item.error.refData.screenShot && item.error.refData.screenShot.length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item.error.refData.screenShot.length; screenshotIndex++) {
              let screenshotItem = item.error.refData.screenShot[screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64);
              formattedScreenShots.push(screenshotFileName);
            }
          }
          errorCaughtByRep = {
            description: item.error.refData.description,
            response: item.error.refData.response,
            screenShot: formattedScreenShots,
            dataType: item.error.refData.dataType,
            fiscalYear: item.error.refData.fiscalYear,
            textSnippet: item.error.refData.textSnippet,
            pageNo: item.error.refData.pageNo,
            source:{
              publicationDate: item.error.refData.source.publicationDate,
              url: item.error.refData.source.url,
              sourceName: item.error.refData.source.sourceName
            },
            additionalDetails: item.error.refData.additionalDetails
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
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
        { $set: {hasCorrection: false, hasError: true , correctionStatus: 'Completed'}});
        await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId,raisedBy: item.error.raisedBy, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
        { $set: {hasCorrection: false, hasError: false, correctionStatus: 'Completed'}});
      }
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  }
}
