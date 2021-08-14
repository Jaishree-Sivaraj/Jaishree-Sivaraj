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
  let errorDpCodeDetails = dpCodesDetails.filter(obj => obj.error.isThere == true);
  let currentYearValues = [...new Set( dpCodesDetails.map(obj => obj.fiscalYear)) ];    
  let historicalDataYear = [...new Set( dpHistoricalDpDetails.map(obj => obj.fiscalYear)) ];  
  let errorTypeDetails = await Errors.find({
    status: true
  });
  let comments = [];
  if(body.memberType == 'Standalone'){
    let standaloneErrorDetails = [];
    for (let errorIndex = 0; errorIndex < currentYearValues.length; errorIndex++) {
      let standaloneDatapoints = {}
      _.filter(dpCodesDetails, async (object,index)=>{
        if(object.fiscalYear == currentYearValues[errorIndex] && object.error.isThere == true){
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type'].replace('\r\n', ''));
          let commentValues = {            
            author : object.error['raisedBy'],
            fiscalYear: object['fiscalYear'],
            dateTime: Date.now(),
            content: object.error['comment']
            }
          comments.push(commentValues);
          await StandaloneDatapoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: object.fiscalYear, status:true},{$push :{comments: commentValues},$set: {hasError: true}});          
          await ErrorDetails.updateMany({datapointId: body.dpCodeId,  year: object.fiscalYear, companyId: body.companyId, raisedBy: object.error.raisedBy, status: true},{$set:{status: false}})
          standaloneDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            taskId: body.taskId, 
            errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            errorCaughtByRep: {
            response: object.error.refData.response,
            screenShot: object.error.refData.screenShot,
            textSnippet: object.error.refData.textSnippet,
            pageNumber: object.error.refData.pageNo,
            publicationDate: object.error.refData.source.publicationDate,
            url: object.error.refData.source.url,
            sourceName: object.error.refData.source.sourceName+";"+object.error.refData.source.value,
            additionalDetails: object.error.refData.additionalDetails
            },
            comments: {            
            author: object.error.raisedBy,
            fiscalYear: object.fiscalYear,
            dateTime: Date.now(),
            content: object.error.comment
            },
            status: true,
            createdBy: user
          }
          standaloneErrorDetails.push(standaloneDatapoints);
        } else if(object.fiscalYear == currentYearValues[errorIndex] && object.error.isThere == false){
          standaloneDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            taskId: body.taskId, 
            errorTypeId: null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            status: true,
            createdBy: user
          }
          standaloneErrorDetails.push(standaloneDatapoints);
        }
      })
      
    }
    await ErrorDetails.updateMany({datapointId: body.dpCodeId, year: {$in : currentYearValues }, companyId: body.companyId, status: true},{$set:{status: false}})
    await ErrorDetails.insertMany(standaloneErrorDetails)
    .then((result, err ) => {
      if (err) {
        res.status(500).json({
          message: err.message
        });
      } else {
        res.status(200).json({
          message: "Error Data inserted Successfully"
        });
      }
    });
  } else if(body.memberType == 'Board Matrix'){
    let boardMemberErrorDetails = [];
    for (let errorIndex = 0; errorIndex < currentYearValues.length; errorIndex++) {
      let boardDatapoints = {}
      _.filter(dpCodesDetails, async (object,index)=>{
        if(object.fiscalYear == currentYearValues[errorIndex] && object.error.isThere == true){
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type'].replace('\r\n', ''));
          let commentValues = {            
            author : object.error['raisedBy'],
            fiscalYear: object['fiscalYear'],
            dateTime: Date.now(),
            content: object.error['comment']
            }
          comments.push(commentValues);
          await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: object.fiscalYear,memberName: body.memberName, status:true},{$push :{comments: commentValues},$set: {hasError: true}});
          await ErrorDetails.updateMany({datapointId: body.dpCodeId,  year: object.fiscalYear,memberName: body.memberName, companyId: body.companyId, raisedBy: object.error.raisedBy, status: true},{$set:{status: false}})
   
          boardDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            taskId: body.taskId, 
            memberName: body.memberName,
            errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            errorCaughtByRep: {
            response: object.error.refData.response,
            screenShot: object.error.refData.screenShot,
            textSnippet: object.error.refData.textSnippet,
            pageNumber: object.error.refData.pageNo,
            publicationDate: object.error.refData.source.publicationDate,
            url: object.error.refData.source.url,
            sourceName: object.error.refData.source.sourceName+";"+object.error.refData.source.value,
            additionalDetails: object.error.refData.additionalDetails
            },
            comments: {            
            author: object.error.raisedBy,
            fiscalYear: object.fiscalYear,
            dateTime: Date.now(),
            content: object.error.comment
            },
            status: true,
            createdBy: user
          }
          boardMemberErrorDetails.push(boardDatapoints);
        } else if(object.fiscalYear == currentYearValues[errorIndex] && object.error.isThere == false){
          boardDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            memberName: body.memberName,
            taskId: body.taskId, 
            errorTypeId: null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            status: true,
            createdBy: user
          }
          boardMemberErrorDetails.push(boardDatapoints);
        }
      })
      
    }
     await ErrorDetails.insertMany(boardMemberErrorDetails)
    .then((result, err ) => {
      if (err) {
        res.status(500).json({
          message: err.message
        });
      } else {
        res.status(200).json({
          message: "Error Data inserted Successfully"
        });
      }
    });
  } else if(body.memberType == 'KMP Matrix'){
    let kmpMemberErrorDetails = [];
    for (let errorIndex = 0; errorIndex < currentYearValues.length; errorIndex++) {
      let boardDatapoints = {}
      _.filter(dpCodesDetails, async (object,index)=>{
        if(object.fiscalYear == currentYearValues[errorIndex] && object.error.isThere == true){
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type'].replace('\r\n', ''));
          let commentValues = {            
            author : object.error['raisedBy'],
            fiscalYear: object['fiscalYear'],
            dateTime: Date.now(),
            content: object.error['comment']
            }
          comments.push(commentValues);
          await KmpMatrixDataPoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: object.fiscalYear,memberName: body.memberName, status:true},{$push :{comments: commentValues},$set: {hasError: true}});          
          await ErrorDetails.updateMany({datapointId: body.dpCodeId,  year: object.fiscalYear,memberName: body.memberName, companyId: body.companyId, raisedBy: object.error.raisedBy, status: true},{$set:{status: false}})
          boardDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            taskId: body.taskId, 
            memberName: body.memberName,
            errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            errorCaughtByRep: {
            response: object.error.refData.response,
            screenShot: object.error.refData.screenShot,
            textSnippet: object.error.refData.textSnippet,
            pageNumber: object.error.refData.pageNo,
            publicationDate: object.error.refData.source.publicationDate,
            url: object.error.refData.source.url,
            sourceName: object.error.refData.source.sourceName+";"+object.error.refData.source.value,
            additionalDetails: object.error.refData.additionalDetails
            },
            comments: {            
            author: object.error.raisedBy,
            fiscalYear: object.fiscalYear,
            dateTime: Date.now(),
            content: object.error.comment
            },
            status: true,
            createdBy: user
          }
          kmpMemberErrorDetails.push(boardDatapoints);
        } else if(object.fiscalYear == currentYearValues[errorIndex] && object.error.isThere == false){
          boardDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            memberName: body.memberName,
            taskId: body.taskId, 
            errorTypeId: null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            status: true,
            createdBy: user
          }
          kmpMemberErrorDetails.push(boardDatapoints);
        }
      })
      
    }
    await ErrorDetails.insertMany(kmpMemberErrorDetails)
    .then((result, err ) => {
      if (err) {
        res.status(500).json({
          message: err.message
        });
      } else {
        res.status(200).json({
          message: "Error Data inserted Successfully"
        });
      }
    });
  }
}
