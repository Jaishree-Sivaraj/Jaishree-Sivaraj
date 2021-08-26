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
          await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: {hasCorrection: false, hasError: true} });
          await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: standaloneDatapoints }, { upsert: true });
        } else{
          await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: {hasCorrection: false, hasError: false} });
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
     // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
        await StandaloneDatapoints.updateOne({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: obj }, { upsert: true });
      //}
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  } else if(body.memberType == 'Board Matrix'){
    for (let index = 0; index < dpCodesDetails.length; index++) {
      let item = dpCodesDetails[index];
      if(item.error.isThere == true){
        let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type']);  
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
        { $set: {hasCorrection: false, hasError: true} });
        await ErrorDetails.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: {hasCorrection: false, hasError: false} });
      }    
     // for (let index1 = 0; 1 < currentYearValues.length; index1++) {
        //store in s3 bucket with filename
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
        let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type']);  
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
        { $set: {hasCorrection: false, hasError: true }});
        await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: errorDp }, { upsert: true });
      } else{
        await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
        { $set: {hasCorrection: false, hasError: false }});
      }
      
     // for (let index1 = 0; 1 < currentYearValues.length; index1++) {
        //store in s3 bucket with filename
        
        
      //}
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
        await KmpMatrixDataPoints.updateOne({ companyId: body.companyId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
          { $set: obj }, { upsert: true });
      //}
    }
    res.status('200').json({
      message: "Data inserted Successfully"
    });
  }
}

export const saveRepErrorDetails = async({
  user,
  bodymen: {
    body
  },
  params
}, res, next) =>{
  
  let dpCodesDetails = body.currentData;
  let errorDpcodes = dpCodesDetails.filter(obj => obj.error.isThere == true);
  let errorYearValues = [...new Set( errorDpcodes.map(obj => obj.fiscalYear)) ]; 
  let currentYearValues = [...new Set( dpCodesDetails.map(obj => obj.fiscalYear)) ];  
  let errorTypeDetails = await Errors.find({
    status: true
  });
  let errorCaughtByRep = {}, dpCodeDetails = [];
  if(body.memberType == 'Standalone'){
    let standaloneErrorDetails = [];
    //for (let errorIndex = 0; errorIndex < dpCodesDetails.length; errorIndex++) {
      let standaloneDatapoints = {}
      _.filter(dpCodesDetails, (object,index)=>{
        if(object.error.isThere == true){
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type']);     
            if(object.error.refData === '' || object.error.refData === ""){
              errorCaughtByRep == null
            } else {
            errorCaughtByRep = {
              description: object.error.refData.description,
              response: object.error.refData.response,
              screenShot: object.error.refData.screenShot,
              dataType: object.error.refData.dataType,
              fiscalYear: object.error.refData.fiscalYear,
              textSnippet: object.error.refData.textSnippet,
              pageNo: object.error.refData.pageNo,
              source:{
                publicationDate: object.error.refData.source.publicationDate,
                url: object.error.refData.source.url,
                sourceName: object.error.refData.source.sourceName
              },
              additionalDetails: object.error.refData.additionalDetails
            }
            }
            standaloneDatapoints = {
              datapointId: body.dpCodeId,
              companyId: body.companyId,
              categoryId: body.pillarId,
              year: object.fiscalYear,
              taskId: body.taskId, 
              errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
              raisedBy: object.error.raisedBy,
              errorStatus: object.error.errorStatus,
              errorCaughtByRep: errorCaughtByRep,
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
        } else if( object.error.isThere == false){
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

    await StandaloneDatapoints.updateMany({taskId: body.taskId, datapointId: body.dpCodeId, year: {$in: errorYearValues }, status:true},{$set: {hasError: true, hasCorrection:false, correctionStatus: 'Completed'}});   
    await ErrorDetails.updateMany({datapointId: body.dpCodeId,  year: {$in: currentYearValues }, companyId: body.companyId, status: true},{$set:{status: false}});
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
    //for (let errorIndex = 0; errorIndex < dpCodesDetails.length; errorIndex++) {
      let boardDatapoints = {}
      _.filter(dpCodesDetails, (object,index)=>{
        if(object.error.isThere == true){
          if(object.error.refData == null || object.error.refData === '' || object.error.refData === ""){
            errorCaughtByRep == null
          } else {
            errorCaughtByRep = {
              description: object.error.refData.description,
              response: object.error.refData.response,
              screenShot: object.error.refData.screenShot,
              dataType: object.error.refData.dataType,
              fiscalYear: object.error.refData.fiscalYear,
              textSnippet: object.error.refData.textSnippet,
              pageNo: object.error.refData.pageNo,
              source:{
                publicationDate: object.error.refData.source.publicationDate,
                url: object.error.refData.source.url,
                sourceName: object.error.refData.source.sourceName
              },
              additionalDetails: object.error.refData.additionalDetails
            }
          }
          let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == object.error['type']);
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
            errorCaughtByRep: errorCaughtByRep,
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
        } else if( object.error.isThere == false){
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
    await ErrorDetails.updateMany({datapointId: body.dpCodeId, year : {$in : currentYearValues},memberName: body.memberName, companyId: body.companyId, status: true},{$set:{status: false}})
    await BoardMembersMatrixDataPoints.updateMany({companyId: body.companyId, datapointId: body.dpCodeId, year : {$in : errorYearValues},memberName: body.memberName, status: true},{$set:{hasError: true, hasCorrection:false, correctionStatus: 'Completed'}});
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
      let boardDatapoints = {}
      _.filter(dpCodesDetails, (object,index)=>{
        if(object.error.isThere == true){
          if(object.error.refData == null || object.error.refData === '' || object.error.refData === ""){
            errorCaughtByRep == null
          } else {
            errorCaughtByRep = {
              description: object.error.refData.description,
              response: object.error.refData.response,
              screenShot: object.error.refData.screenShot,
              dataType: object.error.refData.dataType,
              fiscalYear: object.error.refData.fiscalYear,
              textSnippet: object.error.refData.textSnippet,
              pageNo: object.error.refData.pageNo,
              source:{
                publicationDate: object.error.refData.source.publicationDate,
                url: object.error.refData.source.url,
                sourceName: object.error.refData.source.sourceName
              },
              additionalDetails: object.error.refData.additionalDetails
            }
          }         
          boardDatapoints = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            categoryId: body.pillarId,
            year: object.fiscalYear,
            taskId: body.taskId, 
            memberName: body.memberName,
            errorTypeId: null,
            raisedBy: object.error.raisedBy,
            errorStatus: object.error.errorStatus,
            errorCaughtByRep: errorCaughtByRep,            
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
        } else if(object.error.isThere == false){
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
      
    await ErrorDetails.updateMany({datapointId: body.dpCodeId, year : {$in : currentYearValues},memberName: body.memberName, companyId: body.companyId, status: true},{$set:{status: false}})    
    await KmpMatrixDataPoints.updateMany({companyId:body.companyId, datapointId: body.dpCodeId, year : {$in : errorYearValues},memberName: body.memberName, status:true},{$set:{hasError: true, hasCorrection:false, correctionStatus: 'Completed'}});
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
