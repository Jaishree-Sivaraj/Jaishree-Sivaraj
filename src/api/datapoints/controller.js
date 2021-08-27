import _ from 'lodash'
import XLSX from 'xlsx'
import * as fs from 'fs'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Datapoints } from '.'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { ClientTaxonomy } from '../clientTaxonomy'
import { Categories } from '../categories'
import { Themes } from '../themes'
import { KeyIssues } from '../key_issues'
import { Functions } from '../functions'
import { TaskAssignment } from '../taskAssignment'
import { Taxonomies } from '../taxonomies'
import { ErrorDetails } from '../errorDetails'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp'
import { CompanySources } from '../companySources'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Datapoints.create({ ...body, updatedBy: user })
  .then((datapoints) => datapoints.view(true))
  .then(success(res, 201))
  .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Datapoints.count(query)
  .then(count => Datapoints.find(query, select, cursor)
    .populate('updatedBy')
    .populate('categoryId')
    .populate('keyIssueId')
    .populate('functionId')
    .then((datapoints) => ({
      count,
      rows: datapoints.map((datapoints) => datapoints.view())
    }))
  )
  .then(success(res))
  .catch(next)

export const show = ({ params }, res, next) =>
  Datapoints.findById(params.id)
  .populate('updatedBy')
  .populate('categoryId')
  .populate('keyIssueId')
  .populate('functionId')
  .then(notFound(res))
  .then((datapoints) => datapoints ? datapoints.view() : null)
  .then(success(res))
  .catch(next)

export const includePolarityFromJson = async (req, res, next) => {
  fs.readFile(__dirname + '/datapoints-master-values.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    let allDatapoints = await Datapoints.find({});
    for (let index = 0; index < allDatapoints.length; index++) {
      const element = allDatapoints[index];
      console.log(element.code);
      let foundObject = datapointsList.find(obj => obj.code == element.code);
      console.log('foundObject', foundObject);
      await Datapoints.updateOne({
        _id: element.id
      }, {
        $set: {
          polarity: foundObject.polarity ? foundObject.polarity : ''
        }
      });
      if (index == allDatapoints.length - 1) {
        return res.status(200).json({
          message: "Polarity value added!"
        });
      }
    }
  })
}

export const includeCategoryIdsFromJson = async (req, res, next) => {
  fs.readFile(__dirname + '/dpcodes-categoryIds.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    let allDatapoints = await Datapoints.find({});
    for (let index = 0; index < allDatapoints.length; index++) {
      const element = allDatapoints[index];
      console.log(element.code);
      let foundObject = datapointsList.find(obj => obj.code == element.code);
      console.log('foundObject', foundObject);
      await Datapoints.updateOne({
        _id: element.id
      }, {
        $set: {
          categoryId: foundObject.categoryId ? foundObject.categoryId : null
        }
      });
      if (index == allDatapoints.length - 1) {
        return res.status(200).json({
          message: "CategoryId value added!"
        });
      }
    }
  })
}

export const includeExtraKeysFromJson = async (req, res, next) => {
  var clientTaxonomyId = req.params.clientTaxonomyId;
  fs.readFile(__dirname + '/dpType.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    console.log('datapointsList', datapointsList.length)
    for (let index = 0; index < datapointsList.length; index++) {
      var obj = {
        "isPriority": datapointsList[index].isPriority
      }
      console.log('obj', obj, index + 1);
      await Datapoints.updateOne({
        _id: datapointsList[index]._id
      }, {
        $set: obj
      });
    }
    res.status(200).json({
      message: "extra cloums added"
    });
  })
}

export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    let taskDetails = await TaskAssignment.findOne({
      _id: req.params.taskId
    }).populate('companyId').populate('categoryId');
    console.log(taskDetails)
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });
    // search negative news function 
    let currentYear = taskDetails.year.split(",");
    let dpTypeValues = await Datapoints.find({
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
     // clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
      categoryId: taskDetails.categoryId,
      status: true
    }).distinct('dpType');

    console.log(dpTypeValues.length);
    // let dpDetailsList = [];
    let currentAllStandaloneDetails = [],
      historyAllStandaloneDetails = [];
    let keyIssuesList = [];

    let boardDpCodesData = {
      boardMemberList: [],
      dpCodesData: []
    };
    let kmpDpCodesData = {
      kmpMemberList: [],
      dpCodesData: []
    };
    let dpCodesData = [], priorityDpCodes = [];
    let currentAllBoardMemberMatrixDetails = [],
      historyAllBoardMemberMatrixDetails = [];
    let currentAllKmpMatrixDetails = [],
      historyAllKmpMatrixDetails = [];
    let errorDataDetails = [];
    errorDataDetails = await ErrorDetails.find({
      companyId: taskDetails.companyId.id,
      year: {
        $in: currentYear
      },
      categoryId: taskDetails.categoryId,
      status: true
    }).populate('errorTypeId');
    currentAllStandaloneDetails = await StandaloneDatapoints.find({
        taskId: req.params.taskId,
        companyId: taskDetails.companyId.id,
        year: {
          $in: currentYear
        },
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');

    historyAllStandaloneDetails = await StandaloneDatapoints.find({
        companyId: taskDetails.companyId.id,
        year: {
          $nin: currentYear
        },
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    currentAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({      
      taskId: req.params.taskId,
      companyId: taskDetails.companyId.id,
      year: {
          "$in": currentYear
        },
        
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    historyAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
        companyId: taskDetails.companyId.id,
        year: {
          "$nin": currentYear
        },
        
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    currentAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
      taskId: req.params.taskId,
      companyId: taskDetails.companyId.id,
      year: {
          "$in": currentYear
        },
        
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    historyAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
        companyId: taskDetails.companyId.id,
        year: {
          "$nin": currentYear
        },
        
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    if (taskDetails.taskStatus == 'Yet to work' || taskDetails.taskStatus == 'Collection Completed' || taskDetails.taskStatus == 'Verification Completed') {
      if (dpTypeValues.length > 0) {
        if (dpTypeValues.length > 1) {
          for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
            let keyIssuesCollection = await Datapoints.find({
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
              //clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
              categoryId: taskDetails.categoryId,
              status: true
            }).populate('keyIssueId');
            let dpTypeDatapoints = await Datapoints.find({
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
             // clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
              categoryId: taskDetails.categoryId,
              dpType: dpTypeValues[dpTypeIndex],
              status: true
            }).populate('keyIssueId').populate('categoryId');

            let keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
            //console.log(keyIssueList);
            for (let keyIssueListIndex = 0; keyIssueListIndex < keyIssueListObject.length; keyIssueListIndex++) {
              let keyIssues = {
                label: keyIssueListObject[keyIssueListIndex].keyIssueId.keyIssueName,
                value: keyIssueListObject[keyIssueListIndex].keyIssueId.id
              }
              keyIssuesList.push(keyIssues);
            }
            if (dpTypeValues[dpTypeIndex] == 'Board Matrix') {
              let boardMemberEq = await BoardMembers.find({companyId: taskDetails.companyId.id, endDateTimeStamp: 0});
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                let yearSplit = currentYear[currentYearIndex].split('-');
                let endDateString = yearSplit[1]+"-12-31";
                let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
                let boardMemberGt = await BoardMembers.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
                console.log(1614709800 ,  yearTimeStamp)
                let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);

                for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                  let boardNameValue = {
                    label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                    value: mergeBoardMemberList[boardMemberNameListIndex].id,
                    year: currentYear[currentYearIndex]
                  }
                  if(boardDpCodesData.boardMemberList.length > 0){
                    let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                      if(boardMemberValues.length > 0){
                        let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                        boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ','+currentYear[currentYearIndex];
                      } else {
                        boardDpCodesData.boardMemberList.push(boardNameValue);
                      }
                  } else {
                    boardDpCodesData.boardMemberList.push(boardNameValue);
                  }
                }
              }
              for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                for (let boarMemberListIndex = 0; boarMemberListIndex < boardDpCodesData.boardMemberList.length; boarMemberListIndex++) {                 
                  let boardDatapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    dataType: dpTypeDatapoints[datapointsIndex].dataType,
                    fiscalYear: boardDpCodesData.boardMemberList[boarMemberListIndex].year ,
                    memberName: boardDpCodesData.boardMemberList[boarMemberListIndex].label,
                    memberId: boardDpCodesData.boardMemberList[boarMemberListIndex].value,
                    status: "Yet to Start"
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllBoardMemberMatrixDetails,(object)=>{
                      if(object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && object.memberName == boardDpCodesData.boardMemberList[boarMemberListIndex].label){
                        boardDatapointsObject.status = 'Completed'
                      }
                    })
                  }
                boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                }
              }
            } else if (dpTypeValues[dpTypeIndex] == 'Kmp Matrix') {
              let kmpMemberEq = await Kmp.find({companyId: taskDetails.companyId.id, endDateTimeStamp: 0});
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let yearSplit = currentYear[currentYearIndex].split('-');
              let endDateString = yearSplit[1]+"-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
              let kmpMemberGt = await Kmp.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
              console.log(1614709800 ,  yearTimeStamp)
              let mergeKmpMemberList = _.concat(kmpMemberEq,kmpMemberGt);

              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                let kmpNameValue = {
                  label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                  value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if(kmpDpCodesData.kmpMemberList.length > 0){
                  let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                    if(kmpMemberValues.length > 0){
                      let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                      kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ','+currentYear[currentYearIndex];
                    } else {
                      kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                    }
                } else {
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                }
              }
            }
              for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                for (let kmpMemberListIndex = 0; kmpMemberListIndex < kmpDpCodesData.kmpMemberList.length; kmpMemberListIndex++) {

                  let kmpDatapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    dataType: dpTypeDatapoints[datapointsIndex].dataType,
                    fiscalYear: kmpDpCodesData.kmpMemberList[kmpMemberListIndex].year,
                    memberName: kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label,
                    memberId: kmpDpCodesData.kmpMemberList[kmpMemberListIndex].value,
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllKmpMatrixDetails,(object)=>{
                      if(object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && object.memberName == kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label){
                        kmpDatapointsObject.status = 'Completed'
                      }
                    })
                  }
                  kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);

                }
              }
            } else if (dpTypeValues[dpTypeIndex] == 'Standalone') {
              for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                if(dpTypeDatapoints[datapointsIndex].isPriority == 'true'){                  
                let datapointsObject = {
                  dpCode: dpTypeDatapoints[datapointsIndex].code,
                  dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                  companyId: taskDetails.companyId.id,
                  companyName: taskDetails.companyId.companyName,
                  keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                  keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                  pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                  pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                  dataType: dpTypeDatapoints[datapointsIndex].dataType,
                  fiscalYear: taskDetails.year,
                  status: 'Yet to Start'
                }
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                  _.filter(currentAllStandaloneDetails,(object)=>{
                    if(object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]){
                      datapointsObject.status = 'Completed'
                    }
                  })
                }
                priorityDpCodes.push(datapointsObject)
                } else {
                  let datapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    fiscalYear: taskDetails.year,
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllStandaloneDetails,(object)=>{
                      if(object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]){
                        datapointsObject.status = 'Completed'
                      }
                    })
                  }
                  dpCodesData.push(datapointsObject);

                }
              }
            }
          }
          return res.status(200).send({
            status: "200",
            message: "Data collection dp codes retrieved successfully!",
            keyIssuesList: keyIssuesList,
            priorityDpCodes:priorityDpCodes,
            standalone: {            
              dpCodesData: dpCodesData
            },
            boardMatrix: boardDpCodesData,
            kmpMatrix: kmpDpCodesData

          });
        } else {
          console.log(dpTypeValues.length);
          for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
            let dpTypeDatapoints = await Datapoints.find({
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
              clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
              categoryId: taskDetails.categoryId,
              dpType: dpTypeValues[dpTypeIndex],
              status: true
            }).populate('keyIssueId').populate('categoryId');
            console.log(dpTypeDatapoints.length)
            let keyIssueListObject = _.uniqBy(dpTypeDatapoints, 'keyIssueId');
            //console.log(keyIssueList);
            for (let keyIssueListIndex = 0; keyIssueListIndex < keyIssueListObject.length; keyIssueListIndex++) {
              let keyIssues = {
                label: keyIssueListObject[keyIssueListIndex].keyIssueId.keyIssueName,
                value: keyIssueListObject[keyIssueListIndex].keyIssueId.id
              }
              keyIssuesList.push(keyIssues);
            }
            for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
              if(dpTypeDatapoints[datapointsIndex].isPriority == 'true'){                  
                let datapointsObject = {
                  dpCode: dpTypeDatapoints[datapointsIndex].code,
                  dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                  companyId: taskDetails.companyId.id,
                  companyName: taskDetails.companyId.companyName,
                  keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                  keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                  pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                  pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                  fiscalYear: taskDetails.year,
                  status: 'Yet to Start'
                }
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                  _.filter(currentAllStandaloneDetails,(object)=>{
                    if(object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]){
                      datapointsObject.status = 'Completed'
                    }
                  })
                }
                priorityDpCodes.push(datapointsObject)
                } else {
                  let datapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    fiscalYear: taskDetails.year,
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllStandaloneDetails,(object)=>{
                      if(object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]){
                        datapointsObject.status = 'Completed'
                      }
                    })
                  }
                  dpCodesData.push(datapointsObject);
                }
            }
          }
          return res.status(200).send({
            status: "200",
            message: "Data collection dp codes retrieved successfully!",
            keyIssuesList: keyIssuesList,
            priorityDpCodes:priorityDpCodes,
            standalone: {
              dpCodesData: dpCodesData
            }
          });
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "No dp codes available",
          dpCodeData: dpCodesData
        });
      }
    } else if( taskDetails.taskStatus == "Correction Pending" ) {
      if (dpTypeValues.length > 1) {
        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {          
          if (dpTypeValues[dpTypeIndex] == 'Board Matrix') {
            let errorboardDatapoints = await BoardMembersMatrixDataPoints.find({
              taskId: req.params.taskId,
              companyId:taskDetails.companyId.id,
              year:{
                $in:currentYear
              },
              dpStatus: 'Error',             
              status: true
            }).populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
          }]); 
          let boardMemberEq = await BoardMembers.find({companyId: taskDetails.companyId.id, endDateTimeStamp: 0});
          for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
            let yearSplit = currentYear[currentYearIndex].split('-');
            let endDateString = yearSplit[1]+"-12-31";
            let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
            let boardMemberGt = await BoardMembers.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
            console.log(1614709800 ,  yearTimeStamp)
            let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);

            for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
              let boardNameValue = {
                label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                value: mergeBoardMemberList[boardMemberNameListIndex].id,
                year: currentYear[currentYearIndex]
              }
              if(boardDpCodesData.boardMemberList.length > 0){
                let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                  if(boardMemberValues.length > 0){
                    let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                    boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ','+currentYear[currentYearIndex];
                  } else {
                    boardDpCodesData.boardMemberList.push(boardNameValue);
                  }
              } else {
                boardDpCodesData.boardMemberList.push(boardNameValue);
              }
            }
          }
          for (let errorDpIndex = 0; errorDpIndex < errorboardDatapoints.length; errorDpIndex++) {
            _.filter(boardDpCodesData.boardMemberList, (object)=>{
              if(object.label == errorboardDatapoints[errorDpIndex].memberName){
                let boardDatapointsObject = {
                  dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
                  dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
                  companyId: taskDetails.companyId.id,
                  companyName: taskDetails.companyId.companyName,
                  keyIssueId: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                  keyIssue: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                  pillarId: taskDetails.categoryId.id,
                  pillar: taskDetails.categoryId.categoryName,
                  fiscalYear: errorboardDatapoints[errorDpIndex].year,
                  memberName: object.label,
                  memberId: object.value,
                  status:'Yet to Start'
                }
                if(boardDpCodesData.dpCodesData.length > 0)
                {
                  let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorboardDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorboardDatapoints[errorDpIndex].memberName);
                  if(yearfind > -1){
                    boardDpCodesData.dpCodesData[yearfind].fiscalYear = boardDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",",errorboardDatapoints[errorDpIndex].year)
                  }else {
                    boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                    }
                } else {
                  boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                }
              }
            })
          }
          } else if(dpTypeValues[dpTypeIndex] == 'Kmp Matrix') {
            let errorkmpDatapoints = await KmpMatrixDataPoints.find({
              taskId: req.params.taskId,
              companyId:taskDetails.companyId.id,
              year:{
                $in:currentYear
              },
              dpStatus: 'Error',
              status: true
            }).populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);
            let kmpMemberEq = await Kmp.find({companyId: taskDetails.companyId.id, endDateTimeStamp: 0});
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let yearSplit = currentYear[currentYearIndex].split('-');
              let endDateString = yearSplit[1]+"-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
              let kmpMemberGt = await Kmp.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
              console.log(1614709800 ,  yearTimeStamp)
              let mergeKmpMemberList = _.concat(kmpMemberEq,kmpMemberGt);

              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                let kmpNameValue = {
                  label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                  value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if(kmpDpCodesData.kmpMemberList.length > 0){
                  let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                    if(kmpMemberValues.length > 0){
                      let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                      kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ','+currentYear[currentYearIndex];
                    } else {
                      kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                    }
                } else {
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                }
              }
            }
            for (let errorDpIndex = 0; errorDpIndex < errorkmpDatapoints.length; errorDpIndex++) {
              _.filter(kmpDpCodesData.kmpMemberList ,(object)=>{
                if(object.label ==  errorkmpDatapoints[errorDpIndex].memberName){
                  let kmpDatapointsObject = {
                    dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
                    dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: errorkmpDatapoints[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status: 'Yet to Start'
                  }
                  if(kmpDpCodesData.dpCodesData.length > 0)
                  {
                    let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorkmpDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorkmpDatapoints[errorDpIndex].memberName);
                    if(yearfind > -1){
                      kmpDpCodesData.dpCodesData[yearfind].fiscalYear = kmpDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",",errorkmpDatapoints[errorDpIndex].year)
                    }else {
                      kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                      }
                  } else {
                    kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                  }
                }
              });
            }
          } else if (dpTypeValues[dpTypeIndex] == 'Standalone') {

            let errorDatapoints = await StandaloneDatapoints.find({
              taskId: req.params.taskId,
              companyId:taskDetails.companyId.id,
              dpStatus: 'Error',
              status: true
            }).populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);
            for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {
           
              let datapointsObject = {
                dpCode: errorDatapoints[errorDpIndex].datapointId.code,
                dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                pillarId: taskDetails.categoryId.id,
                pillar: taskDetails.categoryId.categoryName,
                fiscalYear: errorDatapoints[errorDpIndex].year,
                status: ''
              }
              if(dpCodesData.length > 0)
              {
                let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
                if(yearfind > -1){
                  dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",",errorDatapoints[errorDpIndex].year)
                }else {
                  dpCodesData.push(datapointsObject);
                  }
              } else {
              dpCodesData.push(datapointsObject);
              }
            }

          }
        }        
        return res.status(200).send({
          status: "200",
          message: "Data correction dp codes retrieved successfully!",
          standalone: {
            dpCodesData: dpCodesData
          },
          boardMatrix: boardDpCodesData,
          kmpMatrix: kmpDpCodesData
        });
      } else {
        try {
          let errorDatapoints = await StandaloneDatapoints.find({
            taskId: req.params.taskId,
            companyId: taskDetails.companyId.id,
            dpStatus : "Error",
            status: true
          }).populate({
            path: 'datapointId',
            populate: {
              path: 'keyIssueId'
            }
          });
          console.log(errorDatapoints)
          for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

            let datapointsObject = {
              dpCode: errorDatapoints[errorDpIndex].datapointId.code,
              dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
              companyId: taskDetails.companyId.id,
              companyName: taskDetails.companyId.companyName,
              keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
              keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
              pillarId: taskDetails.categoryId.id,
              pillar: taskDetails.categoryId.categoryName,
              fiscalYear: errorDatapoints[errorDpIndex].year,
              status: 'Yet to Start'
            }
            if(dpCodesData.length > 0)
            {
              let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
              
              if(yearfind > -1){
                dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",",errorDatapoints[errorDpIndex].year)
                 dpCodesData[yearfind].status = 'Completed';
              }else {
                let dpCodeStatus = errorDatapoints.findIndex(obj => obj.datapointId.code == errorDatapoints[errorDpIndex].datapointId.code && obj.correctionStatus == 'Completed');
                if(dpCodeStatus > -1){
                  datapointsObject.status = 'Completed';
                }
                dpCodesData.push(datapointsObject);
                }
            } else {
              let dpCodeStatus = errorDatapoints.findIndex(obj => obj.datapointId.code == errorDatapoints[errorDpIndex].datapointId.code && obj.correctionStatus == 'Completed');
              if(dpCodeStatus > -1){
                datapointsObject.status = 'Completed';
              }
            dpCodesData.push(datapointsObject);
            }
          }
          return res.status(200).send({
            status: "200",
            message: "Data correction dp codes retrieved successfully!",
            standalone: {
              dpCodesData: dpCodesData
            }
          });
        } catch (error) {
          return res.status(500).json({
            message: error
          });
        }

      }
    } else if (taskDetails.taskStatus == 'Correction Completed' ) {
      if (dpTypeValues.length > 1) {
        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
          if (dpTypeValues[dpTypeIndex] == 'Board Matrix') {

            let boardMemberEq = await BoardMembers.find({companyId: taskDetails.companyId.id, endDateTimeStamp: 0});
            for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let yearSplit = currentYear[currentYearIndex].split('-');
              let endDateString = yearSplit[1]+"-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
              let boardMemberGt = await BoardMembers.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
              console.log(1614709800 ,  yearTimeStamp)
              let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);
  
              for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                let boardNameValue = {
                  label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                  value: mergeBoardMemberList[boardMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if(boardDpCodesData.boardMemberList.length > 0){
                  let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                    if(boardMemberValues.length > 0){
                      let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                      boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ','+currentYear[currentYearIndex];
                    } else {
                      boardDpCodesData.boardMemberList.push(boardNameValue);
                    }
                } else {
                  boardDpCodesData.boardMemberList.push(boardNameValue);
                }
              }
            }
            let errorboardDatapoints = await BoardMembersMatrixDataPoints.find({
              taskId: req.params.taskId,
              companyId: taskDetails.companyId.id,
              year:{
                $in:currentYear
              },
              dpStatus: 'Correction',              
              status: true
            }).populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);
            if(errorboardDatapoints.length > 0){             
            for (let errorDpIndex = 0; errorDpIndex < errorboardDatapoints.length; errorDpIndex++) {
              _.filter( boardDpCodesData.boardMemberList, (object)=>{
                if(object.label == errorboardDatapoints[errorDpIndex].memberName){
                  let boardDatapointsObject = {
                    dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
                    dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: errorboardDatapoints[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status:'Yet to Start'
                  }
                  if(boardDpCodesData.dpCodesData.length > 0)
                  {
                    let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorboardDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorboardDatapoints[errorDpIndex].memberName);
                    if(yearfind > -1){
                      boardDpCodesData.dpCodesData[yearfind].fiscalYear = boardDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",",errorboardDatapoints[errorDpIndex].year)
                    }else {
                      boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                      }
                  } else {
                    boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                  }
                }
              })
            }  
          }
          } else if (dpTypeValues[dpTypeIndex] == 'Kmp Matrix') {
            let kmpMemberEq = await Kmp.find({companyId: taskDetails.companyId.id, endDateTimeStamp: 0});
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let yearSplit = currentYear[currentYearIndex].split('-');
              let endDateString = yearSplit[1]+"-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime()/1000);
              let kmpMemberGt = await Kmp.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{$gt:yearTimeStamp}});
              let mergeKmpMemberList = _.concat(kmpMemberEq,kmpMemberGt);

              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                let kmpNameValue = {
                  label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                  value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if(kmpDpCodesData.kmpMemberList.length > 0){
                  let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                    if(kmpMemberValues.length > 0){
                      let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id )
                      kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ','+currentYear[currentYearIndex];
                    } else {
                      kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                    }
                } else {
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                }
              }
            }
            let errorkmpDatapoints = await BoardMembersMatrixDataPoints.find({
              taskId: req.params.taskId,
              companyId: taskDetails.companyId.id,
              year:{
                $in:currentYear
              },
              dpStatus: 'Correction',
              status: true
            }).populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);
            if(errorkmpDatapoints.length >0 ){
            for (let errorDpIndex = 0; errorDpIndex < errorkmpDatapoints.length; errorDpIndex++) {
              _.filter(kmpDpCodesData.kmpMemberList ,(object)=>{
                if(object.label ==  errorkmpDatapoints[errorDpIndex].memberName){
                  let kmpDatapointsObject = {
                    dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
                    dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: errorkmpDatapoints[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status: 'Yet to Start'
                  }
                  if(kmpDpCodesData.dpCodesData.length > 0)
                  {
                    let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorkmpDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorkmpDatapoints[errorDpIndex].memberName);
                    if(yearfind > -1){
                      kmpDpCodesData.dpCodesData[yearfind].fiscalYear = kmpDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",",errorkmpDatapoints[errorDpIndex].year)
                    }else {
                      kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                      }
                  } else {
                    kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                  }
                }
              });
            }
          }
          } else if(dpTypeValues[dpTypeIndex] == 'Standalone') {
            let errorDatapoints = await StandaloneDatapoints.find({
              taskId: req.params.taskId,
              companyId:taskDetails.companyId.id,
              year:{
                $in:currentYear
              },
              dpStatus: 'Correction',
              status: true
            }).populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);
            for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

              let datapointsObject = {
                dpCode: errorDatapoints[errorDpIndex].datapointId.code,
                dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                pillarId: taskDetails.categoryId.id,
                pillar: taskDetails.categoryId.categoryName,
                fiscalYear: errorDatapoints[errorDpIndex].year,
                status: 'Yet to Start'
              }
              if(dpCodesData.length > 0)
              {
                let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
                if(yearfind > -1){
                  dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",",errorDatapoints[errorDpIndex].year)
                }else {
                  dpCodesData.push(datapointsObject);
                  }
              } else {
              dpCodesData.push(datapointsObject);
              }
            }
          }
        }        
        return res.status(200).send({
          status: "200",
          message: "Data correction dp codes retrieved successfully!",
          standalone: {
            dpCodesData: dpCodesData
          },
          boardMatrix: boardDpCodesData,
          kmpMatrix: kmpDpCodesData
        });
      } else {
        try {
          let errorDatapoints = await StandaloneDatapoints.find({
            // taskId: req.params.taskId,
            taskId: req.params.taskId,
            companyId:taskDetails.companyId.id,
            year:{
              $in:currentYear
            },
            dpStatus: 'Correction',
            status: true
          }).populate([{
            path: 'datapointId',
            populate: {
              path: 'keyIssueId'
            }
          }]);
          for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

            let datapointsObject = {
              dpCode: errorDatapoints[errorDpIndex].datapointId.code,
              dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
              companyId: taskDetails.companyId.id,
              companyName: taskDetails.companyId.companyName,
              keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
              keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
              pillarId: taskDetails.categoryId.id,
              pillar: taskDetails.categoryId.categoryName,
              fiscalYear: errorDatapoints[errorDpIndex].year,
              status: 'Yet to Start'
            }
            if(dpCodesData.length > 0)
            {
              let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
              let dpCodeStatus = errorDatapoints.findIndex(obj => obj.datapointId.code == errorDatapoints[errorDpIndex].datapointId.code && obj.correctionStatus == 'Completed');
              if(dpCodeStatus > -1){
                datapointsObject.status = 'Completed';
              }
              if(yearfind > -1){
                dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",",errorDatapoints[errorDpIndex].year)
              }else {
                dpCodesData.push(datapointsObject);
                }
            } else {
            dpCodesData.push(datapointsObject);
            }

          }

          return res.status(200).send({
            status: "200",
            message: "Data correction dp codes retrieved successfully!",
            standalone: {
              dpCodesData: dpCodesData
            }

          });
        } catch (error) {
          return res.status(500).json({
            message: error
          });
        }

      }
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });

  }
}

export const datapointDetails = async (req, res, next) => {
  try {
    let taskDetails = await TaskAssignment.findOne({
      _id: req.body.taskId
    }).populate({
      path: "companyId",
      populate: {
        path: "clientTaxonomyId"
      }
    }).populate('categoryId');
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });

    let currentYear = req.body.year.split(',');
    let clienttaxonomyFields = await ClientTaxonomy.find({_id: taskDetails.companyId.clientTaxonomyId.id}).distinct('fields');
    console.log(clienttaxonomyFields);
    let displayFields = clienttaxonomyFields.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Controversy');
    console.log(displayFields);
    let requiredFields = [
        "categoryCode",
        "categoryName",
        "code",
        "comments",
        "dataCollection",
        "dataCollectionGuide",
        "description",
        "dpType",
        "errorType",
        "finalUnit",
        "functionType",
        "hasError",
        "industryRelevant",
        "isPriority",
        "keyIssueCode",
        "keyIssueName",
        "name",
        "normalizedBy",
        "pageNumber",
        "percentile",
        "polarity",
        "publicationDate",
        "reference",
        "response",
        "screenShot",
        "signal",
        "sourceName",
        "standaloneOrMatrix",
        "textSnippet",
        "themeCode",
        "themeName",
        "unit",
        "url",
        "weighted",
        "year"
    ];
    let dpTypeValues = await Datapoints.findOne({
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
     // clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
      categoryId: taskDetails.categoryId.id,
      _id: req.body.datapointId,
      status: true
    }).populate('keyIssueId').populate('categoryId');

    let errorDataDetails = [];
    errorDataDetails = await ErrorDetails.find({
      taskId: req.body.taskId,
      companyId: taskDetails.companyId.id,
      year: {
        $in: currentYear
      },
      status: true
    }).populate('errorTypeId');
    let sourceTypeDetails = [];
    let companySourceDetails = await CompanySources.find({companyId: taskDetails.companyId.id});
    for (let sourceIndex = 0; sourceIndex < companySourceDetails.length; sourceIndex++) {
      sourceTypeDetails.push({
         sourceName: companySourceDetails[sourceIndex].name,
         value: companySourceDetails[sourceIndex].id,
         url: companySourceDetails[sourceIndex].sourceUrl,
         publicationDate: companySourceDetails[sourceIndex].publicationDate
      })      
    }
    if (req.body.memberType == 'Standalone') {
      let commentsDetails = await ErrorDetails.distinct('comments',{companyId: taskDetails.companyId.id,datapointId: req.body.datapointId});
      let currentAllStandaloneDetails = await StandaloneDatapoints.find({
          taskId: req.body.taskId,
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          year: {
            $in: currentYear
          },
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyAllStandaloneDetails = await StandaloneDatapoints.find({
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          year: {
            $nin: currentYear
          },
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyYear = _.uniqBy(historyAllStandaloneDetails, 'year');
      historyYear = _.orderBy(historyYear, 'year', 'desc');
      let datapointsObject = {
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        companyId: taskDetails.companyId.id,
        companyName: taskDetails.companyId.companyName,
        keyIssueId: dpTypeValues.keyIssueId.id,
        keyIssue: dpTypeValues.keyIssueId.keyIssueName,
        pillarId: dpTypeValues.categoryId.id,
        pillar: dpTypeValues.categoryId.categoryName,
        fiscalYear: taskDetails.year,
        comments: commentsDetails,
        currentData: [],
        historicalData: [],
        status: ''
      }
      let inputValues = [];
      if(dpTypeValues.dataType == 'Select'){        
       let inputs = dpTypeValues.unit.split('/');
       for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
         const element = {
           label: inputs[inputIndex],
           value: inputs[inputIndex]
         }
         inputValues.push(element);
       }
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
        let currentDatapointsObject = {};
        _.filter(currentAllStandaloneDetails, function (object) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
          if (object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasError == true) {
            let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex])
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                  raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                  type: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                  refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                  comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                  errorStatus: object.correctionStatus
                },
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let standaloneDetail = currentAllStandaloneDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '', label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }                
              }            
          } else if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == true){
            let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex] ); 
            currentDatapointsObject = {
              status: 'Completed',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYear[currentYearIndex],
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              inputValues:inputValues,
              textSnippet: object.textSnippet,
              pageNo: object.pageNumber,
              screenShot: object.screenShot,
              response: object.response,
              memberName: object.memberName,
              sourceList: sourceTypeDetails,
              source: {
                url: object.url ? object.url : '',
                sourceName: sourceName,
                value: sourceId,
                publicationDate: object.publicationDate ? object.publicationDate : ''
              },
              error: {
                hasError: object.hasError,
                isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                type: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
              },
              comments: object.comments,
              additionalDetails: []
            }
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                  let standaloneDetail = currentAllStandaloneDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '', label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '' };
                  } else {
                    currentValue = standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '';
                  }
                }
                currentDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }                
            }
          } else if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == false && object.hasError == false){
            let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex])
            currentDatapointsObject = {
              status: 'Completed',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYear[currentYearIndex],
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              inputValues:inputValues,
              textSnippet: object.textSnippet,
              pageNo: object.pageNumber,
              screenShot: object.screenShot,
              response: object.response,
              memberName: object.memberName,
              sourceList: sourceTypeDetails,
              source: {
                url: object.url ? object.url : '',
                sourceName: sourceName,
                value: sourceId,
                publicationDate: object.publicationDate ? object.publicationDate : ''
              },
              error: {
                hasError: object.hasError,
                isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                type: '',
                refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                errorStatus:object.correctionStatus
              },
              comments: [],
              additionalDetails:[]
            }              
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                  let standaloneDetail = currentAllStandaloneDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '', label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '' };
                  } else {
                    currentValue = standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '';
                  }
                }
                currentDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }                
            }

          }
          datapointsObject.status = 'Completed';
        });
        if (Object.keys(currentDatapointsObject).length == 0) {
          currentDatapointsObject = {
            status: 'Yet to Start',
            dpCode: dpTypeValues.code,
            dpCodeId: dpTypeValues.id,
            fiscalYear: currentYear[currentYearIndex],
            description: dpTypeValues.description,
            dataType: dpTypeValues.dataType,
            inputValues:inputValues,
            textSnippet: '',
            pageNo: '',
            screenShot: '',
            response: '',
            sourceList: sourceTypeDetails,
            source: {
              url: '',
              sourceName: '',
              value: '',
              publicationDate: ''
            },
            error: {},
            comments: [],
            additionalDetails: []
          }          
          for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
            if(!requiredFields.includes(displayFields[dIndex].fieldName)){
              let optionValues = [], optionVal = '', currentValue;
              if(displayFields[dIndex].inputType == 'Select'){
                let options = displayFields[dIndex].inputValues.split(',');
                if(options.length > 0){
                  for (let optIndex = 0; optIndex < options.length; optIndex++) {
                    optionValues.push({
                      value: options[optIndex],
                      label: options[optIndex]
                    });                        
                  }
                } else {
                  optionValues = [];
                }
              } else {
                optionVal = displayFields[dIndex].inputValues;
              }
              if(displayFields[dIndex].inputType == 'Static'){
                currentValue = dpTypeValues[displayFields[dIndex].fieldName];
              } else {
              //  let standaloneDetail = currentAllStandaloneDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                if(displayFields[dIndex].inputType == 'Select'){
                  currentValue = { value: '', label: '' };
                } else {
                  currentValue = '';
                }
              }
              currentDatapointsObject.additionalDetails.push({
                fieldName: displayFields[dIndex].fieldName,
                name: displayFields[dIndex].name,
                value: currentValue ? currentValue: '',
                inputType: displayFields[dIndex].inputType,
                inputValues: optionValues.length > 0 ? optionValues : optionVal
              })
            }                
          }
          datapointsObject.status = 'Yet to Start';
        }
        datapointsObject.currentData.push(currentDatapointsObject);
      }
      let totalHistories = 0;
      if (historyYear.length > 5 ) {
        totalHistories = 5;
      } else{
        totalHistories = historyYear.length;
      }
      for (let historicalYearIndex = 0; historicalYearIndex < totalHistories; historicalYearIndex++) {
        let historicalDatapointsObject = {};
        _.filter(historyAllStandaloneDetails, function (object) {
          if (object.year == historyYear[historicalYearIndex].year) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
            historicalDatapointsObject = {
              status: 'Completed',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: object.year,
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              textSnippet: object.textSnippet,
              pageNo: object.pageNumber,
              screenShot: object.screenShot,
              response: object.response,
              standaradDeviation: object.standaradDeviation,
              average: object.average,
              sourceList: sourceTypeDetails,
              source: {
                url: object.url ? object.url : '',
                sourceName: sourceName,
                value: sourceId,
                publicationDate: object.publicationDate ? object.publicationDate : ''
              },
              error: {},
              comments: [],
              additionalDetails: []
            }
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                  let standaloneDetail = historyAllStandaloneDetails.find((obj) => obj.year == historyYear[historicalYearIndex].year);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '', label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '' };
                  } else {
                    currentValue = standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '';
                  }
                }
                historicalDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }                
            }
          }
        });
        datapointsObject.historicalData.push(historicalDatapointsObject);
      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        dpCodeData: datapointsObject
      });
    } else if (req.body.memberType == 'Board Matrix') {
      let commentsDetails = await ErrorDetails.distinct('comments',{companyId: taskDetails.companyId.id,datapointId: req.body.datapointId,memberName:req.body.memberName});
      let historyAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          memberName:req.body.memberName,
          year: {
            "$nin": currentYear
          },
          
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
      let historyYear = _.uniqBy(historyAllBoardMemberMatrixDetails, 'year');
      historyYear = _.orderBy(historyYear, 'year', 'desc');
      let currentAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          taskId: req.body.taskId,
          datapointId: req.body.datapointId,
          memberName:req.body.memberName,
          
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let boardDatapointsObject = {
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        companyId: taskDetails.companyId.id,
        companyName: taskDetails.companyId.companyName,
        keyIssueId: dpTypeValues.keyIssueId.id,
        keyIssue: dpTypeValues.keyIssueId.keyIssueName,
        pillarId: dpTypeValues.categoryId.id,
        pillar: dpTypeValues.categoryId.categoryName,
        fiscalYear: taskDetails.year,
        comments: commentsDetails,
        currentData: [],
        historicalData: [],
        status: ""
      }
      let inputValues = [];
      if(dpTypeValues.dataType == 'Select'){        
        let inputs = dpTypeValues.unit.split('/');
        for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
          const element = {
            label: inputs[inputIndex],
            value: inputs[inputIndex]
          }
          inputValues.push(element);
        }
      }
      let totalHistories = 0;
      if (historyYear.length > 5 ) {
        totalHistories = 5;
      } else{
        totalHistories = historyYear.length;
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(currentAllBoardMemberMatrixDetails, function (object) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
            if (object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasError == true) {
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex] && obj.memberName == req.body.memberName )
                currentDatapointsObject = {
                  status: 'Completed',
                  dpCode: dpTypeValues.code,
                  dpCodeId: dpTypeValues.id,
                  fiscalYear: currentYear[currentYearIndex],
                  description: dpTypeValues.description,
                  dataType: dpTypeValues.dataType,
                  inputValues:inputValues,
                  textSnippet: object.textSnippet,
                  pageNo: object.pageNumber,
                  screenShot: object.screenShot,
                  response: object.response,
                  memberName: object.memberName,
                  sourceList: sourceTypeDetails,
                  source: {
                    url: object.url ? object.url : '',
                    sourceName: sourceName,
                    value: sourceId,
                    publicationDate: object.publicationDate ? object.publicationDate : ''
                  },
                  error: {
                    hasError: object.hasError,
                    isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                    raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                    type: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                    refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                    comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                    errorStatus: object.correctionStatus
                  },
                  comments: [],
                  additionalDetails: []
                }
                for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                  if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                    let optionValues = [], optionVal = '', currentValue;
                    if(displayFields[dIndex].inputType == 'Select'){
                      let options = displayFields[dIndex].inputValues.split(',');
                      if(options.length > 0){
                        for (let optIndex = 0; optIndex < options.length; optIndex++) {
                          optionValues.push({
                            value: options[optIndex],
                            label: options[optIndex]
                          });                        
                        }
                      } else {
                        optionValues = [];
                      }
                    } else {
                      optionVal = displayFields[dIndex].inputValues;
                    }
                    if(displayFields[dIndex].inputType == 'Static'){
                      currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                    } else {
                      let responseDetails = currentAllBoardMemberMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                      if(displayFields[dIndex].inputType == 'Select'){
                        currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                      } else {
                        currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                      }
                    }
                    currentDatapointsObject.additionalDetails.push({
                      fieldName: displayFields[dIndex].fieldName,
                      name: displayFields[dIndex].name,
                      value: currentValue ? currentValue: '',
                      inputType: displayFields[dIndex].inputType,
                      inputValues: optionValues.length > 0 ? optionValues : optionVal
                    })
                  }
                }           
            } else if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == true){
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex]  && obj.memberName == req.body.memberName)
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                  raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                  type: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                  refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                  comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                  errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
                },
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = currentAllBoardMemberMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }
            } else if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == false && object.hasError == false){
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex] && obj.memberName == req.body.memberName)
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                  raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                  type: '',
                  refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                  comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                  errorStatus:object.correctionStatus
                },
                comments: [],
                additionalDetails:[]
              } 
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = currentAllBoardMemberMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }

            }          
             boardDatapointsObject.status = 'Completed';
          });
          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = {
              status: 'Yet to Start',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYear[currentYearIndex],
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              inputValues:inputValues,
              memberName: req.body.memberName,
              textSnippet: '',
              pageNo: '',
              screenShot: '',
              response: '',
              sourceList: sourceTypeDetails,
              source: {
                url: '',
                sourceName: '',
                value: '',
                publicationDate: ''
              },
              error: {},
              comments: [],
              additionalDetails:[]
            }
            
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                 // let responseDetails = currentAllBoardMemberMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: '', label: '' };
                  } else {
                    currentValue = '';
                  }
                }
                currentDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }
            }
            boardDatapointsObject.status = "Yet to Start"
          }
          boardDatapointsObject.currentData.push(currentDatapointsObject);
        
      }
      for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories.length; hitoryYearIndex++) {
          let historicalDatapointsObject = {};
          _.filter(historyAllBoardMemberMatrixDetails, function (object) {
            if (object.year == historyYear[hitoryYearIndex].year && object.memberName == req.body.memberName) {
              let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
              let sourceName = sourceValues[0];
              let sourceId = sourceValues[1] ? sourceValues[1] : ''
              historicalDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: historyYear[hitoryYearIndex].year,
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                memberName: object.memberName,
                response: object.response,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = historyAllBoardMemberMatrixDetails.find((obj) => obj.year == historyYear[hitoryYearIndex].year);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  historicalDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }
            }
          });
          boardDatapointsObject.historicalData.push(historicalDatapointsObject);
      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        dpCodeData: boardDatapointsObject
      });
    } else if (req.body.memberType == 'KMP Matrix') {
      let commentsDetails = await ErrorDetails.distinct('comments',{companyId: taskDetails.companyId.id,datapointId: req.body.datapointId, memberName:req.body.memberName});

      let historyAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
          companyId: taskDetails.companyId.id,
          memberName: req.body.memberName,
          year: {
            "$nin": currentYear
          },
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyYear = _.uniqBy(historyAllKmpMatrixDetails, 'year');
      historyYear = _.orderBy(historyYear, 'year', 'desc');
      let currentAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
          taskId: req.body.taskId,
          datapointId:req.body.datapointId,
          memberName: req.body.memberName,
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
        //let currentYearValues = _.uniqBy(currentAllKmpMatrixDetails, 'year');

      let kmpDatapointsObject = {
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        companyId: taskDetails.companyId.id,
        companyName: taskDetails.companyId.companyName,
        keyIssueId: dpTypeValues.keyIssueId.id,
        keyIssue: dpTypeValues.keyIssueId.keyIssueName,
        pillarId: dpTypeValues.categoryId.id,
        pillar: dpTypeValues.categoryId.categoryName,
        fiscalYear: taskDetails.year,
        comments: commentsDetails,
        currentData: [],
        historicalData: [],
        status: 'Yet to Start'
      }
      let inputValues = [];
      if(dpTypeValues.dataType == 'Select'){        
        let inputs = dpTypeValues.unit.split('/');
        for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
          const element = {
            label: inputs[inputIndex],
            value: inputs[inputIndex]
          }
          inputValues.push(element);
        }
      }
      let totalHistories = 0;
      if (historyYear.length > 5 ) {
        totalHistories = 5;
      } else{
        totalHistories = historyYear.length;
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(currentAllKmpMatrixDetails, function (object) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
            if (object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasError == true) {
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex] && obj.memberName == req.body.memberName)
                currentDatapointsObject = {
                  status: 'Completed',
                  dpCode: dpTypeValues.code,
                  dpCodeId: dpTypeValues.id,
                  fiscalYear: currentYear[currentYearIndex],
                  description: dpTypeValues.description,
                  dataType: dpTypeValues.dataType,
                  inputValues:inputValues,
                  textSnippet: object.textSnippet,
                  pageNo: object.pageNumber,
                  screenShot: object.screenShot,
                  response: object.response,
                  memberName: object.memberName,
                  sourceList: sourceTypeDetails,
                  source: {
                    url: object.url ? object.url : '',
                    sourceName: sourceName,
                    value: sourceId,
                    publicationDate: object.publicationDate ? object.publicationDate : ''
                  },
                  error: {
                    hasError: object.hasError,
                    isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                    raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                    type: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                    refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                    comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                    errorStatus: object.correctionStatus
                  },
                  comments: [],
                  additionalDetails: []
                }
                for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                  if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                    let optionValues = [], optionVal = '', currentValue;
                    if(displayFields[dIndex].inputType == 'Select'){
                      let options = displayFields[dIndex].inputValues.split(',');
                      if(options.length > 0){
                        for (let optIndex = 0; optIndex < options.length; optIndex++) {
                          optionValues.push({
                            value: options[optIndex],
                            label: options[optIndex]
                          });                        
                        }
                      } else {
                        optionValues = [];
                      }
                    } else {
                      optionVal = displayFields[dIndex].inputValues;
                    }
                    if(displayFields[dIndex].inputType == 'Static'){
                      currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                    } else {
                      let responseDetails = currentAllKmpMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                      if(displayFields[dIndex].inputType == 'Select'){
                        currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                      } else {
                        currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                      }
                    }
                    currentDatapointsObject.additionalDetails.push({
                      fieldName: displayFields[dIndex].fieldName,
                      name: displayFields[dIndex].name,
                      value: currentValue ? currentValue: '',
                      inputType: displayFields[dIndex].inputType,
                      inputValues: optionValues.length > 0 ? optionValues : optionVal
                    })
                  }
                }           
            } else if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == true){
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex]  && obj.memberName == req.body.memberName)
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                  raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                  type: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                  refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                  comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                  errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''

                },
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = currentAllKmpMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value:responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }
            } else if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == false && object.hasError == false){
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex] && obj.memberName == req.body.memberName)
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  isAccepted: errorDetailsObject[0] ? errorDetailsObject[0].isErrorAccepted : '',
                  raisedBy: errorDetailsObject[0] ? errorDetailsObject[0].raisedBy : '',
                  type: '',
                  refData: errorDetailsObject[0] ? errorDetailsObject[0].errorCaughtByRep : '',
                  comment:errorDetailsObject[0] ? errorDetailsObject[0].rejectComment : '',
                  errorStatus:object.correctionStatus
                },
                comments: [],
                additionalDetails:[]
              } 
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = currentAllKmpMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value:responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }

            } 
          });
          
          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = {
              status: 'Yet to Start',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYear[currentYearIndex],
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              inputValues:inputValues,
              memberName: req.body.memberName,
              textSnippet: '',
              pageNo: '',
              screenShot: '',
              response: '',
              sourceList: sourceTypeDetails,
              source: {
                url: '',
                sourceName: '',
                value: '',
                publicationDate: ''
              },
              error: {},
              comments: [],
              additionalDetails: []
            }
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                 // let responseDetails = currentAllKmpMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: '', label:  '' };
                  } else {
                    currentValue =  '';
                  }
                }
                currentDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }
            }
            kmpDatapointsObject.status = 'Yet to Start';
          }
          kmpDatapointsObject.currentData.push(currentDatapointsObject);
      }
      for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories.length; hitoryYearIndex++) {
        let boardMembersList = historyAllKmpMatrixDetails.filter(obj => obj.year == historyYear[hitoryYearIndex].year);
        let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
        for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {

          let historicalDatapointsObject = {};
          _.filter(historyAllKmpMatrixDetails, function (object) {
            if (object.datapointId.id == dpTypeValues.id && object.year == historyYear[hitoryYearIndex].year && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
              let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
              let sourceName = sourceValues[0];
              let sourceId = sourceValues[1] ? sourceValues[1] : ''
              historicalDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: historyYear[hitoryYearIndex].year,
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                memberName: object.memberName,
                response: object.response,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = historyAllKmpMatrixDetails.find((obj) => obj.year == historyYear[hitoryYearIndex].year);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  historicalDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }
            }
          });
          kmpDatapointsObject.historicalData.push(historicalDatapointsObject);
          //mergedKMPHistoryDetails = _.concat(historicalDatapointsObject, historicalDatapointsObject)
        }

      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        dpCodeData: kmpDatapointsObject
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}  

export const repDatapointDetails = async (req, res, next) => {
  try {
    let taskDetails = await TaskAssignment.findOne({
      _id: req.body.taskId
    }).populate({
      path: "companyId",
      populate: {
        path: "clientTaxonomyId"
      }
    }).populate('categoryId');
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });

    let currentYear = req.body.year.split(',');
    let clienttaxonomyFields = await ClientTaxonomy.find({_id: taskDetails.companyId.clientTaxonomyId.id}).distinct('fields');
    console.log(clienttaxonomyFields);
    let displayFields = clienttaxonomyFields.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Controversy');
    console.log(displayFields);
    let requiredFields = [
        "categoryCode",
        "categoryName",
        "code",
        "comments",
        "dataCollection",
        "dataCollectionGuide",
        "description",
        "dpType",
        "errorType",
        "finalUnit",
        "functionType",
        "hasError",
        "industryRelevant",
        "isPriority",
        "keyIssueCode",
        "keyIssueName",
        "name",
        "normalizedBy",
        "pageNumber",
        "percentile",
        "polarity",
        "publicationDate",
        "reference",
        "response",
        "screenShot",
        "signal",
        "sourceName",
        "standaloneOrMatrix",
        "textSnippet",
        "themeCode",
        "themeName",
        "unit",
        "url",
        "weighted",
        "year"
    ];
    let dpTypeValues = await Datapoints.findOne({
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
     // clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
      categoryId: taskDetails.categoryId.id,
      _id: req.body.datapointId,
      status: true
    }).populate('keyIssueId').populate('categoryId');

    let errorDataDetails = [];
    errorDataDetails = await ErrorDetails.find({
      taskId: req.body.taskId,
      companyId: taskDetails.companyId.id,
      year: {
        $in: currentYear
      },
      categoryId: taskDetails.categoryId.id,
      status: true
    }).populate('errorTypeId');
    let sourceTypeDetails = [];
    let companySourceDetails = await CompanySources.find({companyId: taskDetails.companyId.id});
    for (let sourceIndex = 0; sourceIndex < companySourceDetails.length; sourceIndex++) {
      sourceTypeDetails.push({
         sourceName: companySourceDetails[sourceIndex].name,
         value: companySourceDetails[sourceIndex].id,
         url: companySourceDetails[sourceIndex].sourceUrl,
         publicationDate: companySourceDetails[sourceIndex].publicationDate
      })      
    }
    if (req.body.memberType == 'Standalone') {
      let commentsDetails = await ErrorDetails.distinct('comments',{companyId: taskDetails.companyId.id, datapointId: req.body.datapointId});
      let currentAllStandaloneDetails = await StandaloneDatapoints.find({
          taskId: req.body.taskId,
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          year: {
            $in: currentYear
          },
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyAllStandaloneDetails = await StandaloneDatapoints.find({
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          year: {
            $nin: currentYear
          },
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyYear = _.uniqBy(historyAllStandaloneDetails, 'year');
      historyYear = _.orderBy(historyYear, 'year', 'desc');
      let datapointsObject = {
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        companyId: taskDetails.companyId.id,
        companyName: taskDetails.companyId.companyName,
        keyIssueId: dpTypeValues.keyIssueId.id,
        keyIssue: dpTypeValues.keyIssueId.keyIssueName,
        pillarId: dpTypeValues.categoryId.id,
        pillar: dpTypeValues.categoryId.categoryName,
        fiscalYear: taskDetails.year,
        comments: commentsDetails,
        currentData: [],
        historicalData: [],
        status: ''
      }
      let inputValues = [];
      if(dpTypeValues.dataType == 'Select'){        
       let inputs = dpTypeValues.unit.split('/');
       for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
         const element = {
           label: inputs[inputIndex],
           value: inputs[inputIndex]
         }
         inputValues.push(element);
       }
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
        let currentDatapointsObject = {};
        _.filter(currentAllStandaloneDetails, function (object) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : '';
           // if(object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex] && object.hasCorrection == false && object.hasError == false){
            currentDatapointsObject = {
              status: 'Completed',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYear[currentYearIndex],
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              inputValues:inputValues,
              textSnippet: object.textSnippet,
              pageNo: object.pageNumber,
              screenShot: object.screenShot,
              response: object.response,
              memberName: object.memberName,
              sourceList: sourceTypeDetails,
              source: {
                url: object.url ? object.url : '',
                sourceName: sourceName,
                value: sourceId,
                publicationDate: object.publicationDate ? object.publicationDate : ''
              },
              error: {
                hasError: object.hasError,
                refData: {                  
                  description: dpTypeValues.description,
                  dataType: dpTypeValues.dataType,
                  textSnippet: '',
                  pageNo: '',
                  screenShot: null,
                  response: '',
                  source: null,
                  additionalDetails:[]
                },
                comment: '',
                errorStatus: object.correctionStatus
              },
              comments: [],
              additionalDetails:[]
            }              
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                  let standaloneDetail = currentAllStandaloneDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '', label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '' };
                  } else {
                    currentValue = standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '';
                  }
                }
                currentDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })                
                currentDatapointsObject.error.refData.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }                
            }          
          datapointsObject.status = 'Completed';
        });
        datapointsObject.currentData.push(currentDatapointsObject);
      }
      let totalHistories = 0;
      if (historyYear.length > 5 ) {
        totalHistories = 5;
      } else{
        totalHistories = historyYear.length;
      }
      for (let historicalYearIndex = 0; historicalYearIndex < totalHistories; historicalYearIndex++) {
        let historicalDatapointsObject = {};
        _.filter(historyAllStandaloneDetails, function (object) {
          if (object.year == historyYear[historicalYearIndex].year) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
            historicalDatapointsObject = {
              status: 'Completed',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: object.year,
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              textSnippet: object.textSnippet,
              pageNo: object.pageNumber,
              screenShot: object.screenShot,
              response: object.response,
              standaradDeviation: object.standaradDeviation,
              average: object.average,
              sourceList: sourceTypeDetails,
              source: {
                url: object.url ? object.url : '',
                sourceName: sourceName,
                value: sourceId,
                publicationDate: object.publicationDate ? object.publicationDate : ''
              },
              error: {},
              comments: [],
              additionalDetails: []
            }
            for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
              if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                let optionValues = [], optionVal = '', currentValue;
                if(displayFields[dIndex].inputType == 'Select'){
                  let options = displayFields[dIndex].inputValues.split(',');
                  if(options.length > 0){
                    for (let optIndex = 0; optIndex < options.length; optIndex++) {
                      optionValues.push({
                        value: options[optIndex],
                        label: options[optIndex]
                      });                        
                    }
                  } else {
                    optionValues = [];
                  }
                } else {
                  optionVal = displayFields[dIndex].inputValues;
                }
                if(displayFields[dIndex].inputType == 'Static'){
                  currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                } else {
                  let standaloneDetail = historyAllStandaloneDetails.find((obj) => obj.year == historyYear[historicalYearIndex].year);
                  if(displayFields[dIndex].inputType == 'Select'){
                    currentValue = { value: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '', label: standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '' };
                  } else {
                    currentValue = standaloneDetail.additionalDetails ? standaloneDetail.additionalDetails[displayFields[dIndex].fieldName] : '';
                  }
                }
                historicalDatapointsObject.additionalDetails.push({
                  fieldName: displayFields[dIndex].fieldName,
                  name: displayFields[dIndex].name,
                  value: currentValue ? currentValue: '',
                  inputType: displayFields[dIndex].inputType,
                  inputValues: optionValues.length > 0 ? optionValues : optionVal
                })
              }                
            }
          }
        });
        datapointsObject.historicalData.push(historicalDatapointsObject);
      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        dpCodeData: datapointsObject
      });
    } else if (req.body.memberType == 'Board Matrix') {
      let commentsDetails = await ErrorDetails.distinct('comments',{companyId: taskDetails.companyId.id,datapointId: req.body.datapointId,memberName:req.body.memberName});
      let historyAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          memberName:req.body.memberName,
          year: {
            "$nin": currentYear
          },
          
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
      let historyYear = _.uniqBy(historyAllBoardMemberMatrixDetails, 'year');
      historyYear = _.orderBy(historyYear, 'year', 'desc');
      let currentAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          taskId: req.body.taskId,
          datapointId: req.body.datapointId,
          memberName:req.body.memberName,
          
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let boardDatapointsObject = {
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        companyId: taskDetails.companyId.id,
        companyName: taskDetails.companyId.companyName,
        keyIssueId: dpTypeValues.keyIssueId.id,
        keyIssue: dpTypeValues.keyIssueId.keyIssueName,
        pillarId: dpTypeValues.categoryId.id,
        pillar: dpTypeValues.categoryId.categoryName,
        fiscalYear: taskDetails.year,
        comments: commentsDetails,
        currentData: [],
        historicalData: [],
        status: ""
      }
      let inputValues = [];
      if(dpTypeValues.dataType == 'Select'){        
        let inputs = dpTypeValues.unit.split('/');
        for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
          const element = {
            label: inputs[inputIndex],
            value: inputs[inputIndex]
          }
          inputValues.push(element);
        }
      }
      let totalHistories = 0;
      if (historyYear.length > 5 ) {
        totalHistories = 5;
      } else{
        totalHistories = historyYear.length;
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(currentAllBoardMemberMatrixDetails, function (object) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
            currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  refData: {                  
                    description: dpTypeValues.description,
                    dataType: dpTypeValues.dataType,
                    textSnippet: '',
                    pageNo: '',
                    screenShot: null,
                    response: '',
                    source: null,
                    additionalDetails:[]
                  },
                  comment: '',
                  errorStatus: object.correctionStatus
                },
                comments: [],
                additionalDetails:[]
              } 
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = currentAllBoardMemberMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                  currentDatapointsObject.error.refData.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }        
             boardDatapointsObject.status = 'Completed';
          });
          boardDatapointsObject.currentData.push(currentDatapointsObject);        
      }
      for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories.length; hitoryYearIndex++) {
          let historicalDatapointsObject = {};
          _.filter(historyAllBoardMemberMatrixDetails, function (object) {
            if (object.year == historyYear[hitoryYearIndex].year && object.memberName == req.body.memberName) {
              let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
              let sourceName = sourceValues[0];
              let sourceId = sourceValues[1] ? sourceValues[1] : ''
              historicalDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: historyYear[hitoryYearIndex].year,
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                memberName: object.memberName,
                response: object.response,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = historyAllBoardMemberMatrixDetails.find((obj) => obj.year == historyYear[hitoryYearIndex].year);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  historicalDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }
            }
          });
          boardDatapointsObject.historicalData.push(historicalDatapointsObject);
      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        dpCodeData: boardDatapointsObject
      });
    } else if (req.body.memberType == 'KMP Matrix') {
      let commentsDetails = await ErrorDetails.distinct('comments',{companyId: taskDetails.companyId.id,datapointId: req.body.datapointId, memberName:req.body.memberName});

      let historyAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
          companyId: taskDetails.companyId.id,
          memberName: req.body.memberName,
          year: {
            "$nin": currentYear
          },
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyYear = _.uniqBy(historyAllKmpMatrixDetails, 'year');
      historyYear = _.orderBy(historyYear, 'year', 'desc');
      let currentAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
          taskId: req.body.taskId,
          datapointId:req.body.datapointId,
          memberName: req.body.memberName,
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
        //let currentYearValues = _.uniqBy(currentAllKmpMatrixDetails, 'year');

      let kmpDatapointsObject = {
        dpCode: dpTypeValues.code,
        dpCodeId: dpTypeValues.id,
        companyId: taskDetails.companyId.id,
        companyName: taskDetails.companyId.companyName,
        keyIssueId: dpTypeValues.keyIssueId.id,
        keyIssue: dpTypeValues.keyIssueId.keyIssueName,
        pillarId: dpTypeValues.categoryId.id,
        pillar: dpTypeValues.categoryId.categoryName,
        fiscalYear: taskDetails.year,
        comments: commentsDetails,
        currentData: [],
        historicalData: [],
        status: 'Yet to Start'
      }
      let inputValues = [];
      if(dpTypeValues.dataType == 'Select'){        
        let inputs = dpTypeValues.unit.split('/');
        for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
          const element = {
            label: inputs[inputIndex],
            value: inputs[inputIndex]
          }
          inputValues.push(element);
        }
      }
      let totalHistories = 0;
      if (historyYear.length > 5 ) {
        totalHistories = 5;
      } else{
        totalHistories = historyYear.length;
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(currentAllKmpMatrixDetails, function (object) {
            let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
            let sourceName = sourceValues[0];
            let sourceId = sourceValues[1] ? sourceValues[1] : ''
            currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                inputValues:inputValues,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  hasError: object.hasError,
                  refData: {                  
                    description: dpTypeValues.description,
                    dataType: dpTypeValues.dataType,
                    textSnippet: '',
                    pageNo: '',
                    screenShot: null,
                    response: '',
                    source: null,
                    additionalDetails:[]
                  },
                  comment: '',
                  errorStatus: object.correctionStatus
                },
                comments: [],
                additionalDetails:[]
              } 
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = currentAllKmpMatrixDetails.find((obj) => obj.year == currentYear[currentYearIndex]);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value:responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  currentDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  });                  
                  currentDatapointsObject.error.refData.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  });
                }
              } 
          });
          kmpDatapointsObject.currentData.push(currentDatapointsObject);
      }
      for (let hitoryYearIndex = 0; hitoryYearIndex < totalHistories.length; hitoryYearIndex++) {
        let boardMembersList = historyAllKmpMatrixDetails.filter(obj => obj.year == historyYear[hitoryYearIndex].year);
        let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
        for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {

          let historicalDatapointsObject = {};
          _.filter(historyAllKmpMatrixDetails, function (object) {
            if (object.datapointId.id == dpTypeValues.id && object.year == historyYear[hitoryYearIndex].year && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
              let sourceValues = object.sourceName ? object.sourceName.split(';') : "";
              let sourceName = sourceValues[0];
              let sourceId = sourceValues[1] ? sourceValues[1] : ''
              historicalDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: historyYear[hitoryYearIndex].year,
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                memberName: object.memberName,
                response: object.response,
                sourceList: sourceTypeDetails,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: sourceName,
                  value: sourceId,
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: [],
                additionalDetails: []
              }
              for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                  let optionValues = [], optionVal = '', currentValue;
                  if(displayFields[dIndex].inputType == 'Select'){
                    let options = displayFields[dIndex].inputValues.split(',');
                    if(options.length > 0){
                      for (let optIndex = 0; optIndex < options.length; optIndex++) {
                        optionValues.push({
                          value: options[optIndex],
                          label: options[optIndex]
                        });                        
                      }
                    } else {
                      optionValues = [];
                    }
                  } else {
                    optionVal = displayFields[dIndex].inputValues;
                  }
                  if(displayFields[dIndex].inputType == 'Static'){
                    currentValue = dpTypeValues[displayFields[dIndex].fieldName];
                  } else {
                    let responseDetails = historyAllKmpMatrixDetails.find((obj) => obj.year == historyYear[hitoryYearIndex].year);
                    if(displayFields[dIndex].inputType == 'Select'){
                      currentValue = { value: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '', label: responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '' };
                    } else {
                      currentValue = responseDetails.additionalDetails ? responseDetails.additionalDetails[displayFields[dIndex].fieldName] : '';
                    }
                  }
                  historicalDatapointsObject.additionalDetails.push({
                    fieldName: displayFields[dIndex].fieldName,
                    name: displayFields[dIndex].name,
                    value: currentValue ? currentValue: '',
                    inputType: displayFields[dIndex].inputType,
                    inputValues: optionValues.length > 0 ? optionValues : optionVal
                  })
                }
              }
            }
          });
          kmpDatapointsObject.historicalData.push(historicalDatapointsObject);
          //mergedKMPHistoryDetails = _.concat(historicalDatapointsObject, historicalDatapointsObject)
        }

      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        dpCodeData: kmpDatapointsObject
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}
export const uploadTaxonomyDatapoints = async (req, res, next) => {
  if (req.body.clientTaxonomyId && req.file) {
    try {
      let allSheetsObject = [];
      const filePath = req.file.path;
      var workbook = XLSX.readFile(filePath, {
        sheetStubs: false,
        defval: ''
      });
      var sheet_name_list = workbook.SheetNames;
      sheet_name_list.forEach(function (currentSheetName) {
        var worksheet = workbook.Sheets[currentSheetName];
        try {
          var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, {
            defval: " "
          });
          allSheetsObject.push(sheetAsJson);
        } catch (error) {
          return res.status(400).json({
            message: error.message
          })
        }
      });
      let newDatapoints = [], headerNameList = [];
      await ClientTaxonomy.findOne({ _id: req.body.clientTaxonomyId })
        .populate('fields.id')
        .then((clientTaxonomies) => {
          if (clientTaxonomies) {
            for (let nameIndex = 0; nameIndex < clientTaxonomies.fields.length; nameIndex++) {
              const fieldNameObject = clientTaxonomies.fields[nameIndex];
              headerNameList.push({
                "aliasName": fieldNameObject.name ? fieldNameObject.name : '',
                "masterName": fieldNameObject.id.name ? fieldNameObject.id.name : '',
                "headerId": fieldNameObject.id.id ? fieldNameObject.id.id : '',
                "fieldName": fieldNameObject.id.fieldName ? fieldNameObject.id.fieldName : ''
              });
            }
          }
        });
      if (headerNameList.length >= 22) {
        if (allSheetsObject.length > 0) {
          for (let objIndex = 0; objIndex < allSheetsObject.length; objIndex++) {
            const rowObjects = allSheetsObject[objIndex];
            if (rowObjects.length > 0) {
              let newDpObjectToPush = {};
              newDpObjectToPush["clientTaxonomyId"] = req.body.clientTaxonomyId;
              newDpObjectToPush["createdAt"] = Date.now();
              newDpObjectToPush["updatedAt"] = Date.now();
              newDpObjectToPush["updatedBy"] = req.user ? req.user : null;
              for (let rindex = 0; rindex < rowObjects.length; rindex++) {
                const rowObject = rowObjects[rindex];
                for (let hIndex = 0; hIndex < headerNameList.length; hIndex++) {
                  const headerObject = headerNameList[hIndex];
                  if (headerObject.fieldName == "categoryId") {
                    //find in allCategories
                    let categoryObject = allCategories.find((rec) => rec.categoryName === rowObject[headerObject.aliasName])
                    if (categoryObject && categoryObject.id) {
                      newDpObjectToPush[headerObject.fieldName] = categoryObject.id;
                    } else {
                      return res.status(400).json({
                        status: "400",
                        message: `Invalid value for ${headerObject.aliasName} as ${rowObject[headerObject.aliasName]}, please check!`
                      });
                    }
                  } else if (headerObject.fieldName == "functionId") {
                    //find in allFunctions
                    let functionObject = allFunctions.find((rec) => rec.functionType === rowObject[headerObject.aliasName])
                    if (functionObject && functionObject.id) {
                      newDpObjectToPush[headerObject.fieldName] = functionObject.id;
                    } else {
                      return res.status(400).json({
                        status: "400",
                        message: `Invalid value for ${headerObject.aliasName} as ${rowObject[headerObject.aliasName]}, please check!`
                      });
                    }
                  } else if (headerObject.fieldName == "keyIssueId") {
                    //find in allKeyIssues
                    let keyIssueObject = allKeyIssues.find((rec) => rec.keyIssueName === rowObject[headerObject.aliasName])
                    if (keyIssueObject && keyIssueObject.id) {
                      newDpObjectToPush[headerObject.fieldName] = keyIssueObject.id;
                    } else {
                      return res.status(400).json({
                        status: "400",
                        message: `Invalid value for ${headerObject.aliasName} as ${rowObject[headerObject.aliasName]}, please check!`
                      });
                    }
                  } else {
                    newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.aliasName];
                  }
                }
                newDatapoints.push(newDpObjectToPush);
              }
              await Datapoints.insertMany(newDatapoints)
                .then((err, result) => {
                  if (err) {
                    console.log('error', err);
                  } else {
                    //  console.log('result', result);
                  }
                });
              return res.status(200).json({
                status: "200",
                message: "Datapoint uploaded successfully!",
                data: newDatapoints
              });
            } else {
              return res.status(400).json({
                status: "400",
                message: "No values present in the uploaded file, please check!"
              });
            }
          }
        } else {
          return res.status(400).json({
            status: "400",
            message: "No values present in the uploaded file, please check!"
          });
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "Missing mandatory fields, please check!"
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "500",
        message: error.message
      });
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "Missing fields in payload"
    });
  }
}
async function storeDatapointsFile(onboardingBase64Image, folderName) {
  console.log('in function storeDatapointsFile')
  return new Promise(function (resolve, reject) {
    let base64File = onboardingBase64Image.split(';base64,').pop();
    fileType.fromBuffer((Buffer.from(base64File, 'base64'))).then(function (res) {
      let fileName = 'datapoint' + '_' + Date.now() + '.' + res.ext;
      console.log('__dirname', __dirname);
      var filePath = path.join(__dirname, 'uploads/') + fileName;
      console.log('filePath', filePath);
      fs.writeFile(filePath, base64File, {
        encoding: 'base64'
      }, function (err) {
        if (err) {
          console.log('error while storing file', err);
          reject(err);
        } else {
          console.log('File created');
          resolve(fileName);
        }
      });
    }).catch(function (err) {
      console.log('err', err);
      reject(err);
    })
  })
}

export const uploadNewTaxonomyDatapoints = async (req, res, next) => {
  if (req.body.clientTaxonomyId && req.file) {
    try {
      let allSheetsObject = [];
      const filePath = req.file.path;
      var workbook = XLSX.readFile(filePath, {
        sheetStubs: false,
        defval: ''
      });
      var sheet_name_list = workbook.SheetNames;
      sheet_name_list.forEach(function (currentSheetName) {
        var worksheet = workbook.Sheets[currentSheetName];
        try {
          var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, {
            defval: " "
          });
          allSheetsObject.push(sheetAsJson);
        } catch (error) {
          return res.status(400).json({
            message: error.message
          })
        }
      });
      let newDatapoints = [], masterLevelMandatoryNamesList = [], masterLevelOptionalNamesList = [], additionalFieldNamesList = [];
      let newCategoriesList = [], newThemesList = [], newKeyIssuesList = [], newFunctionsList = [];
      await ClientTaxonomy.findOne({ _id: req.body.clientTaxonomyId })
        .then(async(clientTaxonomies) => {
          if (clientTaxonomies) {
            for (let nameIndex = 0; nameIndex < clientTaxonomies.fields.length; nameIndex++) {
              const fieldNameObject = clientTaxonomies.fields[nameIndex];
              let taxonomyDetail = await Taxonomies.findOne({ "fieldName": fieldNameObject.fieldName ? fieldNameObject.fieldName : "", "status": true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to find the taxonomy detail!" }) });
              if (taxonomyDetail) {
                if (taxonomyDetail.isRequired && fieldNameObject.inputType == "Static" && fieldNameObject.applicableFor != 'Only Controversy') {
                  masterLevelMandatoryNamesList.push({
                    "name": fieldNameObject.name ? fieldNameObject.name : '',
                    "fieldName": fieldNameObject.fieldName ? fieldNameObject.fieldName : ''
                  });
                } else {
                  if (
                    fieldNameObject.fieldName == 'dataType' ||
                    fieldNameObject.fieldName == 'unit' ||
                    fieldNameObject.fieldName == 'polarity' ||
                    fieldNameObject.fieldName == 'percentile' ||
                    fieldNameObject.fieldName == 'normalizedBy' ||
                    fieldNameObject.fieldName == 'weighted' ||
                    fieldNameObject.fieldName == 'reference' ||
                    fieldNameObject.fieldName == 'dataCollectionGuide' ||
                    fieldNameObject.fieldName == 'industryRelevant'
                  ) {
                    masterLevelOptionalNamesList.push({
                      "name": fieldNameObject.name ? fieldNameObject.name : '',
                      "fieldName": fieldNameObject.fieldName ? fieldNameObject.fieldName : ''
                    });
                  } else if (!taxonomyDetail.isRequired && fieldNameObject.inputType == "Static" && fieldNameObject.applicableFor != 'Only Controversy') {
                    additionalFieldNamesList.push({
                      "name": fieldNameObject.name ? fieldNameObject.name : '',
                      "fieldName": fieldNameObject.fieldName ? fieldNameObject.fieldName : ''
                    });
                  }
                }                
              }
            }
          }
        });
      if (allSheetsObject.length > 0) {
        for (let objIndex = 0; objIndex < allSheetsObject.length; objIndex++) {
          const rowObjects = allSheetsObject[objIndex];
          if (rowObjects.length > 0) {
            for (let rindex = 0; rindex < rowObjects.length; rindex++) {
              let newDpObjectToPush = {};
              newDpObjectToPush["clientTaxonomyId"] = req.body.clientTaxonomyId;
              newDpObjectToPush["additionalDetails"] = {};
              newDpObjectToPush["createdAt"] = Date.now();
              newDpObjectToPush["updatedAt"] = Date.now();
              newDpObjectToPush["updatedBy"] = req.user ? req.user : null;
              let newCategoryObject = {
                clientTaxonomyId: req.body.clientTaxonomyId ? req.body.clientTaxonomyId : null,
                categoryName: '',
                categoryCode: '',
                categoryDescription: '',
                status: true
              };
              let newThemeObject = {
                categoryId: '',
                themeName: '',
                themeCode: '',
                themeDescription: '',
                status: true
              };
              let newKeyIssueObject = {
                themeId: '',
                keyIssueName: '',
                keyIssueCode: '',
                keyIssueDescription: '',
                status: true
              };
              let newFunctionObject = {
                functionType: '',
                status: true
              };
              const rowObject = rowObjects[rindex];
              for (let mlmIndex = 0; mlmIndex < masterLevelMandatoryNamesList.length; mlmIndex++) {
                const headerObject = masterLevelMandatoryNamesList[mlmIndex];
                if (headerObject.fieldName == "categoryName") {
                  newDpObjectToPush.categoryId = rowObject[headerObject.name];
                  newCategoryObject.categoryName = rowObject[headerObject.name];
                  newThemeObject.categoryId = rowObject[headerObject.name];
                } else if (headerObject.fieldName == "categoryCode") {
                  newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.name];
                  newCategoryObject.categoryCode = rowObject[headerObject.name];
                } else if (headerObject.fieldName == "themeName") {
                  newDpObjectToPush.themeId = rowObject[headerObject.name];
                  newThemeObject.themeName = rowObject[headerObject.name];
                  newKeyIssueObject.themeId = rowObject[headerObject.name];
                } else if (headerObject.fieldName == "themeCode") {
                  newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.name];
                  newThemeObject.themeCode = rowObject[headerObject.name];
                } else if (headerObject.fieldName == "keyIssueName") {
                  newDpObjectToPush.keyIssueId = rowObject[headerObject.name];
                  newKeyIssueObject.keyIssueName = rowObject[headerObject.name];
                } else if (headerObject.fieldName == "keyIssueCode") {
                  newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.name];
                  newKeyIssueObject.keyIssueCode = rowObject[headerObject.name];
                } else if (headerObject.fieldName == "functionType") {
                  newDpObjectToPush.functionId = rowObject[headerObject.name];
                  newFunctionObject.functionType = rowObject[headerObject.name];
                } else {
                  newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.name];
                }
              }
              for (let mloIndex = 0; mloIndex < masterLevelOptionalNamesList.length; mloIndex++) {
                const headerObject = masterLevelOptionalNamesList[mloIndex];
                newDpObjectToPush[headerObject.fieldName] = rowObject[headerObject.name] ? rowObject[headerObject.name] : '';
              }
              for (let addFieldIndex = 0; addFieldIndex < additionalFieldNamesList.length; addFieldIndex++) {
                const headerObject = additionalFieldNamesList[addFieldIndex];
                newDpObjectToPush["additionalDetails"][headerObject.fieldName] = rowObject[headerObject.name] ? rowObject[headerObject.name] : '';
              }
              newDatapoints.push(newDpObjectToPush);
              newCategoriesList.push(newCategoryObject);
              newThemesList.push(newThemeObject);
              newKeyIssuesList.push(newKeyIssueObject);
              newFunctionsList.push(newFunctionObject);
            }
            let uniqCategories = _.uniqBy(newCategoriesList, 'categoryName');
            let uniqThemes = _.uniqBy(newThemesList, 'themeName');
            let uniqKeyIssues = _.uniqBy(newKeyIssuesList, 'keyIssueName');
            let uniqFunctions = _.uniqBy(newFunctionsList, 'functionType');
            if (uniqCategories.length > 0) {
              for (let unqCatIndex = 0; unqCatIndex < uniqCategories.length; unqCatIndex++) {
                uniqCategories[unqCatIndex].createdAt = Date.now();
                uniqCategories[unqCatIndex].updatedAt = Date.now();
                await Categories.updateOne({
                  clientTaxonomyId: req.body.clientTaxonomyId,
                  categoryName: uniqCategories[unqCatIndex].categoryName ? uniqCategories[unqCatIndex].categoryName : '',
                  status: true
                }, { $set: uniqCategories[unqCatIndex] }, { upsert: true })
                .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new category!' }) });
              }
            }
            let newlyCreatedCategories = await Categories.find({ clientTaxonomyId: req.body.clientTaxonomyId, status: true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Categories not found!' }) });
            if (newlyCreatedCategories.length > 0) {
              for (let newCatIndex = 0; newCatIndex < newlyCreatedCategories.length; newCatIndex++) {
                uniqThemes.find(obj => {
                  if(obj.categoryId === newlyCreatedCategories[newCatIndex].categoryName){
                    obj.categoryId = newlyCreatedCategories[newCatIndex].id
                  }
                });
                newDatapoints.find(obj => {
                  if(obj.categoryId === newlyCreatedCategories[newCatIndex].categoryName){
                    obj.categoryId = newlyCreatedCategories[newCatIndex].id;
                  }
                });
              }
              if (uniqThemes.length > 0) {
                for (let unqThmIndex = 0; unqThmIndex < uniqThemes.length; unqThmIndex++) {
                  uniqThemes[unqThmIndex].createdAt = Date.now();
                  uniqThemes[unqThmIndex].updatedAt = Date.now();              
                  await Themes.updateOne({
                    categoryId: uniqThemes[unqThmIndex].categoryId,
                    themeName: uniqThemes[unqThmIndex].themeName ? uniqThemes[unqThmIndex].themeName : '',
                    status: true
                  }, { $set: uniqThemes[unqThmIndex] }, { upsert: true })
                  .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new theme!' }) });
                }
              }
              for (let newCatIndex = 0; newCatIndex < newlyCreatedCategories.length; newCatIndex++) {
                uniqThemes.find(obj => {
                  if(obj.categoryId === newlyCreatedCategories[newCatIndex].categoryName){
                    obj.categoryId = newlyCreatedCategories[newCatIndex].id;
                  }
                });
                for (let newThemeIndex = 0; newThemeIndex < uniqThemes.length; newThemeIndex++) {
                  let themeDetail = await Themes.findOne({ categoryId: newlyCreatedCategories[newCatIndex].id, themeName: uniqThemes[newThemeIndex].themeName, status: true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Theme not found!' }) });
                  uniqKeyIssues.find(obj => {
                    if(newlyCreatedCategories[newCatIndex].id === uniqThemes[newThemeIndex].categoryId && obj.themeId === uniqThemes[newThemeIndex].themeName){
                      obj.themeId = themeDetail ? themeDetail.id : null;
                    }
                  });
                  newDatapoints.find(obj => {
                    if(obj.themeId === uniqThemes[newThemeIndex].themeName){
                      obj.themeId = themeDetail ? themeDetail.id : null;
                    }
                  });
                }
              }
              
              if (uniqKeyIssues.length > 0) {
                for (let unqKeyIndex = 0; unqKeyIndex < uniqKeyIssues.length; unqKeyIndex++) {
                  uniqKeyIssues[unqKeyIndex].createdAt = Date.now();
                  uniqKeyIssues[unqKeyIndex].updatedAt = Date.now();
                  await KeyIssues.updateOne({
                    themeId: uniqKeyIssues[unqKeyIndex].themeId,
                    keyIssueName: uniqKeyIssues[unqKeyIndex].keyIssueName ? uniqKeyIssues[unqKeyIndex].keyIssueName : '',
                    status: true
                  }, { $set: uniqKeyIssues[unqKeyIndex] }, { upsert: true })
                  .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new key issue!' }) });
                }
              }
              
              for (let newCatIndex = 0; newCatIndex < newlyCreatedCategories.length; newCatIndex++) {
                for (let newThemeIndex = 0; newThemeIndex < uniqThemes.length; newThemeIndex++) {
                  for (let newKeyIssueIndex = 0; newKeyIssueIndex < uniqKeyIssues.length; newKeyIssueIndex++) {
                    let keyIssueDetail = await KeyIssues.findOne({ themeId: uniqKeyIssues[newKeyIssueIndex].themeId, keyIssueName: uniqKeyIssues[newKeyIssueIndex].keyIssueName, status: true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Key Issue not found!' }) });
                    newDatapoints.find(obj => {
                      if(obj.keyIssueId === uniqKeyIssues[newKeyIssueIndex].keyIssueName){
                        obj.keyIssueId = keyIssueDetail ? keyIssueDetail.id : null;
                      }
                    });
                  }
                }
              }
              if (uniqFunctions.length > 0) {
                for (let fIndex = 0; fIndex < uniqFunctions.length; fIndex++) {
                  uniqFunctions[fIndex].createdAt = Date.now();
                  uniqFunctions[fIndex].updatedAt = Date.now();
                  await Functions.updateOne({
                    functionType: uniqFunctions[fIndex].functionType ? uniqFunctions[fIndex].functionType : '',
                    status: true
                  }, { $set: uniqFunctions[fIndex] }, { upsert: true })
                  .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new function!' }) });
                }
              }
              for (let newCatIndex = 0; newCatIndex < newlyCreatedCategories.length; newCatIndex++) {
                for (let newFunctionIndex = 0; newFunctionIndex < uniqFunctions.length; newFunctionIndex++) {
                  let functionDetail = await Functions.findOne({ functionType: uniqFunctions[newFunctionIndex].functionType, status: true }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Function not found!' }) });
                  newDatapoints.find(obj => {
                    if(obj.functionId === uniqFunctions[newFunctionIndex].functionType){
                      obj.functionId = functionDetail ? functionDetail.id : null;
                    }
                  });
                }
              }
            }
              
            if (newDatapoints.length > 0) {
              for (let unqCatIndex = 0; unqCatIndex < newDatapoints.length; unqCatIndex++) {
                await Datapoints.updateOne({
                  clientTaxonomyId: req.body.clientTaxonomyId,
                  categoryId: newDatapoints[unqCatIndex].categoryId,
                  themeId: newDatapoints[unqCatIndex].themeId,
                  keyIssueId: newDatapoints[unqCatIndex].keyIssueId,
                  functionId: newDatapoints[unqCatIndex].functionId,
                  code: newDatapoints[unqCatIndex].code ? newDatapoints[unqCatIndex].code : '',
                  status: true
                }, { $set: newDatapoints[unqCatIndex] }, { upsert: true })
                .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new datapoint!' }) });
              }
            }
            return res.status(200).json({
              status: "200",
              message: "Datapoint uploaded successfully!",
              data: newDatapoints
            });
          } else {
            return res.status(400).json({
              status: "400",
              message: "No values present in the uploaded file, please check!"
            });
          }
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "No values present in the uploaded file, please check!"
        });
      }
    } catch (error) {
      console.log('error', error);
      console.log('error.message', error.message);
      return res.status(500).json({
        status: "500",
        message: error.message
      });
    }
  } else {
    return res.status(400).json({
      status: "400",
      message: "Missing fields in payload"
    });
  }
}

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Datapoints.findById(params.id)
  .populate('updatedBy')
  .populate('categoryId')
  .populate('keyIssueId')
  .populate('functionId')
  .then(notFound(res))
  .then(authorOrAdmin(res, user, 'updatedBy'))
  .then((datapoints) => datapoints ? Object.assign(datapoints, body).save() : null)
  .then((datapoints) => datapoints ? datapoints.view(true) : null)
  .then(success(res))
  .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Datapoints.findById(params.id)
  .then(notFound(res))
  .then(authorOrAdmin(res, user, 'updatedBy'))
  .then((datapoints) => datapoints ? datapoints.remove() : null)
  .then(success(res, 204))
  .catch(next)
