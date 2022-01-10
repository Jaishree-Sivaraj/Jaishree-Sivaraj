import _ from 'lodash';
import { Datapoints } from '.'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { Functions } from '../functions'
import { TaskAssignment } from '../taskAssignment'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp';
import { Pending, CollectionCompleted, CorrectionPending, CorrectionCompleted, VerificationCompleted, Completed } from '../../constants/task-status';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { KeyIssues } from '../key_issues'
export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    const { offset, limit, keyIssueName } = req.query;
    const [taskDetails, functionId] = await Promise.all([TaskAssignment.findOne({
      _id: req.params.taskId
    }).populate({
      path: "companyId",
      populate: {
        path: "clientTaxonomyId"
      }
    }).populate('categoryId'),
    Functions.findOne({
      functionType: "Negative News",
      status: true
    })]);
    const currentYear = taskDetails.year.split(",");
    let dptypeQuery = {
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
      clientTaxonomyId: taskDetails.companyId.clientTaxonomyId.id,
      categoryId: taskDetails.categoryId.id,
      status: true
    }
    const dpTypeValues = await Datapoints.find(dptypeQuery)
      // .limit(+limit)
      .distinct('dpType').lean();

    let [keyIssuesList, boardDpCodesData, kmpDpCodesData, dpCodesData, priorityDpCodes] = [[], {
      boardMemberList: [],
      dpCodesData: []
    }, {
      kmpMemberList: [],
      dpCodesData: []
    },
    [], []];
    const query = {
      taskId: req.params.taskId,
      companyId: taskDetails.companyId.id,
      year: {
        $in: currentYear
      },
      isActive: true,
      status: true
    }

    const [currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails] = await
      Promise.all([
        StandaloneDatapoints.find(query).populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId'),
        BoardMembersMatrixDataPoints.find(query).populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId'),
        KmpMatrixDataPoints.find(query).populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId')
      ]);
    const taskStatus = [Pending, CollectionCompleted, VerificationCompleted, Completed];
    let keyIssueId;
    if (taskStatus.includes(taskDetails.taskStatus)) {
      if (dpTypeValues.length < 0) {
        return res.status(400).json({
          status: "400",
          message: "No dp codes available",
          dpCodeData: dpCodesData
        });
      }
      let repFinalSubmit = false;
      const mergedDatapoints = _.concat(currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails)
      const datapointsCount = await Datapoints.distinct('_id', {
        ...dptypeQuery,
        isPriority: true
      }).lean();
      const priorityDpCodesCount = await StandaloneDatapoints.find({
        ...dptypeQuery,
        datapointId: { $in: datapointsCount },
        isActive: true
      }).lean();
      const checkHasError = _.filter(mergedDatapoints, function (o) { return o.hasError == true; });
      const priorityCount = datapointsCount.length * currentYear.length;
      let isDpcodeValidForCollection = false;
      let message = "Please Complete Priority Dpcodes";
      if (priorityDpCodesCount.length == priorityCount) {
        isDpcodeValidForCollection = true
        message = '';
      }
      if (checkHasError.length > 0) {
        repFinalSubmit = true; //!should be false.
      } else if (taskDetails.taskStatus == VerificationCompleted || taskDetails.taskStatus == Completed) {
        await TaskAssignment.updateOne({ _id: req.params.taskId }, { $set: { taskStatus: Completed } });
      }

      if (dpTypeValues.length > 1) {
        let dpsQuery;
        if (keyIssueName) {
          // this is for datapoints
          const dbQuery = {};
          Object.assign(dbQuery, { keyIssueName: { $regex: keyIssueName, $options: 'i' } });
          keyIssueId = await KeyIssues.findOne(dbQuery, { id: 1 });
          dpsQuery = {
            ...dptypeQuery,
            keyIssueId: keyIssueId?.id
          }
        }
        const keyIssuesCollection = await Datapoints.find(dpsQuery)
          .skip(+offset)
          .limit(+limit)
          .sort({ name: -1 }) // sort by code.
          .populate('keyIssueId');
        const keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
        keyIssueListObject.map(keyIssue => {
          keyIssuesList.push({
            label: keyIssue.keyIssueId.keyIssueName,
            value: keyIssue.keyIssueId.id
          })
        });
        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) { // add pagination to dpTypeValues
          const dpTypeDatapoints = await Datapoints.find({
            ...dpsQuery, dpType: dpTypeValues[dpTypeIndex]
          }).skip(+offset).limit(+limit).sort({ name: -1 }).populate('keyIssueId').populate('categoryId');

          const dpQuery = { companyId: taskDetails.companyId.id, endDateTimeStamp: 0 };

          switch (dpTypeValues[dpTypeIndex]) {
            case STANDALONE:
              for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                if (dpTypeDatapoints[datapointsIndex].isPriority == true) {
                  let datapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    dpName: dpTypeDatapoints[datapointsIndex].name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    fiscalYear: taskDetails.year,
                    priority: {
                      isDpcodeValidForCollection: true,
                      message: ""
                    },
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllStandaloneDetails, (object) => {
                      if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                        datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                      }
                    })
                  }
                  dpCodesData.push(datapointsObject);
                } else {
                  let datapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    dpName: dpTypeDatapoints[datapointsIndex].name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    fiscalYear: taskDetails.year,
                    priority: {
                      isDpcodeValidForCollection: isDpcodeValidForCollection,
                      message: message
                    },
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllStandaloneDetails, (object) => {
                      if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                        datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                      }
                    })
                  }
                  dpCodesData.push(datapointsObject);
                }
              }
              break;
            case BOARD_MATRIX:
              const boardMemberEq = await BoardMembers.find(dpQuery).lean();
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex])
                const boardMemberGt = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp } }).lean();
                const mergeBoardMemberList = _.concat(boardMemberEq, boardMemberGt);

                for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                  let boardNameValue = {
                    label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                    value: mergeBoardMemberList[boardMemberNameListIndex].id,
                    year: currentYear[currentYearIndex]
                  }
                  if (boardDpCodesData.boardMemberList.length > 0) {
                    let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                    if (boardMemberValues.length > 0) {
                      let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                      boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ',' + currentYear[currentYearIndex];
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
                  // initisalised object.
                  let boardDatapointsObject = {
                    dpCode: dpTypeDatapoints[datapointsIndex].code,
                    dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                    dpName: dpTypeDatapoints[datapointsIndex].name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                    keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                    pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                    pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                    dataType: dpTypeDatapoints[datapointsIndex].dataType,
                    fiscalYear: boardDpCodesData.boardMemberList[boarMemberListIndex].year,
                    memberName: boardDpCodesData.boardMemberList[boarMemberListIndex].label,
                    memberId: boardDpCodesData.boardMemberList[boarMemberListIndex].value,
                    priority: {
                      isDpcodeValidForCollection: isDpcodeValidForCollection,
                      message: message
                    },
                    status: "Yet to Start"
                  }
                  // filtered data to get status.
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllBoardMemberMatrixDetails, (object) => {
                      if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id
                        && object.year == currentYear[currentYearIndex]
                        && object.memberName == boardDpCodesData.boardMemberList[boarMemberListIndex].label) {
                        boardDatapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                      }
                    })
                  }
                  boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                }
              }
              break;
            case KMP_MATRIX:
            case 'KMP Matrix':
              const kmpMemberEq = await Kmp.find(dpQuery).lean();
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex])
                const kmpMemberGt = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp } }).lean();
                let mergeKmpMemberList = _.concat(kmpMemberEq, kmpMemberGt);
                for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                  let kmpNameValue = {
                    label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                    value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                    year: currentYear[currentYearIndex]
                  }
                  if (kmpDpCodesData.kmpMemberList.length > 0) {
                    let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                    if (kmpMemberValues.length > 0) {
                      let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                      kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ',' + currentYear[currentYearIndex];
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
                    dpName: dpTypeDatapoints[datapointsIndex].name,
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
                    priority: {
                      isDpcodeValidForCollection: isDpcodeValidForCollection,
                      message: message
                    },
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllKmpMatrixDetails, (object) => {
                      if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && object.memberName == kmpDpCodesData.kmpMemberList[kmpMemberListIndex].label) {
                        kmpDatapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed'
                      }
                    })
                  }
                  kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                }
              }
              break;
            default:
              break;
          }
        }
        return res.status(200).send({
          status: "200",
          message: "Data collection dp codes retrieved successfully!",
          repFinalSubmit: repFinalSubmit,
          keyIssuesList: keyIssuesList,
          standalone: {
            dpCodesData: dpCodesData
          },
          boardMatrix: boardDpCodesData,
          kmpMatrix: kmpDpCodesData

        });
      } else {
        const dbQuery = {};
        let keyIssueId;
        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
          let dpQuery = {
            ...dptypeQuery,
            dpType: dpTypeValues[dpTypeIndex]
          };
          if (keyIssueName) {
            Object.assign(dbQuery, { keyIssueName: { $regex: keyIssueName, $options: 'i' } });
            keyIssueId = await KeyIssues.findOne(dbQuery, { id: 1 });
            dpQuery = {
              ...dptypeQuery,
              keyIssueId: keyIssueId?.id,
              dpType: dpTypeValues[dpTypeIndex]
            }

          }
          let dpTypeDatapoints = await Datapoints.find({
            ...dpQuery
          }).skip(+offset).limit(+limit).sort({ name: -1 }).populate('keyIssueId').populate('categoryId');

          let keyIssueListObject = _.uniqBy(dpTypeDatapoints, 'keyIssueId');
          keyIssueListObject.map(keyIssues => {
            keyIssuesList.push({
              label: keyIssues.keyIssueId.keyIssueName,
              value: keyIssues.keyIssueId.id
            });
          });
          for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
            if (dpTypeDatapoints[datapointsIndex].isPriority == true) {
              let datapointsObject = {
                dpCode: dpTypeDatapoints[datapointsIndex].code,
                dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                dpName: dpTypeDatapoints[datapointsIndex].name,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                priority: {
                  isDpcodeValidForCollection: true,
                  message: ""
                },
                fiscalYear: taskDetails.year,
                status: 'Yet to Start'
              }
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                _.filter(currentAllStandaloneDetails, (object) => {
                  if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                    datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                  }
                })
              }
              dpCodesData.push(datapointsObject);
            } else {
              let datapointsObject = {
                dpCode: dpTypeDatapoints[datapointsIndex].code,
                dpCodeId: dpTypeDatapoints[datapointsIndex].id,
                dpName: dpTypeDatapoints[datapointsIndex].name,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: dpTypeDatapoints[datapointsIndex].keyIssueId.id,
                keyIssue: dpTypeDatapoints[datapointsIndex].keyIssueId.keyIssueName,
                pillarId: dpTypeDatapoints[datapointsIndex].categoryId.id,
                pillar: dpTypeDatapoints[datapointsIndex].categoryId.categoryName,
                priority: {
                  isDpcodeValidForCollection: isDpcodeValidForCollection,
                  message: message
                },
                fiscalYear: taskDetails.year,
                status: 'Yet to Start'
              }
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                _.filter(currentAllStandaloneDetails, (object) => {
                  if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                    datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
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
          repFinalSubmit: repFinalSubmit,
          keyIssuesList: keyIssuesList,
          standalone: {
            dpCodesData: dpCodesData
          }
        });
      }

    } else if (taskDetails.taskStatus == CorrectionPending) {
      // In here no keyIssues

      if (keyIssueName) {
        // this is for datapoints
        const dbQuery = {};
        Object.assign(dbQuery, { keyIssueName: { $regex: keyIssueName, $options: 'i' } });
        keyIssueId = await KeyIssues.findOne(dbQuery, { id: 1 });
        dpsQuery = {
          ...dptypeQuery,
          keyIssueId: keyIssueId?.id
        }
      }
      if (dpTypeValues.length > 1) {
        try {
          const errorDatapoints = await StandaloneDatapoints.find({
            taskId: req.params.taskId,
            companyId: taskDetails.companyId.id,
            dpStatus: "Error",
            isActive: true,
            status: true
          })
            .skip(+offset).limit(+limit)
            .populate({
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }).lean();

          for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {
            let datapointsObject = {
              dpCode: errorDatapoints[errorDpIndex].datapointId.code,
              dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
              dpName: errorDatapoints[errorDpIndex].datapointId.name,
              companyId: taskDetails.companyId.id,
              companyName: taskDetails.companyId.companyName,
              keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
              keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
              pillarId: taskDetails.categoryId.id,
              pillar: taskDetails.categoryId.categoryName,
              fiscalYear: errorDatapoints[errorDpIndex].year,
              status: errorDatapoints[errorDpIndex].correctionStatus
            }
            if (dpCodesData.length > 0) {
              let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", errorDatapoints[errorDpIndex].year)
              } else {
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
      for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
        switch (dpTypeValues[dpTypeIndex]) {
          case STANDALONE:
            {
              const errorDatapoints = await StandaloneDatapoints.find({
                taskId: req.params.taskId,
                companyId: taskDetails.companyId.id,
                dpStatus: 'Error',
                isActive: true,
                status: true
              }).skip(+offset)
                .limit(+limit)
                .sort({ updatedAt: -1 })
                .populate([{
                  path: 'datapointId',
                  populate: {
                    path: 'keyIssueId'
                  }
                }]);
              for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {

                let datapointsObject = {
                  dpCode: errorDatapoints[errorDpIndex].datapointId.code,
                  dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
                  dpName: errorDatapoints[errorDpIndex].datapointId.name,
                  companyId: taskDetails.companyId.id,
                  companyName: taskDetails.companyId.companyName,
                  keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                  keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                  pillarId: taskDetails.categoryId.id,
                  pillar: taskDetails.categoryId.categoryName,
                  fiscalYear: errorDatapoints[errorDpIndex].year,
                  status: errorDatapoints[errorDpIndex].correctionStatus
                }
                if (dpCodesData.length > 0) {
                  let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
                  if (yearfind > -1) {
                    dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", errorDatapoints[errorDpIndex].year)
                  } else {
                    dpCodesData.push(datapointsObject);
                  }
                } else {
                  dpCodesData.push(datapointsObject);
                }
              }

            }
            break;
          case BOARD_MATRIX:
            const [errorboardDatapoints, boardMemberEq] = await Promise.all([
              BoardMembersMatrixDataPoints.find({
                ...dptypeQuery,
                isActive: true,
                dpStatus: 'Error'
              }).skip(+offset)
                .limit(+limit)
                .sort({ updatedAt: -1 })
                .populate([{
                  path: 'datapointId',
                  populate: {
                    path: 'keyIssueId'
                  }
                }]),
              BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 }).lean()
            ]);
            for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex]);
              const boardMemberGt = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp } }).lean();
              const mergeBoardMemberList = _.concat(boardMemberEq, boardMemberGt);

              for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                let boardNameValue = {
                  label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                  value: mergeBoardMemberList[boardMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if (boardDpCodesData.boardMemberList.length > 0) {
                  let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                  if (boardMemberValues.length > 0) {
                    let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                    boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    boardDpCodesData.boardMemberList.push(boardNameValue);
                  }
                } else {
                  boardDpCodesData.boardMemberList.push(boardNameValue);
                }
              }
            }
            for (let errorDpIndex = 0; errorDpIndex < errorboardDatapoints.length; errorDpIndex++) {
              _.filter(boardDpCodesData.boardMemberList, (object) => {
                if (object.label == errorboardDatapoints[errorDpIndex].memberName) {
                  let boardDatapointsObject = {
                    dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
                    dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
                    dpName: errorboardDatapoints[errorDpIndex].datapointId.name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: errorboardDatapoints[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status: errorboardDatapoints[errorDpIndex].correctionStatus
                  }
                  if (boardDpCodesData.dpCodesData.length > 0) {
                    let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorboardDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorboardDatapoints[errorDpIndex].memberName);
                    if (yearfind > -1) {
                      boardDpCodesData.dpCodesData[yearfind].fiscalYear = boardDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", errorboardDatapoints[errorDpIndex].year)
                    } else {
                      boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                    }
                  } else {
                    boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                  }
                }
              })
            }
            break;
          case KMP_MATRIX:
          case 'KMP Matrix':
            let errorkmpDatapoints = await KmpMatrixDataPoints.find({
              taskId: req.params.taskId,
              companyId: taskDetails.companyId.id,
              year: {
                $in: currentYear
              },
              isActive: true,
              dpStatus: 'Error',
              status: true
            }).skip(+offset)
              .limit(+limit)
              .sort({ updatedAt: -1 })
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);
            let kmpMemberEq = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 });
            for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let yearSplit = currentYear[currentYearIndex].split('-');
              let endDateString = yearSplit[1] + "-12-31";
              let yearTimeStamp = Math.floor(new Date(endDateString).getTime() / 1000);
              let kmpMemberGt = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp } });
              console.log(1614709800, yearTimeStamp)
              let mergeKmpMemberList = _.concat(kmpMemberEq, kmpMemberGt);

              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                let kmpNameValue = {
                  label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                  value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if (kmpDpCodesData.kmpMemberList.length > 0) {
                  let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                  if (kmpMemberValues.length > 0) {
                    let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                    kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                  }
                } else {
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                }
              }
            }
            for (let errorDpIndex = 0; errorDpIndex < errorkmpDatapoints.length; errorDpIndex++) {
              _.filter(kmpDpCodesData.kmpMemberList, (object) => {
                if (object.label == errorkmpDatapoints[errorDpIndex].memberName) {
                  let kmpDatapointsObject = {
                    dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
                    dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
                    dpName: errorkmpDatapoints[errorDpIndex].datapointId.name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: errorkmpDatapoints[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status: errorkmpDatapoints[errorDpIndex].correctionStatus
                  }
                  if (kmpDpCodesData.dpCodesData.length > 0) {
                    let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorkmpDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorkmpDatapoints[errorDpIndex].memberName);
                    if (yearfind > -1) {
                      kmpDpCodesData.dpCodesData[yearfind].fiscalYear = kmpDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", errorkmpDatapoints[errorDpIndex].year)
                    } else {
                      kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                    }
                  } else {
                    kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                  }
                }
              });
            }
            break;
          default:
            return res.json({
              status: 500,
              message: 'Invalid dp type'
            });
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

    } else if (taskDetails.taskStatus == CorrectionCompleted) {
      if (dpTypeValues.length > 1) {
        try {
          let errorDatapoints = await StandaloneDatapoints.find({
            taskId: req.params.taskId,
            companyId: taskDetails.companyId.id,
            year: {
              $in: currentYear
            },
            isActive: true,
            dpStatus: 'Correction',
            status: true
          }).skip(+offset)
            .limit(+limit)
            .sort({ updatedAt: -1 })
            .populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);
          for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {
            let datapointsObject = {
              dpCode: errorDatapoints[errorDpIndex].datapointId.code,
              dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
              dpName: errorDatapoints[errorDpIndex].datapointId.name,
              companyId: taskDetails.companyId.id,
              companyName: taskDetails.companyId.companyName,
              keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
              keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
              pillarId: taskDetails.categoryId.id,
              pillar: taskDetails.categoryId.categoryName,
              fiscalYear: errorDatapoints[errorDpIndex].year,
              status: errorDatapoints[errorDpIndex].correctionStatus
            }
            if (dpCodesData.length > 0) {
              let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", errorDatapoints[errorDpIndex].year);
              } else {
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
      for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {
        switch (dpTypeValues[dpTypeIndex]) {
          case BOARD_MATRIX:
            const boardMemberEq = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 }).lean();
            for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex])
              const boardMemberGt = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp } }).lean();
              const mergeBoardMemberList = _.concat(boardMemberEq, boardMemberGt);
              for (let boardMemberNameListIndex = 0; boardMemberNameListIndex < mergeBoardMemberList.length; boardMemberNameListIndex++) {
                let boardNameValue = {
                  label: mergeBoardMemberList[boardMemberNameListIndex].BOSP004,
                  value: mergeBoardMemberList[boardMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if (boardDpCodesData.boardMemberList.length > 0) {
                  let boardMemberValues = boardDpCodesData.boardMemberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                  if (boardMemberValues.length > 0) {
                    let memberIndex = boardDpCodesData.boardMemberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                    boardDpCodesData.boardMemberList[memberIndex].year = boardDpCodesData.boardMemberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    boardDpCodesData.boardMemberList.push(boardNameValue);
                  }
                } else {
                  boardDpCodesData.boardMemberList.push(boardNameValue);
                }
              }
            }
            let errorboardDatapoints = await BoardMembersMatrixDataPoints.find({
              ...dptypeQuery,
              isActive: true,
              dpStatus: 'Correction'
            }).skip(+offset)
              .limit(+limit)
              .sort({ updatedAt: -1 })
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);
            if (errorboardDatapoints.length > 0) {
              for (let errorDpIndex = 0; errorDpIndex < errorboardDatapoints.length; errorDpIndex++) {
                _.filter(boardDpCodesData.boardMemberList, (object) => {
                  if (object.label == errorboardDatapoints[errorDpIndex].memberName) {
                    let boardDatapointsObject = {
                      dpCode: errorboardDatapoints[errorDpIndex].datapointId.code,
                      dpCodeId: errorboardDatapoints[errorDpIndex].datapointId.id,
                      dpName: errorboardDatapoints[errorDpIndex].datapointId.name,
                      companyId: taskDetails.companyId.id,
                      companyName: taskDetails.companyId.companyName,
                      keyIssueId: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                      keyIssue: errorboardDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                      pillarId: taskDetails.categoryId.id,
                      pillar: taskDetails.categoryId.categoryName,
                      fiscalYear: errorboardDatapoints[errorDpIndex].year,
                      memberName: object.label,
                      memberId: object.value,
                      status: errorboardDatapoints[errorDpIndex].correctionStatus
                    }
                    if (boardDpCodesData.dpCodesData.length > 0) {
                      let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorboardDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorboardDatapoints[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        boardDpCodesData.dpCodesData[yearfind].fiscalYear = boardDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", errorboardDatapoints[errorDpIndex].year)
                      } else {
                        boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                      }
                    } else {
                      boardDpCodesData.dpCodesData.push(boardDatapointsObject);
                    }
                  }
                })
              }

            }
            break;
          case KMP_MATRIX:
          case 'KMP Matrix':
            const kmpMemberEq = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 }).lean();
            for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
              let yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex]);
              let kmpMemberGt = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp } }).lean();
              let mergeKmpMemberList = _.concat(kmpMemberEq, kmpMemberGt);

              for (let kmpMemberNameListIndex = 0; kmpMemberNameListIndex < mergeKmpMemberList.length; kmpMemberNameListIndex++) {
                let kmpNameValue = {
                  label: mergeKmpMemberList[kmpMemberNameListIndex].MASP003,
                  value: mergeKmpMemberList[kmpMemberNameListIndex].id,
                  year: currentYear[currentYearIndex]
                }
                if (kmpDpCodesData.kmpMemberList.length > 0) {
                  let kmpMemberValues = kmpDpCodesData.kmpMemberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                  if (kmpMemberValues.length > 0) {
                    let memberIndex = kmpDpCodesData.kmpMemberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                    kmpDpCodesData.kmpMemberList[memberIndex].year = kmpDpCodesData.kmpMemberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                  }
                } else {
                  kmpDpCodesData.kmpMemberList.push(kmpNameValue);
                }
              }
            }
            let errorkmpDatapoints = await KmpMatrixDataPoints.find({
              taskId: req.params.taskId,
              companyId: taskDetails.companyId.id,
              year: {
                $in: currentYear
              },
              isActive: true,
              dpStatus: 'Correction',
              status: true
            }).skip(+offset)
              .limit(+limit)
              .sort({ updatedAt: -1 })
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);
            if (errorkmpDatapoints.length > 0) {
              for (let errorDpIndex = 0; errorDpIndex < errorkmpDatapoints.length; errorDpIndex++) {
                _.filter(kmpDpCodesData.kmpMemberList, (object) => {
                  if (object.label == errorkmpDatapoints[errorDpIndex].memberName) {
                    let kmpDatapointsObject = {
                      dpCode: errorkmpDatapoints[errorDpIndex].datapointId.code,
                      dpCodeId: errorkmpDatapoints[errorDpIndex].datapointId.id,
                      dpName: errorkmpDatapoints[errorDpIndex].datapointId.name,
                      companyId: taskDetails.companyId.id,
                      companyName: taskDetails.companyId.companyName,
                      keyIssueId: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                      keyIssue: errorkmpDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                      pillarId: taskDetails.categoryId.id,
                      pillar: taskDetails.categoryId.categoryName,
                      fiscalYear: errorkmpDatapoints[errorDpIndex].year,
                      memberName: object.label,
                      memberId: object.value,
                      status: errorkmpDatapoints[errorDpIndex].correctionStatus
                    }
                    if (kmpDpCodesData.dpCodesData.length > 0) {
                      let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == errorkmpDatapoints[errorDpIndex].datapointId.code && obj.memberName == errorkmpDatapoints[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        kmpDpCodesData.dpCodesData[yearfind].fiscalYear = kmpDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", errorkmpDatapoints[errorDpIndex].year)
                      } else {
                        kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                      }
                    } else {
                      kmpDpCodesData.dpCodesData.push(kmpDatapointsObject);
                    }
                  }
                });
              }

            }
            break;
          case STANDALONE:
            const errorDatapoints = await StandaloneDatapoints.find({
              ...dptypeQuery,
              isActive: true,
              dpStatus: 'Correction'
            }).skip(+offset)
              .limit(+limit)
              .sort({ updatedAt: -1 }).populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);
            for (let errorDpIndex = 0; errorDpIndex < errorDatapoints.length; errorDpIndex++) {
              let datapointsObject = {
                dpCode: errorDatapoints[errorDpIndex].datapointId.code,
                dpCodeId: errorDatapoints[errorDpIndex].datapointId.id,
                dpName: errorDatapoints[errorDpIndex].datapointId.name,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: errorDatapoints[errorDpIndex].datapointId.keyIssueId.id,
                keyIssue: errorDatapoints[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                pillarId: taskDetails.categoryId.id,
                pillar: taskDetails.categoryId.categoryName,
                fiscalYear: errorDatapoints[errorDpIndex].year,
                status: errorDatapoints[errorDpIndex].correctionStatus
              }
              if (dpCodesData.length > 0) {
                let yearfind = dpCodesData.findIndex(obj => obj.dpCode == errorDatapoints[errorDpIndex].datapointId.code);
                if (yearfind > -1) {
                  dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", errorDatapoints[errorDpIndex].year)
                } else {
                  dpCodesData.push(datapointsObject);
                }
              } else {
                dpCodesData.push(datapointsObject);
              }

            }
            break;
          default:
            return res.json({
              status: 500,
              message: 'Invalid dp type'
            });
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
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });

  }
}

function getDpMemberGt(currentyear) {
  const yearSplit = currentyear.split('-');
  const endDateString = yearSplit[1] + "-12-31";
  const yearTimeStamp = Math.floor(new Date(endDateString).getTime() / 1000);
  return yearTimeStamp;

}