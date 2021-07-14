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
  fs.readFile(__dirname + '/extra.json', async (err, data) => {
    if (err) throw err;
    let datapointsList = JSON.parse(data);
    console.log('datapointsList', datapointsList.length)
    for (let index = 0; index < datapointsList.length; index++) {
      var obj = {
        "clientTaxonomyId": clientTaxonomyId,
        "validationRule": datapointsList[index].validationRule,
        "dataType": datapointsList[index].dataType,
        "dependentCodes": datapointsList[index].dependentCodes ? JSON.parse(datapointsList[index].dependentCodes) : [],
        "hasDependentCode": datapointsList[index].hasDependentCode,
        "validationTypes": datapointsList[index].validationTypes ? JSON.parse(datapointsList[index].validationTypes) : [],
        "percentileThresholdValue": datapointsList[index].percentileThresholdValue,
        "DPCODE": datapointsList[index].DPCODE,
        "parameters": datapointsList[index].parameters,
        "methodName": datapointsList[index].methodName,
        "checkCondition": datapointsList[index].checkCondition,
        "criteria": datapointsList[index].criteria,
        "collectionOrderNumber": datapointsList[index].collectionOrderNumber,
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
    let boardDpCodesData = {
      boardMemberList: [],
      dpCodeData: []
    };
    let kmpDpCodesData = {
      kmpMemberList: [],
      dpCodeData: []
    };
    let dpCodesData = [];
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
        companyId: taskDetails.companyId.id,
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
        companyId: taskDetails.companyId.id,
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

    if (dpTypeValues.length > 0) {
      if (dpTypeValues.length > 1) {
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
          if (dpTypeValues[dpTypeIndex] == 'Board Matrix') {
            for (let currentBoardMemYearIndex = 0; currentBoardMemYearIndex < currentYear.length; currentBoardMemYearIndex++) {
              let boardNameList = {
                year: currentYear[currentBoardMemYearIndex],
                memberName: []
              }
              let boardMembersList = currentAllBoardMemberMatrixDetails.filter(obj => obj.year == currentYear[currentBoardMemYearIndex]);
              let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
              for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < boardMemberNameList.length; boardMemberNameListIndex++) {
                let boardNameValue = {
                  label: boardMemberNameList[boardMemberNameListIndex].memberName,
                  value: boardMemberNameList[boardMemberNameListIndex].memberName
                }
                boardNameList.memberName.push(boardNameValue);
              }
              boardDpCodesData.boardMemberList.push(boardNameList);

            }
            for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {

              let boardDatapointsObject = {
                dpcode: dpTypeDatapoints[datapointsIndex].code,
                dpcodeId: dpTypeDatapoints[datapointsIndex].id,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                fiscalYear: taskDetails.year,
                currentData: [],
                historicalData: []
              }
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                let boardMembersList = currentAllBoardMemberMatrixDetails.filter(obj => obj.year == currentYear[currentYearIndex]);
                let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
                console.log(boardMemberNameList.length)
                for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {
                  let ss = boardMemberNameList[boarMemberListIndex].memberName;
                  let currentDatapointsObject = {};
                  _.filter(currentAllBoardMemberMatrixDetails, function (object) {
                    if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
                      if (object.hasError == true) {
                        let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == dpTypeDatapoints[datapointsIndex].id && obj.year == currentYear[currentYearIndex])
                        currentDatapointsObject = {
                          dpCode: dpTypeDatapoints[datapointsIndex].code,
                          dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                          fiscalYear: currentYear[currentYearIndex],
                          description: dpTypeDatapoints[datapointsIndex].description,
                          dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                          dpCode: dpTypeDatapoints[datapointsIndex].code,
                          dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                          fiscalYear: currentYear[currentYearIndex],
                          description: dpTypeDatapoints[datapointsIndex].description,
                          dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                    }
                  });
                  if (Object.keys(currentDatapointsObject).length == 0) {
                    currentDatapointsObject = {
                      dpCode: dpTypeDatapoints[datapointsIndex].code,
                      dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                      fiscalYear: currentYear[currentYearIndex],
                      description: dpTypeDatapoints[datapointsIndex].description,
                      dataType: dpTypeDatapoints[datapointsIndex].dataType,
                      memberName: boardMemberNameList[boarMemberListIndex].memberName,
                      textSnippet: '',
                      pageNo: '',
                      screenShot: '',
                      response: '',
                      source: '',
                      error: {},
                      comments: []
                    }
                  }
                  boardDatapointsObject.currentData.push(currentDatapointsObject);
                }
              }
              for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
                let boardMembersList = historyAllBoardMemberMatrixDetails.filter(obj => obj.year == historyYear[hitoryYearIndex].year);
                let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
                for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {

                  let historicalDatapointsObject = {};
                  _.filter(historyAllBoardMemberMatrixDetails, function (object) {
                    if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == historyYear[hitoryYearIndex].year && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
                      historicalDatapointsObject = {
                        dpCode: dpTypeDatapoints[datapointsIndex].code,
                        dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                        fiscalYear: historyYear[hitoryYearIndex].year,
                        description: dpTypeDatapoints[datapointsIndex].description,
                        dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                  //mergedBoardHistoryDetails.push(historicalDatapointsObject);
                  boardDatapointsObject.historicalData.push(historicalDatapointsObject);
                }
              }
              // mergedBoardMemberHistoryDetails = _.merge(mergedBoardMemberHistoryDetails, mergedBoardHistoryDetails);
              // boardhistoricalDatapointsIndex.push(mergedBoardMemberHistoryDetails);             

              boardDpCodesData.dpCodeData.push(boardDatapointsObject);
            }
          } else if (dpTypeValues[dpTypeIndex] == 'KMP Matrix') {
            for (let currentkmpMemYearIndex = 0; currentkmpMemYearIndex < currentYear.length; currentkmpMemYearIndex++) {
              let kmpNameList = {
                year: currentYear[currentkmpMemYearIndex],
                memberName: []
              }
              let kmpMembersList = currentAllKmpMatrixDetails.filter(obj => obj.year == currentYear[currentkmpMemYearIndex]);
              let kmpMemberNameList = _.uniqBy(kmpMembersList, 'memberName');
              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < kmpMemberNameList.length; kmpMemberNameListIndex++) {
                let kmpNameValue ={
                  label:kmpMemberNameList[kmpMemberNameListIndex].memberName,
                  value:kmpMemberNameList[kmpMemberNameListIndex].memberName
                }
                kmpNameList.memberName.push(kmpNameValue);
              }
              kmpDpCodesData.kmpMemberList.push(kmpNameList);

            }
            for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
              console.log(datapointsIndex);
              let kmpDatapointsObject = {
                dpcode: dpTypeDatapoints[datapointsIndex].code,
                dpcodeId: dpTypeDatapoints[datapointsIndex].id,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                fiscalYear: taskDetails.year,
                currentData: [],
                historicalData: []
              }
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                let boardMembersList = currentAllKmpMatrixDetails.filter(obj => obj.year == currentYear[currentYearIndex]);
                let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');

                for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {
                  let currentDatapointsObject = {};
                  _.filter(currentAllKmpMatrixDetails, function (object) {
                    if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
                      if (object.hasError == true) {
                        let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == dpTypeDatapoints[datapointsIndex].id && obj.year == currentYear[currentYearIndex])
                        currentDatapointsObject = {
                          dpCode: dpTypeDatapoints[datapointsIndex].code,
                          dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                          fiscalYear: currentYear[currentYearIndex],
                          description: dpTypeDatapoints[datapointsIndex].description,
                          dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                          dpCode: dpTypeDatapoints[datapointsIndex].code,
                          dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                          fiscalYear: currentYear[currentYearIndex],
                          description: dpTypeDatapoints[datapointsIndex].description,
                          dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                    }
                  });
                  if (Object.keys(currentDatapointsObject).length == 0) {
                    currentDatapointsObject = {
                      dpCode: dpTypeDatapoints[datapointsIndex].code,
                      dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                      fiscalYear: currentYear[currentYearIndex],
                      description: dpTypeDatapoints[datapointsIndex].description,
                      dataType: dpTypeDatapoints[datapointsIndex].dataType,
                      memberName: boardMemberNameList[boarMemberListIndex].memberName,
                      textSnippet: '',
                      pageNo: '',
                      screenShot: '',
                      response: '',
                      source: '',
                      error: {},
                      comments: []
                    }
                  }
                  kmpDatapointsObject.currentData.push(currentDatapointsObject);
                  //mergedKMPCurrentDetails = _.concat(currentDatapointsObject, currentDatapointsObject);
                }
              }
              // kmpCurrentDatapointsIndex.push(mergedBoardCurrentDetails)
              for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
                let boardMembersList = historyAllKmpMatrixDetails.filter(obj => obj.year == historyYear[hitoryYearIndex].year);
                let boardMemberNameList = _.uniqBy(boardMembersList, 'memberName');
                for (let boarMemberListIndex = 0; boarMemberListIndex < boardMemberNameList.length; boarMemberListIndex++) {

                  let historicalDatapointsObject = {};
                  _.filter(historyAllKmpMatrixDetails, function (object) {
                    if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == historyYear[hitoryYearIndex].year && object.memberName == boardMemberNameList[boarMemberListIndex].memberName) {
                      historicalDatapointsObject = {
                        dpCode: dpTypeDatapoints[datapointsIndex].code,
                        dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                        fiscalYear: historyYear[hitoryYearIndex].year,
                        description: dpTypeDatapoints[datapointsIndex].description,
                        dataType: dpTypeDatapoints[datapointsIndex].dataType,
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

              kmpDpCodesData.dpCodeData.push(kmpDatapointsObject);
            }
            // kmpHistoricalDatapointsIndex.push(mergedBoardHistoryDetails);


          } else if (dpTypeValues[dpTypeIndex] == 'Standalone') {
            for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {

              let datapointsObject = {
                dpcode: dpTypeDatapoints[datapointsIndex].code,
                dpcodeId: dpTypeDatapoints[datapointsIndex].id,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                fiscalYear: taskDetails.year,
                currentData: [],
                historicalData: []
              }
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                let currentDatapointsObject = {};
                _.filter(currentAllStandaloneDetails, function (object) {
                  if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                    if (object.hasError == true) {
                      let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == dpTypeDatapoints[datapointsIndex].id && obj.year == currentYear[currentYearIndex])
                      currentDatapointsObject = {
                        dpCode: dpTypeDatapoints[datapointsIndex].code,
                        dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                        fiscalYear: currentYear[currentYearIndex],
                        description: dpTypeDatapoints[datapointsIndex].description,
                        dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                        dpCode: dpTypeDatapoints[datapointsIndex].code,
                        dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                        fiscalYear: currentYear[currentYearIndex],
                        description: dpTypeDatapoints[datapointsIndex].description,
                        dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                  }
                });
                if (Object.keys(currentDatapointsObject).length == 0) {
                  currentDatapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    fiscalYear: currentYear[currentYearIndex],
                    description: dpTypeDatapoints[datapointsIndex].description,
                    dataType: dpTypeDatapoints[datapointsIndex].dataType,
                    textSnippet: '',
                    pageNo: '',
                    screenShot: '',
                    response: '',
                    source: '',
                    error: {},
                    comments: []
                  }
                }
                datapointsObject.currentData.push(currentDatapointsObject);
                // mergedCurrentDetails = _.concat(currentDatapointsObject, currentDatapointsObject);
              }
              //  currentDatapointsIndex.push(mergedCurrentDetails);
              for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
                let historicalDatapointsObject = {};
                _.filter(historyAllStandaloneDetails, function (object) {
                  if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == historyYear[hitoryYearIndex].year) {
                    historicalDatapointsObject = {
                      dpCode: dpTypeDatapoints[datapointsIndex].code,
                      dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                      fiscalYear: historyYear[hitoryYearIndex].year,
                      description: dpTypeDatapoints[datapointsIndex].description,
                      dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                  //mergedHistoryDetails = _.concat(historicalDatapointsObject, historicalDatapointsObject)
                });
                datapointsObject.historicalData.push(historicalDatapointsObject);
              }
              //historicalDatapointsIndex.push(mergedHistoryDetails);

              dpCodesData.push(datapointsObject);
            }
          }
        }

        return res.status(200).send({
          status: "200",
          message: "Data collection dp codes retrieved successfully!",
          dpCodeData: {
            standalone: dpCodesData,
            boardMatrix: boardDpCodesData,
            kmpMatrix: kmpDpCodesData
          }
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
          for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {

            let datapointsObject = {
              dpcode: dpTypeDatapoints[datapointsIndex].code,
              dpcodeId: dpTypeDatapoints[datapointsIndex].id,
              companyId: taskDetails.companyId.id,
              companyName: taskDetails.companyId.companyName,
              keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
              keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
              pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
              pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
              fiscalYear: taskDetails.year,
              currentData: [],
              historicalData: []
            }
            for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let currentDatapointsObject = {};
              _.filter(currentAllStandaloneDetails, function (object) {
                if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                  if (object.hasError == true) {
                    let errorDetailsObject = errorDataDetails.filter(obj => obj.datapointId == dpTypeDatapoints[datapointsIndex].id && obj.year == currentYear[currentYearIndex])
                    console.log(errorDetailsObject[0].errorTypeId.errorType)
                    currentDatapointsObject = {
                      dpCode: dpTypeDatapoints[datapointsIndex].code,
                      dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                      fiscalYear: currentYear[currentYearIndex],
                      description: dpTypeDatapoints[datapointsIndex].description,
                      dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                        errorComments: errorDetailsObject[0] ? errorDetailsObject[0].errorTypeId.errorDefenition : '',
                        errorStatus: errorDetailsObject[0] ? errorDetailsObject[0].errorStatus : ''
                      },
                      comments: []
                    }

                  } else {
                    currentDatapointsObject = {
                      dpCode: dpTypeDatapoints[datapointsIndex].code,
                      dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                      fiscalYear: currentYear[currentYearIndex],
                      description: dpTypeDatapoints[datapointsIndex].description,
                      dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                }
              });
              if (Object.keys(currentDatapointsObject).length == 0) {
                currentDatapointsObject = {
                  dpCode: dpTypeDatapoints[datapointsIndex].code,
                  dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                  fiscalYear: currentYear[currentYearIndex],
                  description: dpTypeDatapoints[datapointsIndex].description,
                  dataType: dpTypeDatapoints[datapointsIndex].dataType,
                  textSnippet: '',
                  pageNo: '',
                  screenShot: '',
                  response: '',
                  source: '',
                  error: {},
                  comments: []
                }
              }
              datapointsObject.currentData.push(currentDatapointsObject);
            }
            for (let hitoryYearIndex = 0; hitoryYearIndex < historyYear.length; hitoryYearIndex++) {
              let historicalDatapointsObject = {};
              _.filter(historyAllStandaloneDetails, function (object) {
                if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == historyYear[hitoryYearIndex].year) {
                  historicalDatapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    fiscalYear: historyYear[hitoryYearIndex].year,
                    description: dpTypeDatapoints[datapointsIndex].description,
                    dataType: dpTypeDatapoints[datapointsIndex].dataType,
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
                // mergedHistoryDetails = _.concat(historicalDatapointsObject, historicalDatapointsObject)
              });
              datapointsObject.historicalData.push(historicalDatapointsObject);
              //   historicalDatapoints.push(mergedHistoryDetails);
            }
            dpCodesData.push(datapointsObject);
          }
        }
        console.log(dpCodesData);

        return res.status(200).send({
          status: "200",
          message: "Data collection dp codes retrieved successfully!",
          dpCodeData: dpCodesData
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "No dp codes available",
        dpCodeData: dpCodesData
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error
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
