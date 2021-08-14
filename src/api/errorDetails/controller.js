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
  let errorTypeDetails = await Errors.find({
    status: true
  });
  if(body.memberType == 'Standalone'){
    await StandaloneDatapoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: {$in : currentYearValues }, status:true},{$set: {hasError: true}});
    let standaloneErrorDetails = dpCodesDetails.map(function (item) {
      let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type'].replace('\r\n', ''))
      if(item.error['raisedBy'] == 'QA'){
        return {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          categoryId: body.pillarId,
          year: item['fiscalYear'],
          taskId: body.taskId, 
          errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
          raisedBy: item.error['raisedBy'],
          errorStatus: item.error['errorStatus'],
          comments: {            
          author: item.error['raisedBy'],
          fiscalYear: item['fiscalYear'],
          dateTime: Date.now(),
          content: item.error['comment']
          },
          status: true,
          createdBy: user
        }
      } else{
        return {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          categoryId: body.pillarId,
          year: item['fiscalYear'],
          taskId: body.taskId, 
          errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
          raisedBy: item.error['raisedBy'],
          errorStatus: item.error['errorStatus'],
          comments: {             
            author: item.error['raisedBy'],
            fiscalYear: item['fiscalYear'],
            dateTime: Date.now(),
            content: item.error['comment']
          },
          errorCaughtByRep:{
          response: item.error.refData['response'],
          screenShot: item.error.refData['screenShot'],
          textSnippet: item.error.refData['textSnippet'],
          pageNumber: item.error.refData['pageNo'],
          publicationDate: item.error.refData.source['publicationDate'],
          url: item.error.refData.source['url'],
          sourceName: item.error.refData.source['sourceName']+";"+item.error.refData.source['value'],
          additionalDetails: item.error.refData['additionalDetails']
          },
          createdBy: user
        }

      }
    });
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
    
    await BoardMembersMatrixDataPoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: {$in : currentYearValues },memberName: body.memberName, status:true},{$set: {hasError: true}});
    let boardMemberErrorDetails = dpCodesDetails.map(function (item) {
      let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type'].replace('\r\n', ''))
      if(item.error['raisedBy'] == 'QA'){
        return {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          categoryId: body.pillarId,
          year: item['fiscalYear'],
          taskId: body.taskId, 
          memberName: body.memberName,
          errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
          raisedBy: item.error['raisedBy'],
          errorStatus: item.error['errorStatus'],
          comments: {            
            author: item.error['raisedBy'],
            fiscalYear: item['fiscalYear'],
            dateTime: Date.now(),
            content: item.error['comment']
          },
          status: true,
          createdBy: user
        }
      } else{
        return {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          categoryId: body.pillarId,
          year: item['fiscalYear'],
          taskId: body.taskId, 
          memberName: body.memberName,
          errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
          raisedBy: item.error['raisedBy'],
          errorStatus: item.error['errorStatus'],
          comments: {               
            author: item.error['raisedBy'],
            fiscalYear: item['fiscalYear'],
            dateTime: Date.now(),
            content: item.error['comment']
          },
          errorCaughtByRep:{
          response: item.error.refData['response'],
          screenShot: item.error.refData['screenShot'],
          textSnippet: item.error.refData['textSnippet'],
          pageNumber: item.error.refData['pageNo'],
          publicationDate: item.error.refData.source['publicationDate'],
          url: item.error.refData.source['url'],
          sourceName: item.error.refData.source['sourceName']+";"+item.error.refData.source['value'],
          additionalDetails: item.error.refData['additionalDetails']
          },
          createdBy: user
        }

      }
    });
    await ErrorDetails.updateMany({datapointId: body.dpCodeId, year: {$in : currentYearValues }, companyId: body.companyId, status: true},{$set:{status: false}})
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
    
    await KmpMatrixDataPoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: {$in : currentYearValues },memberName: body.memberName, status:true},{$set: {hasError: true}});
    let kmpMemberErrorDetails = dpCodesDetails.map(function (item) {
      let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item.error['type'].replace('\r\n', ''))
      if(item.error['raisedBy'] == 'QA'){
        return {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          categoryId: body.pillarId,
          year: item['fiscalYear'],
          taskId: body.taskId, 
          memberName: body.memberName,
          errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
          raisedBy: item.error['raisedBy'],
          errorStatus: item.error['errorStatus'],
          comments: {              
            author: item.error['raisedBy'],
            fiscalYear: item['fiscalYear'],
            dateTime: Date.now(),
            content: item.error['comment']
          },
          status: true,
          createdBy: user
        }
      } else{
        return {
          datapointId: body.dpCodeId,
          companyId: body.companyId,
          categoryId: body.pillarId,
          year: item['fiscalYear'],
          taskId: body.taskId, 
          memberName: body.memberName,
          errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
          raisedBy: item.error['raisedBy'],
          errorStatus: item.error['errorStatus'],
          comments: {               
            author: item.error['raisedBy'],
            fiscalYear: item['fiscalYear'],
            dateTime: Date.now(),
            content: item.error['comment']
          },
          errorCaughtByRep:{
          response: item.error.refData['response'],
          screenShot: item.error.refData['screenShot'],
          textSnippet: item.error.refData['textSnippet'],
          pageNumber: item.error.refData['pageNo'],
          publicationDate: item.error.refData.source['publicationDate'],
          url: item.error.refData.source['url'],
          sourceName: item.error.refData.source['sourceName']+";"+item.error.refData.source['value'],
          additionalDetails: item.error.refData['additionalDetails']
          },
          createdBy: user
        }

      }
    });
    await ErrorDetails.updateMany({datapointId: body.dpCodeId, year: {$in : currentYearValues }, companyId: body.companyId, status: true},{$set:{status: false}})
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
