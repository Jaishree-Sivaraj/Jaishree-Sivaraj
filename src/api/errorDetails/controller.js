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
import { StandaloneDatapoints } from '../standalone_datapoints'

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
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            status: true,
            hasError: true,
            hasCorrection: false,
            correctionStatus: 'Completed',
            createdBy: user
          }
          await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: obj });
          await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: standaloneDatapoints }, { upsert: true });
        } else{
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            status: true,
            hasError: false,
            hasCorrection: false,
            correctionStatus: 'Completed',
            createdBy: user
          }
          await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: obj });
        }
    }
    for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
      let item = dpHistoricalDpDetails[index];
      let obj = {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        taskId: body.taskId,
        year: item['fiscalYear'],
        response: item['response'],
        screenShot: item['screenShot'],
        textSnippet: item['textSnippet'],
        pageNumber: item['pageNo'],
        publicationDate: item.source['publicationDate'],
        url: item.source['url'],
        sourceName: item.source['sourceName'] + ";" + item.source['value'],
        additionalDetails: item['additionalDetails'],
        status: true,
        createdBy: user
      }
      await StandaloneDatapoints.updateOne({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
      { $set: obj }, { upsert: true });
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
        let obj = {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          taskId: body.taskId,
          year: item['fiscalYear'],
          response: item['response'],
          screenShot: item['screenShot'],
          textSnippet: item['textSnippet'],
          pageNumber: item['pageNo'],
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          memberStatus: true,
          status: true,
          hasCorrection: false,
          hasError: true,
          correctionStatus: 'Completed',
          createdBy: user
        }
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: obj});
        await ErrorDetails.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        let obj = {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          taskId: body.taskId,
          year: item['fiscalYear'],
          response: item['response'],
          screenShot: item['screenShot'],
          textSnippet: item['textSnippet'],
          pageNumber: item['pageNo'],
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          memberStatus: true,
          status: true,
          hasCorrection: false,
          hasError: false,
          correctionStatus: 'Completed',
          createdBy: user
        }
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: obj});
      }    
    }
    for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
      let item = dpHistoricalDpDetails[index];
      let obj = {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        taskId: body.taskId,
        year: item['fiscalYear'],
        response: item['response'],
        screenShot: item['screenShot'],
        textSnippet: item['textSnippet'],
        pageNumber: item['pageNo'],
        publicationDate: item.source['publicationDate'],
        url: item.source['url'],
        sourceName: item.source['sourceName'] + ";" + item.source['value'],
        additionalDetails: item['additionalDetails'],
        memberName: body.memberName,
        memberStatus: true,
        status: true,
        createdBy: user
      }
     // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
        await BoardMembersMatrixDataPoints.updateOne({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: obj }, { upsert: true });
      //}
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
        let obj = {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          taskId: body.taskId,
          year: item['fiscalYear'],
          response: item['response'],
          screenShot: item['screenShot'],
          textSnippet: item['textSnippet'],
          pageNumber: item['pageNo'],
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          memberStatus: true,
          hasCorrection: false, 
          hasError: true , 
          correctionStatus: 'Completed',
          status: true,
          createdBy: user
        }
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: obj});
        await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        let obj = {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          taskId: body.taskId,
          year: item['fiscalYear'],
          response: item['response'],
          screenShot: item['screenShot'],
          textSnippet: item['textSnippet'],
          pageNumber: item['pageNo'],
          publicationDate: item.source['publicationDate'],
          url: item.source['url'],
          sourceName: item.source['sourceName'] + ";" + item.source['value'],
          additionalDetails: item['additionalDetails'],
          memberName: body.memberName,
          memberStatus: true,
          hasCorrection: false, 
          hasError: false, 
          correctionStatus: 'Completed',
          status: true,
          createdBy: user
        }
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: obj});
      }
    }
    for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
      let item = dpHistoricalDpDetails[index];
      let obj = {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        taskId: body.taskId,
        year: item['fiscalYear'],
        response: item['response'],
        screenShot: item['screenShot'],
        textSnippet: item['textSnippet'],
        pageNumber: item['pageNo'],
        publicationDate: item.source['publicationDate'],
        url: item.source['url'],
        sourceName: item.source['sourceName'] + ";" + item.source['value'],
        additionalDetails: item['additionalDetails'],
        memberName: body.memberName,
        memberStatus: true,
        status: true,
        createdBy: user
      }
      await KmpMatrixDataPoints.updateOne({ companyId: body.companyId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: obj }, { upsert: true });
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
            errorCaughtByRep = {
              description: item.error.refData.description,
              response: item.error.refData.response,
              screenShot: item.error.refData.screenShot,
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
            await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
            { $set: {hasCorrection: false, hasError: true, correctionStatus: 'Completed'} });
            await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
            { $set: standaloneDatapoints }, { upsert: true });
          } else{
            await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
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
          errorCaughtByRep = {
            description: item.error.refData.description,
            response: item.error.refData.response,
            screenShot: item.error.refData.screenShot,
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
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: {hasCorrection: false, hasError: true, correctionStatus: 'Completed'}});
        await ErrorDetails.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
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
          errorCaughtByRep = {
            description: item.error.refData.description,
            response: item.error.refData.response,
            screenShot: item.error.refData.screenShot,
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
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: {hasCorrection: false, hasError: true , correctionStatus: 'Completed'}});
        await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: {hasCorrection: false, hasError: false, correctionStatus: 'Completed'}});
      }
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  }
}
