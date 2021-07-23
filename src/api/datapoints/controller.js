import _ from 'lodash'
import XLSX from 'xlsx'
import * as fs from 'fs'
import {
  success,
  notFound,
  authorOrAdmin
} from '../../services/response/'
import {
  Datapoints
} from '.'
import {
  StandaloneDatapoints
} from '../standalone_datapoints'
import {
  BoardMembersMatrixDataPoints
} from '../boardMembersMatrixDataPoints'
import {
  KmpMatrixDataPoints
} from '../kmpMatrixDataPoints'
import {
  ClientTaxonomy
} from '../clientTaxonomy'
import {
  Categories
} from '../categories'
import {
  KeyIssues
} from '../key_issues'
import {
  Functions
} from '../functions'
import {
  TaskAssignment
} from '../taskAssignment'
import {
  ErrorDetails
} from '../errorDetails'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp'

export const create = ({
    user,
    bodymen: {
      body
    }
  }, res, next) =>
  Datapoints.create({
    ...body,
    updatedBy: user
  })
  .then((datapoints) => datapoints.view(true))
  .then(success(res, 201))
  .catch(next)

export const index = ({
    querymen: {
      query,
      select,
      cursor
    }
  }, res, next) =>
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

export const show = ({
    params
  }, res, next) =>
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
    }).populate('companyId');
    console.log(taskDetails)
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });
    // search negative news function 
    let currentYear = taskDetails.year.split(",");
    let dpTypeValues = await Datapoints.find({
      relevantForIndia: "Yes",
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
      clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
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
    let historyYear = _.uniqBy(historyAllStandaloneDetails, 'year');
    currentAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
        taskId: req.body.taskId,
        year: {
          "$in": currentYear
        },
        memberStatus: true,
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
        memberStatus: true,
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    currentAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
      taskId: req.body.taskId,
      year: {
          "$in": currentYear
        },
        memberStatus: true,
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
        memberStatus: true,
        status: true
      }).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId');
    console.log(taskDetails.taskStatus == 'Collection' );
   // if (taskDetails.taskStatus == 'Yet to start') {
      if (dpTypeValues.length > 0) {
        if (dpTypeValues.length > 1) {
          for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
            let keyIssuesCollection = await Datapoints.find({
              relevantForIndia: "Yes",
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
              clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
              categoryId: taskDetails.categoryId,
              status: true
            }).populate('keyIssueId');
            let dpTypeDatapoints = await Datapoints.find({
              relevantForIndia: "Yes",
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
              clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
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
              let boardMemberEq = await BoardMembers.find({companyId: taskDetails.companyId.id, endDate:""});
              let boardMemberGt = await BoardMembers.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{"$gt":1626944582}});
              let mergeBoardMemberList = _.merge(boardMemberEq,boardMemberGt);
                for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                  let boardNameValue = {
                    label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                    value: mergeBoardMemberList[boardMemberNameListIndex].id
                  }
                  boardDpCodesData.boardMemberList.push(boardNameValue);
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
                    fiscalYear: taskDetails.year,
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
            } else if (dpTypeValues[dpTypeIndex] == 'KMP Matrix') {
              let kmpMemberEq = await Kmp.find({companyId: taskDetails.companyId.id, endDate:""});
              let kmpMemberGt = await Kmp.find({companyId: taskDetails.companyId.id,endDateTimeStamp:{"$gt":1626944582}});
              let mergeKmpMemberList = _.merge(kmpMemberEq,kmpMemberGt);
                for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                  let kmpNameValue = {
                    label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                    value: mergeKmpMemberList[kmpMemberNameListIndex].id
                  }
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
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
                    fiscalYear: taskDetails.year,
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
                  fiscalYear: taskDetails.year,
                  status: 'yet to Start'
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
          console.log(boardDpCodesData, kmpDpCodesData, dpCodesData);

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
              relevantForIndia: "Yes",
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
          console.log(dpCodesData);

          return res.status(200).send({
            status: "200",
            message: "Data collection dp codes retrieved successfully!",
            keyIssuesList: keyIssuesList,
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
    // } else if(taskDetails.taskStatus == 'Correction') {
    //   console.log(taskDetails.taskStatus == 'Collection' );
    //   if (dpTypeValues.length > 1) {
    //     for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
    //       if (dpTypeValues[dpTypeIndex] == 'Board Matrix') {

    //         for (let currentBoardMemYearIndex = 0; currentBoardMemYearIndex < currentYear.length; currentBoardMemYearIndex++) {
    //           // let boardNameList = {
    //           //   year: currentYear[currentBoardMemYearIndex],
    //           //   memberName: []
    //           // }
    //           let boardMembersList = currentAllBoardMemberMatrixDetails.filter(obj => obj.year == currentYear[currentBoardMemYearIndex]);
    //           let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
    //           for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < boardMemberNameList.length; boardMemberNameListIndex++) {
    //             let boardNameValue = {
    //               label: boardMemberNameList[boardMemberNameListIndex].memberName,
    //               value: boardMemberNameList[boardMemberNameListIndex].memberName
    //             }
    //             boardDpCodesData.boardMemberList.push(boardNameValue);
    //           }

    //         }
    //         let errorboardDatapoints = await BoardMembersMatrixDataPoints.find({
    //           taskId: req.params.taskId,
    //           hasError: true,
    //           status: true
    //         }).populate([{
    //           path: 'datapointId',
    //           populate: {
    //             path: 'categoryId'
    //           },
    //           populate: {
    //             path: 'keyIssueId'
    //           }
    //         }]);
    //         for (let errorDpIndex = 0; errorDpIndex < errorboardDatapoints.length; errorDpIndex++) {
    //           for (let boarMemberListIndex = 0; boarMemberListIndex < boardDpCodesData.boardMemberList.length; boarMemberListIndex++) {

    //             let boardDatapointsObject = {
    //               dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
    //               dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
    //               companyId: taskDetails.companyId.id,
    //               companyName: taskDetails.companyId.companyName,
    //               keyIssueId: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //               keyIssue: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //               pillarId: errorboardDatapoints[errorDpIndex].datapointId.categoryId.id,
    //               pillar: errorboardDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //               fiscalYear: taskDetails.year,
    //               memberName: boardDpCodesData.boardMemberList[boarMemberListIndex].label,
    //               currentData: [],
    //               historicalData: [],
    //               status: ""
    //             }

    //             for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //               let currentDatapointsObject = {};
    //               _.filter(errorboardDatapoints, function (object) {
    //                 if (object.datapointId.id == errorboardDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.hasError == true) {

    //                   let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorboardDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //                   currentDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: currentYear[currentYearIndex],
    //                     description: errorboardDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorboardDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     response: object.response,
    //                     memberName: object.memberName,
    //                     hasError: object.hasError,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {
    //                       errorType: {
    //                         label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                         value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                       },
    //                       errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                       errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
    //                     },
    //                     comments: []
    //                   }
    //                   boardDatapointsObject.currentData.push(currentDatapointsObject);
    //                 }
    //               })

    //             }

    //             for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //               let historicalDatapointsObject = {};
    //               _.filter(errorboardDatapoints, function (object) {
    //                 if (object.datapointId.id == errorboardDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year) {
    //                   historicalDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: historyYear[hitoryYearIndex].year,
    //                     description: errorboardDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorboardDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     response: object.response,
    //                     standaradDeviation: object.standaradDeviation,
    //                     average: object.average,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {},
    //                     comments: []
    //                   }
    //                   boardDatapointsObject.historicalData.push(historicalDatapointsObject);
    //                 }
    //               });
    //             }

    //           }

    //         }
    //       } else if (dpTypeValues[dpTypeIndex] == 'KMP Matrix') {
    //         for (let currentkmpMemYearIndex = 0; currentkmpMemYearIndex < currentYear.length; currentkmpMemYearIndex++) {

    //           let kmpMembersList = currentAllKmpMatrixDetails.filter(obj => obj.year == currentYear[currentkmpMemYearIndex]);
    //           let kmpMemberNameList = _.uniqBy(kmpMembersList, 'memberName');
    //           for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < kmpMemberNameList.length; kmpMemberNameListIndex++) {
    //             let kmpNameValue = {
    //               label: kmpMemberNameList[kmpMemberNameListIndex].memberName,
    //               value: kmpMemberNameList[kmpMemberNameListIndex].memberName
    //             }
    //             kmpDpCodesData.kmpMemberList.push(kmpNameValue);
    //           }

    //         }
    //         let errorkmpDatapoints = await BoardMembersMatrixDataPoints.find({
    //           taskId: req.params.taskId,
    //           hasError: true,
    //           status: true
    //         }).populate([{
    //           path: 'datapointId',
    //           populate: {
    //             path: 'categoryId'
    //           },
    //           populate: {
    //             path: 'keyIssueId'
    //           }
    //         }]);
    //         for (let errorDpIndex = 0; errorDpIndex < errorkmpDatapoints.length; errorDpIndex++) {
    //           for (let kmpMemberListIndex = 0; kmpMemberListIndex < kmpDpCodesData.kmpMemberList.length; kmpMemberListIndex++) {

    //             let kmpDatapointsObject = {
    //               dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
    //               dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
    //               companyId: taskDetails.companyId.id,
    //               companyName: taskDetails.companyId.companyName,
    //               keyIssueId: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //               keyIssue: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //               pillarId: errorkmpDatapoints[errorDpIndex].datapointId.categoryId.id,
    //               pillar: errorkmpDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //               fiscalYear: taskDetails.year,
    //               memberName: kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label,
    //               currentData: [],
    //               historicalData: [],
    //               status: ''
    //             }
    //             for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //               let currentDatapointsObject = {};
    //               _.filter(errorkmpDatapoints, function (object) {
    //                 if (object.datapointId.id == errorkmpDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.memberName == kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label && object.hasError == true) {
    //                   let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorkmpDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //                   currentDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: currentYear[currentYearIndex],
    //                     description: errorkmpDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorkmpDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     response: object.response,
    //                     memberName: object.memberName,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {
    //                       errorType: {
    //                         label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                         value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                       },
    //                       errorComments: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                       errorStatus: errorDetailsObject[0].errorStatus ? errorDetailsObject[0].errorStatus : ''
    //                     },
    //                     comments: []
    //                   }
    //                   kmpDatapointsObject.status = 'Completed'
    //                   kmpDatapointsObject.currentData.push(currentDatapointsObject);
    //                 }
    //               });
    //             }
    //             for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //               let historicalDatapointsObject = {};
    //               _.filter(historyAllKmpMatrixDetails, function (object) {
    //                 if (object.datapointId.id == errorkmpDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year && object.memberName == kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label) {
    //                   historicalDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: historyYear[hitoryYearIndex].year,
    //                     description: errorkmpDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorkmpDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     memberName: object.memberName,
    //                     response: object.response,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {},
    //                     comments: []
    //                   }
    //                   kmpDatapointsObject.historicalData.push(historicalDatapointsObject);
    //                 }
    //               });
    //             }
    //             kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);

    //           }
    //         }
    //       } else if (dpTypeValues[dpTypeIndex] == 'Standalone') {

    //         let errorDatapoints = await StandaloneDatapoints.find({
    //           taskId: req.params.taskId,
    //           hasError: true,
    //           status: true
    //         }).populate([{
    //           path: 'datapointId',
    //           populate: {
    //             path: 'categoryId'
    //           },
    //           populate: {
    //             path: 'keyIssueId'
    //           }
    //         }]);
    //         for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

    //           let datapointsObject = {
    //             dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //             dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //             companyId: taskDetails.companyId.id,
    //             companyName: taskDetails.companyId.companyName,
    //             keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //             keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //             pillarId: errorDatapoints[errorDpIndex].datapointId.categoryId.id,
    //             pillar: errorDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //             fiscalYear: taskDetails.year,
    //             currentData: [],
    //             historicalData: [],
    //             status: ''
    //           }
    //           for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //             let currentDatapointsObject = {};
    //             _.filter(errorDatapoints, function (object) {
    //               if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.hasError == true) {

    //                 let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //                 currentDatapointsObject = {
    //                   status: 'Completed',
    //                   dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                   dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                   fiscalYear: currentYear[currentYearIndex],
    //                   description: errorDatapoints[errorDpIndex].datapointId.description,
    //                   dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                   textSnippet: object.textSnippet,
    //                   pageNo: object.pageNumber,
    //                   screenShot: object.screenShot,
    //                   response: object.response,
    //                   memberName: object.memberName,
    //                   hasError: object.hasError,
    //                   source: {
    //                     url: object.url ? object.url : '',
    //                     sourceName: object.sourceName ? object.sourceName : '',
    //                     publicationDate: object.publicationDate ? object.publicationDate : ''
    //                   },
    //                   error: {
    //                     errorType: {
    //                       label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                       value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                     },
    //                     errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                     errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
    //                   },
    //                   comments: []
    //                 }
    //                 datapointsObject.currentData.push(currentDatapointsObject);
    //               }
    //             });
    //           }

    //           for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //             let historicalDatapointsObject = {};
    //             _.filter(errorDatapoints, function (object) {
    //               if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year) {
    //                 historicalDatapointsObject = {
    //                   status: 'Completed',
    //                   dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                   dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                   fiscalYear: historyYear[hitoryYearIndex].year,
    //                   description: errorDatapoints[errorDpIndex].datapointId.description,
    //                   dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                   textSnippet: object.textSnippet,
    //                   pageNo: object.pageNumber,
    //                   screenShot: object.screenShot,
    //                   response: object.response,
    //                   standaradDeviation: object.standaradDeviation,
    //                   average: object.average,
    //                   source: {
    //                     url: object.url ? object.url : '',
    //                     sourceName: object.sourceName ? object.sourceName : '',
    //                     publicationDate: object.publicationDate ? object.publicationDate : ''
    //                   },
    //                   error: {},
    //                   comments: []
    //                 }
    //                 datapointsObject.historicalData.push(historicalDatapointsObject);
    //               }
    //             });
    //           }
    //           dpCodesData.push(datapointsObject);

    //         }

    //       }
    //       return res.status(200).send({
    //         status: "200",
    //         message: "Data correction dp codes retrieved successfully!",
    //         standalone: {
    //           dpCodesData: dpCodesData
    //         },
    //         boardMatrix: boardDpCodesData,
    //         kmpMatrix: kmpDpCodesData

    //       });

    //     }

    //   } else {
    //     try {
    //       let errorDatapoints = await StandaloneDatapoints.find({
    //         taskId: req.params.taskId,
    //         hasError: true,
    //         status: true
    //       }).populate([{
    //         path: 'datapointId',
    //         populate: {
    //           path: 'categoryId'
    //         },
    //         populate: {
    //           path: 'keyIssueId'
    //         }
    //       }]);
    //       console.log(errorDatapoints)
    //       for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

    //         let datapointsObject = {
    //           dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //           dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //           companyId: taskDetails.companyId.id,
    //           companyName: taskDetails.companyId.companyName,
    //           keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //           keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //           pillarId: errorDatapoints[errorDpIndex].datapointId.categoryId.id,
    //           pillar: errorDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //           fiscalYear: taskDetails.year,
    //           currentData: [],
    //           historicalData: [],
    //           status: ''
    //         }
    //         for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //           let currentDatapointsObject = {};
    //           _.filter(errorDatapoints, function (object) {
    //             if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.hasError == true) {

    //               let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //               currentDatapointsObject = {
    //                 status: 'Completed',
    //                 dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                 dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                 fiscalYear: currentYear[currentYearIndex],
    //                 description: errorDatapoints[errorDpIndex].datapointId.description,
    //                 dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                 textSnippet: object.textSnippet,
    //                 pageNo: object.pageNumber,
    //                 screenShot: object.screenShot,
    //                 response: object.response,
    //                 memberName: object.memberName,
    //                 hasError: object.hasError,
    //                 source: {
    //                   url: object.url ? object.url : '',
    //                   sourceName: object.sourceName ? object.sourceName : '',
    //                   publicationDate: object.publicationDate ? object.publicationDate : ''
    //                 },
    //                 error: {
    //                   errorType: {
    //                     label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                     value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                   },
    //                   errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                   errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
    //                 },
    //                 comments: []
    //               }
    //               datapointsObject.currentData.push(currentDatapointsObject);
    //             }
    //           })

    //         }

    //         for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //           let historicalDatapointsObject = {};
    //           _.filter(errorDatapoints, function (object) {
    //             if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year) {
    //               historicalDatapointsObject = {
    //                 status: 'Completed',
    //                 dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                 dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                 fiscalYear: historyYear[hitoryYearIndex].year,
    //                 description: errorDatapoints[errorDpIndex].datapointId.description,
    //                 dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                 textSnippet: object.textSnippet,
    //                 pageNo: object.pageNumber,
    //                 screenShot: object.screenShot,
    //                 response: object.response,
    //                 standaradDeviation: object.standaradDeviation,
    //                 average: object.average,
    //                 source: {
    //                   url: object.url ? object.url : '',
    //                   sourceName: object.sourceName ? object.sourceName : '',
    //                   publicationDate: object.publicationDate ? object.publicationDate : ''
    //                 },
    //                 error: {},
    //                 comments: []
    //               }
    //               datapointsObject.historicalData.push(historicalDatapointsObject);
    //             }
    //           });
    //         }
    //         dpCodesData.push(datapointsObject);

    //       }

    //       return res.status(200).send({
    //         status: "200",
    //         message: "Data correction dp codes retrieved successfully!",
    //         standalone: {
    //           dpCodesData: dpCodesData
    //         }

    //       });
    //     } catch (error) {
    //       return res.status(500).json({
    //         message: error
    //       });
    //     }

    //   }
    // } else if (taskDetails.taskStatus == 'Verfication') {
    //   if (dpTypeValues.length > 1) {
    //     for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
    //       if (dpTypeValues[dpTypeIndex] == 'Board Matrix') {

    //         for (let currentBoardMemYearIndex = 0; currentBoardMemYearIndex < currentYear.length; currentBoardMemYearIndex++) {
    //           // let boardNameList = {
    //           //   year: currentYear[currentBoardMemYearIndex],
    //           //   memberName: []
    //           // }
    //           let boardMembersList = currentAllBoardMemberMatrixDetails.filter(obj => obj.year == currentYear[currentBoardMemYearIndex]);
    //           let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
    //           for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < boardMemberNameList.length; boardMemberNameListIndex++) {
    //             let boardNameValue = {
    //               label: boardMemberNameList[boardMemberNameListIndex].memberName,
    //               value: boardMemberNameList[boardMemberNameListIndex].memberName
    //             }
    //             boardDpCodesData.boardMemberList.push(boardNameValue);
    //           }

    //         }
    //         let errorboardDatapoints = await BoardMembersMatrixDataPoints.find({
    //           taskId: req.params.taskId,
    //           hasCorrection: true,
    //           status: true
    //         }).populate([{
    //           path: 'datapointId',
    //           populate: {
    //             path: 'categoryId'
    //           },
    //           populate: {
    //             path: 'keyIssueId'
    //           }
    //         }]);
    //         for (let errorDpIndex = 0; errorDpIndex < errorboardDatapoints.length; errorDpIndex++) {
    //           for (let boarMemberListIndex = 0; boarMemberListIndex < boardDpCodesData.boardMemberList.length; boarMemberListIndex++) {

    //             let boardDatapointsObject = {
    //               dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
    //               dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
    //               companyId: taskDetails.companyId.id,
    //               companyName: taskDetails.companyId.companyName,
    //               keyIssueId: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //               keyIssue: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //               pillarId: errorboardDatapoints[errorDpIndex].datapointId.categoryId.id,
    //               pillar: errorboardDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //               fiscalYear: taskDetails.year,
    //               memberName: boardDpCodesData.boardMemberList[boarMemberListIndex].label,
    //               currentData: [],
    //               historicalData: [],
    //               status: ""
    //             }

    //             for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //               let currentDatapointsObject = {};
    //               _.filter(errorboardDatapoints, function (object) {
    //                 if (object.datapointId.id == errorboardDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.hasCorrection == true) {

    //                   let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorboardDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //                   currentDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: currentYear[currentYearIndex],
    //                     description: errorboardDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorboardDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     response: object.response,
    //                     memberName: object.memberName,
    //                     hasCorrection: object.hasCorrection,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {
    //                       errorType: {
    //                         label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                         value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                       },
    //                       errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                       errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
    //                     },
    //                     comments: []
    //                   }
    //                   boardDatapointsObject.currentData.push(currentDatapointsObject);
    //                 }
    //               })

    //             }

    //             for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //               let historicalDatapointsObject = {};
    //               _.filter(errorboardDatapoints, function (object) {
    //                 if (object.datapointId.id == errorboardDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year) {
    //                   historicalDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: historyYear[hitoryYearIndex].year,
    //                     description: errorboardDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorboardDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     response: object.response,
    //                     standaradDeviation: object.standaradDeviation,
    //                     average: object.average,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {},
    //                     comments: []
    //                   }
    //                   boardDatapointsObject.historicalData.push(historicalDatapointsObject);
    //                 }
    //               });
    //             }

    //           }

    //         }
    //       } else if (dpTypeValues[dpTypeIndex] == 'KMP Matrix') {
    //         for (let currentkmpMemYearIndex = 0; currentkmpMemYearIndex < currentYear.length; currentkmpMemYearIndex++) {

    //           let kmpMembersList = currentAllKmpMatrixDetails.filter(obj => obj.year == currentYear[currentkmpMemYearIndex]);
    //           let kmpMemberNameList = _.uniqBy(kmpMembersList, 'memberName');
    //           for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < kmpMemberNameList.length; kmpMemberNameListIndex++) {
    //             let kmpNameValue = {
    //               label: kmpMemberNameList[kmpMemberNameListIndex].memberName,
    //               value: kmpMemberNameList[kmpMemberNameListIndex].memberName
    //             }
    //             kmpDpCodesData.kmpMemberList.push(kmpNameValue);
    //           }

    //         }
    //         let errorkmpDatapoints = await BoardMembersMatrixDataPoints.find({
    //           taskId: req.params.taskId,
    //           hasCorrection: true,
    //           status: true
    //         }).populate([{
    //           path: 'datapointId',
    //           populate: {
    //             path: 'categoryId'
    //           },
    //           populate: {
    //             path: 'keyIssueId'
    //           }
    //         }]);
    //         for (let errorDpIndex = 0; errorDpIndex < errorkmpDatapoints.length; errorDpIndex++) {
    //           for (let kmpMemberListIndex = 0; kmpMemberListIndex < kmpDpCodesData.kmpMemberList.length; kmpMemberListIndex++) {

    //             let kmpDatapointsObject = {
    //               dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
    //               dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
    //               companyId: taskDetails.companyId.id,
    //               companyName: taskDetails.companyId.companyName,
    //               keyIssueId: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //               keyIssue: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //               pillarId: errorkmpDatapoints[errorDpIndex].datapointId.categoryId.id,
    //               pillar: errorkmpDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //               fiscalYear: taskDetails.year,
    //               memberName: kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label,
    //               currentData: [],
    //               historicalData: [],
    //               status: ''
    //             }
    //             for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //               let currentDatapointsObject = {};
    //               _.filter(errorkmpDatapoints, function (object) {
    //                 if (object.datapointId.id == errorkmpDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.memberName == kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label && object.hasCorrection == true) {
    //                   let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorkmpDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //                   currentDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: currentYear[currentYearIndex],
    //                     description: errorkmpDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorkmpDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     response: object.response,
    //                     memberName: object.memberName,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {
    //                       errorType: {
    //                         label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                         value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                       },
    //                       errorComments: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                       errorStatus: errorDetailsObject[0].errorStatus ? errorDetailsObject[0].errorStatus : ''
    //                     },
    //                     comments: []
    //                   }
    //                   kmpDatapointsObject.status = 'Completed'
    //                   kmpDatapointsObject.currentData.push(currentDatapointsObject);
    //                 }
    //               });
    //             }
    //             for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //               let historicalDatapointsObject = {};
    //               _.filter(historyAllKmpMatrixDetails, function (object) {
    //                 if (object.datapointId.id == errorkmpDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year && object.memberName == kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label) {
    //                   historicalDatapointsObject = {
    //                     status: 'Completed',
    //                     dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
    //                     dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
    //                     fiscalYear: historyYear[hitoryYearIndex].year,
    //                     description: errorkmpDatapoints[errorDpIndex].datapointId.description,
    //                     dataType: errorkmpDatapoints[errorDpIndex].datapointId.dataType,
    //                     textSnippet: object.textSnippet,
    //                     pageNo: object.pageNumber,
    //                     screenShot: object.screenShot,
    //                     memberName: object.memberName,
    //                     response: object.response,
    //                     source: {
    //                       url: object.url ? object.url : '',
    //                       sourceName: object.sourceName ? object.sourceName : '',
    //                       publicationDate: object.publicationDate ? object.publicationDate : ''
    //                     },
    //                     error: {},
    //                     comments: []
    //                   }
    //                   kmpDatapointsObject.historicalData.push(historicalDatapointsObject);
    //                 }
    //               });
    //             }
    //             kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);

    //           }
    //         }
    //       } else if (dpTypeValues[dpTypeIndex] == 'Standalone') {

    //         let errorDatapoints = await StandaloneDatapoints.find({
    //           taskId: req.params.taskId,
    //           hasCorrection: true,
    //           status: true
    //         }).populate([{
    //           path: 'datapointId',
    //           populate: {
    //             path: 'categoryId'
    //           },
    //           populate: {
    //             path: 'keyIssueId'
    //           }
    //         }]);
    //         for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

    //           let datapointsObject = {
    //             dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //             dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //             companyId: taskDetails.companyId.id,
    //             companyName: taskDetails.companyId.companyName,
    //             keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //             keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //             pillarId: errorDatapoints[errorDpIndex].datapointId.categoryId.id,
    //             pillar: errorDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //             fiscalYear: taskDetails.year,
    //             currentData: [],
    //             historicalData: [],
    //             status: ''
    //           }
    //           for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //             let currentDatapointsObject = {};
    //             _.filter(errorDatapoints, function (object) {
    //               if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.hasCorrection == true) {

    //                 let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //                 currentDatapointsObject = {
    //                   status: 'Completed',
    //                   dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                   dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                   fiscalYear: currentYear[currentYearIndex],
    //                   description: errorDatapoints[errorDpIndex].datapointId.description,
    //                   dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                   textSnippet: object.textSnippet,
    //                   pageNo: object.pageNumber,
    //                   screenShot: object.screenShot,
    //                   response: object.response,
    //                   memberName: object.memberName,
    //                   hasCorrection: object.hasCorrection,
    //                   source: {
    //                     url: object.url ? object.url : '',
    //                     sourceName: object.sourceName ? object.sourceName : '',
    //                     publicationDate: object.publicationDate ? object.publicationDate : ''
    //                   },
    //                   error: {
    //                     errorType: {
    //                       label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                       value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                     },
    //                     errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                     errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
    //                   },
    //                   comments: []
    //                 }
    //                 datapointsObject.currentData.push(currentDatapointsObject);
    //               }
    //             });
    //           }

    //           for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //             let historicalDatapointsObject = {};
    //             _.filter(errorDatapoints, function (object) {
    //               if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year) {
    //                 historicalDatapointsObject = {
    //                   status: 'Completed',
    //                   dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                   dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                   fiscalYear: historyYear[hitoryYearIndex].year,
    //                   description: errorDatapoints[errorDpIndex].datapointId.description,
    //                   dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                   textSnippet: object.textSnippet,
    //                   pageNo: object.pageNumber,
    //                   screenShot: object.screenShot,
    //                   response: object.response,
    //                   standaradDeviation: object.standaradDeviation,
    //                   average: object.average,
    //                   source: {
    //                     url: object.url ? object.url : '',
    //                     sourceName: object.sourceName ? object.sourceName : '',
    //                     publicationDate: object.publicationDate ? object.publicationDate : ''
    //                   },
    //                   error: {},
    //                   comments: []
    //                 }
    //                 datapointsObject.historicalData.push(historicalDatapointsObject);
    //               }
    //             });
    //           }
    //           dpCodesData.push(datapointsObject);

    //         }

    //       }
    //       return res.status(200).send({
    //         status: "200",
    //         message: "Data correction dp codes retrieved successfully!",
    //         standalone: {
    //           dpCodesData: dpCodesData
    //         },
    //         boardMatrix: boardDpCodesData,
    //         kmpMatrix: kmpDpCodesData

    //       });

    //     }

    //   } else {
    //     try {
    //       let errorDatapoints = await StandaloneDatapoints.find({
    //         taskId: req.params.taskId,
    //         hasError: true,
    //         status: true
    //       }).populate([{
    //         path: 'datapointId',
    //         populate: {
    //           path: 'categoryId'
    //         },
    //         populate: {
    //           path: 'keyIssueId'
    //         }
    //       }]);
    //       for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

    //         let datapointsObject = {
    //           dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //           dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //           companyId: taskDetails.companyId.id,
    //           companyName: taskDetails.companyId.companyName,
    //           keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
    //           keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
    //           pillarId: errorDatapoints[errorDpIndex].datapointId.categoryId.id,
    //           pillar: errorDatapoints[errorDpIndex].datapointId.categoryId.categoryName,
    //           fiscalYear: taskDetails.year,
    //           currentData: [],
    //           historicalData: [],
    //           status: ''
    //         }
    //         for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
    //           let currentDatapointsObject = {};
    //           _.filter(errorDatapoints, function (object) {
    //             if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == currentYear[currentYearIndex] && object.hasCorrection == true) {

    //               let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == errorDatapoints[errorDpIndex].datapointId.id && obj.year == currentYear[currentYearIndex])
    //               currentDatapointsObject = {
    //                 status: 'Completed',
    //                 dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                 dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                 fiscalYear: currentYear[currentYearIndex],
    //                 description: errorDatapoints[errorDpIndex].datapointId.description,
    //                 dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                 textSnippet: object.textSnippet,
    //                 pageNo: object.pageNumber,
    //                 screenShot: object.screenShot,
    //                 response: object.response,
    //                 memberName: object.memberName,
    //                 hasCorrection: object.hasCorrection,
    //                 source: {
    //                   url: object.url ? object.url : '',
    //                   sourceName: object.sourceName ? object.sourceName : '',
    //                   publicationDate: object.publicationDate ? object.publicationDate : ''
    //                 },
    //                 error: {
    //                   errorType: {
    //                     label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
    //                     value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
    //                   },
    //                   errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
    //                   errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
    //                 },
    //                 comments: []
    //               }
    //               datapointsObject.currentData.push(currentDatapointsObject);
    //             }
    //           })

    //         }

    //         for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
    //           let historicalDatapointsObject = {};
    //           _.filter(errorDatapoints, function (object) {
    //             if (object.datapointId.id == errorDatapoints[errorDpIndex].datapointId.id && object.year == historyYear[hitoryYearIndex].year) {
    //               historicalDatapointsObject = {
    //                 status: 'Completed',
    //                 dpCode: errorDatapoints[errorDpIndex].datapointId.code,
    //                 dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
    //                 fiscalYear: historyYear[hitoryYearIndex].year,
    //                 description: errorDatapoints[errorDpIndex].datapointId.description,
    //                 dataType: errorDatapoints[errorDpIndex].datapointId.dataType,
    //                 textSnippet: object.textSnippet,
    //                 pageNo: object.pageNumber,
    //                 screenShot: object.screenShot,
    //                 response: object.response,
    //                 standaradDeviation: object.standaradDeviation,
    //                 average: object.average,
    //                 source: {
    //                   url: object.url ? object.url : '',
    //                   sourceName: object.sourceName ? object.sourceName : '',
    //                   publicationDate: object.publicationDate ? object.publicationDate : ''
    //                 },
    //                 error: {},
    //                 comments: []
    //               }
    //               datapointsObject.historicalData.push(historicalDatapointsObject);
    //             }
    //           });
    //         }
    //         dpCodesData.push(datapointsObject);

    //       }

    //       return res.status(200).send({
    //         status: "200",
    //         message: "Data correction dp codes retrieved successfully!",
    //         standalone: {
    //           dpCodesData: dpCodesData
    //         }

    //       });
    //     } catch (error) {
    //       return res.status(500).json({
    //         message: error
    //       });
    //     }

    //   }
    // }
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
    }).populate('companyId');
    let functionId = await Functions.findOne({
      functionType: "Negative News",
      status: true
    });

    let currentYear = taskDetails.year.split(",");
    let dpTypeValues = await Datapoints.findOne({
      relevantForIndia: "Yes",
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
      clientTaxonomyId: taskDetails.companyId.clientTaxonomyId,
      categoryId: taskDetails.categoryId,
      _id: req.body.datapointId,
      status: true
    }).populate('keyIssueId').populate('categoryId');

    let errorDataDetails = [];
    errorDataDetails = await ErrorDetails.find({
      companyId: taskDetails.companyId.id,
      year: {
        $in: currentYear
      },
      categoryId: taskDetails.categoryId,
      status: true
    }).populate('errorTypeId');
    if (req.body.memberType == 'Standalone') {
      let currentAllStandaloneDetails = await StandaloneDatapoints.find({
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
        currentData: [],
        historicalData: [],
        status: ''
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
        let currentDatapointsObject = {};
        _.filter(currentAllStandaloneDetails, function (object) {
          if (object.datapointId.id == req.body.datapointId && object.year == currentYear[currentYearIndex]) {
            if (object.hasError == true) {
              let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == req.body.datapointId && obj.year == currentYear[currentYearIndex])
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: object.sourceName ? object.sourceName : '',
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {
                  errorType: {
                    label: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorType : '',
                    value: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.id : ''
                  },
                  errorComments: errorDetailsObject[0].errorTypeId ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
                  errorStatus: errorDetailsObject[0].errorStatus ? errorDetailsObject[0].errorStatus : ''
                },
                comments: []
              }

            } else {
              currentDatapointsObject = {
                status: 'Completed',
                dpCode: dpTypeValues.code,
                dpCodeId: dpTypeValues.id,
                fiscalYear: currentYear[currentYearIndex],
                description: dpTypeValues.description,
                dataType: dpTypeValues.dataType,
                textSnippet: object.textSnippet,
                pageNo: object.pageNumber,
                screenShot: object.screenShot,
                response: object.response,
                memberName: object.memberName,
                source: {
                  url: object.url ? object.url : '',
                  sourceName: object.sourceName ? object.sourceName : '',
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: []
              }
            }
            datapointsObject.status = 'Completed';
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
            textSnippet: '',
            pageNo: '',
            screenShot: '',
            response: '',
            source: '',
            error: {},
            comments: []
          }
          datapointsObject.status = 'Yet to Start';
        }
        datapointsObject.currentData.push(currentDatapointsObject);
      }
      for (let historicalYearIndex = 0; historicalYearIndex < historyYear.length; historicalYearIndex++) {
        let historicalDatapointsObject = {};
        _.filter(historyAllStandaloneDetails, function (object) {
          if (object.year == historyYear[historicalYearIndex].year) {
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
              source: {
                url: object.url ? object.url : '',
                sourceName: object.sourceName ? object.sourceName : '',
                publicationDate: object.publicationDate ? object.publicationDate : ''
              },
              error: {},
              comments: []
            }
          }
        });
        datapointsObject.historicalData.push(historicalDatapointsObject);
      }
      return res.status(200).send({
        status: "200",
        message: "Data collection dp codes retrieved successfully!",
        standdpCodeDataalone: datapointsObject
      });
    } else if (req.body.memberType == 'Board Matrix') {

      let historyAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          companyId: taskDetails.companyId.id,
          datapointId: req.body.datapointId,
          memberName:req.body.memberName,
          year: {
            "$nin": currentYear
          },
          memberStatus: true,
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
      let historyYear = _.uniqBy(historyAllBoardMemberMatrixDetails, 'year');
      let currentAllBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.find({
          taskId: req.body.taskId,
          datapointId: req.body.datapointId,
          memberName:req.body.memberName,
          memberStatus: true,
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
        let currentYearValues = _.uniqBy(currentAllBoardMemberMatrixDetails, 'year');

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
        currentData: [],
        historicalData: [],
        status: ""
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYearValues.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(currentAllBoardMemberMatrixDetails, function (object) {
            if (object.datapointId.id == req.body.datapointId,object.year == currentYearValues[currentYearIndex].year && object.memberName == req.body.memberName) {
              console.log(object)
              if (object.hasError == true) {

                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == dpTypeValues.id && obj.year == currentYearValues[currentYearIndex].year)
                currentDatapointsObject = {
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
                  memberName: object.memberName,
                  source: {
                    url: object.url ? object.url : '',
                    sourceName: object.sourceName ? object.sourceName : '',
                    publicationDate: object.publicationDate ? object.publicationDate : ''
                  },
                  error: {
                    errorType: {
                      label: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorType : '',
                      value: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.id : ''
                    },
                    errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
                    errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
                  },
                  comments: []
                }
              } else {
                currentDatapointsObject = {
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
                  memberName: object.memberName,
                  source: {
                    url: object.url ? object.url : '',
                    sourceName: object.sourceName ? object.sourceName : '',
                    publicationDate: object.publicationDate ? object.publicationDate : ''
                  },
                  error: {},
                  comments: []
                }
              }
              boardDatapointsObject.status = 'Completed'
            }
          });
          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = {
              status: 'Yet to Start',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYearValues[currentYearIndex].year,
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              memberName: req.body.memberName,
              textSnippet: '',
              pageNo: '',
              screenShot: '',
              response: '',
              source: '',
              error: {},
              comments: []
            }
            boardDatapointsObject.status = "Yet to Start"
          }
          boardDatapointsObject.currentData.push(currentDatapointsObject);
        
      }
      for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
        // let boardMembersList = historyAllBoardMemberMatrixDetails.filter(obj => obj.year == historyYear[hitoryYearIndex].year);
        // let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
        // for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {

          let historicalDatapointsObject = {};
          _.filter(historyAllBoardMemberMatrixDetails, function (object) {
            if (object.year == historyYear[hitoryYearIndex].year && object.memberName == req.body.memberName) {
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
                source: {
                  url: object.url ? object.url : '',
                  sourceName: object.sourceName ? object.sourceName : '',
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: []
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

      let historyAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
          companyId: taskDetails.companyId.id,
          memberName:req.body.memberName,
          year: {
            "$nin": currentYear
          },
          memberStatus: true,
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');

      let historyYear = _.uniqBy(historyAllKmpMatrixDetails, 'year');
      let currentAllKmpMatrixDetails = await KmpMatrixDataPoints.find({
          memberName:req.body.memberName,
          taskId: req.body.taskId,
          datapointId:req.body.datapointId,
          memberStatus: true,
          status: true
        }).populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId');
        let currentYearValues = _.uniqBy(currentAllKmpMatrixDetails, 'year');

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
        currentData: [],
        historicalData: [],
        status: ''
      }
      for (let currentYearIndex = 0; currentYearIndex < currentYearValues.length; currentYearIndex++) {
          let currentDatapointsObject = {};
          _.filter(currentAllKmpMatrixDetails, function (object) {
            if (object.datapointId.id == dpTypeValues.id && object.year == currentYearValues[currentYearIndex].year && object.memberName == req.body.memberName) {
              if (object.hasError == true) {
                let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == dpTypeValues.id && obj.year == currentYear[currentYearIndex].year)
                currentDatapointsObject = {
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
                  memberName: object.memberName,
                  source: {
                    url: object.url ? object.url : '',
                    sourceName: object.sourceName ? object.sourceName : '',
                    publicationDate: object.publicationDate ? object.publicationDate : ''
                  },
                  error: {
                    errorType: {
                      label: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorType : '',
                      value: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.id : ''
                    },
                    errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
                    errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
                  },
                  comments: []
                }
              } else {
                currentDatapointsObject = {
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
                  memberName: object.memberName,
                  source: {
                    url: object.url ? object.url : '',
                    sourceName: object.sourceName ? object.sourceName : '',
                    publicationDate: object.publicationDate ? object.publicationDate : ''
                  },
                  error: {},
                  comments: []
                }
              }
              kmpDatapointsObject.status = 'Completed'
            }
          });
          if (Object.keys(currentDatapointsObject).length == 0) {
            currentDatapointsObject = {
              status: 'Yet to Start',
              dpCode: dpTypeValues.code,
              dpCodeId: dpTypeValues.id,
              fiscalYear: currentYear[currentYearIndex].year,
              description: dpTypeValues.description,
              dataType: dpTypeValues.dataType,
              memberName: req.body.memberName,
              textSnippet: '',
              pageNo: '',
              screenShot: '',
              response: '',
              source: '',
              error: {},
              comments: []
            }
            kmpDatapointsObject.status = 'Yet to Start';
          }
          kmpDatapointsObject.currentData.push(currentDatapointsObject);
      }
      for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
        let boardMembersList = historyAllKmpMatrixDetails.filter(obj => obj.year == historyYear[hitoryYearIndex].year);
        let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
        for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {

          let historicalDatapointsObject = {};
          _.filter(historyAllKmpMatrixDetails, function (object) {
            if (object.datapointId.id == dpTypeValues.id && object.year == historyYear[hitoryYearIndex].year && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
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
                source: {
                  url: object.url ? object.url : '',
                  sourceName: object.sourceName ? object.sourceName : '',
                  publicationDate: object.publicationDate ? object.publicationDate : ''
                },
                error: {},
                comments: []
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
      let newDatapoints = [],
        headerNameList = [];
      let allCategories = [],
        allKeyIssues = [],
        allFunctions = [];
      allCategories = await Categories.find({
        status: true
      });
      allKeyIssues = await KeyIssues.find({
        status: true
      });
      allFunctions = await Functions.find({
        status: true
      });
      await ClientTaxonomy.findOne({
          _id: req.body.clientTaxonomyId
        })
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

export const update = ({
    user,
    bodymen: {
      body
    },
    params
  }, res, next) =>
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

export const destroy = ({
    user,
    params
  }, res, next) =>
  Datapoints.findById(params.id)
  .then(notFound(res))
  .then(authorOrAdmin(res, user, 'updatedBy'))
  .then((datapoints) => datapoints ? datapoints.remove() : null)
  .then(success(res, 204))
  .catch(next)
