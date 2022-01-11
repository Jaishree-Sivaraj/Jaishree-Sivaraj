import _ from 'lodash';
import { Datapoints } from '.'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { Functions } from '../functions'
import { TaskAssignment } from '../taskAssignment'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp';
import { Pending, CollectionCompleted, CorrectionPending, Correction, CorrectionCompleted, VerificationCompleted, Completed, Error } from '../../constants/task-status';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { KeyIssues } from '../key_issues';
export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    const { offset, limit, keyIssueName } = req.query;

    let [keyIssuesList, boardDpCodesData, kmpDpCodesData, dpCodesData] = [[], {
      boardMemberList: [],
      dpCodesData: []
    }, {
      kmpMemberList: [],
      dpCodesData: []
    },
    []];

    const [taskDetails, functionId, getIsDerivedCalculationCompleted] = await Promise.all([
      TaskAssignment.findOne({
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
      }),

      TaskAssignment.findOne({
        _id: req.params.taskId
      },
        {
          _id: 0,
          isDerviedCalculationCompleted: 1
        })

    ]);

    const currentYear = taskDetails.year.split(",");

    let [query, dptypeQuery] = [{
      taskId: req.params.taskId,
      companyId: taskDetails.companyId.id,
      year: {
        $in: currentYear
      },
      isActive: true,
      status: true
    },
    {
      dataCollection: 'Yes',
      functionId: {
        "$ne": functionId.id
      },
      clientTaxonomyId: taskDetails?.companyId?.clientTaxonomyId.id,
      categoryId: taskDetails?.categoryId.id,
      status: true
    }];

    const dpTypeValues = await Datapoints.find(dptypeQuery).distinct('dpType').lean();

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

    // For Search using key-issues.
    let keyIssueId;
    let keyIssuesDpIds;
    let errorQuery = {
      taskId: req.params?.taskId,
      companyId: taskDetails?.companyId?.id,
      isActive: true,
      status: true
    }

    if (keyIssueName) {
      const dbQuery = {};
      Object.assign(dbQuery, { keyIssueName: { $regex: keyIssueName, $options: 'i' } });
      // Finding keyIssue id using key issue name.
      keyIssueId = await KeyIssues.findOne(dbQuery, { id: 1 });

      // Finding dp code using the keyissueId.
      keyIssuesDpIds = await Datapoints.find({
        categoryId: taskDetails.categoryId.id,
        keyIssueId
      }).distinct('_id');

      // building query accoridng to param.
      errorQuery = {
        ...errorQuery,
        datapointId: { $in: keyIssuesDpIds }
      }
    }
    let orderedDpCodes;
    const taskStatus = [Pending, CollectionCompleted, VerificationCompleted, Completed];
    if (taskStatus.includes(taskDetails.taskStatus)) {
      if (dpTypeValues.length < 0) {
        return res.status(400).json({
          status: "400",
          message: "No dp codes available",
          dpCodeData: dpCodesData
        });
      }
      let isDpcodeValidForCollection = false;
      let message = "Please Complete Priority Dpcodes";
      let repFinalSubmit = false;

      const mergedDatapoints = _.concat(currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails)
      const checkHasError = _.filter(mergedDatapoints, function (o) { return o.hasError == true; });

      const datapointsCount = await Datapoints.distinct('_id', {
        ...dptypeQuery,
        isPriority: true
      }).lean();
      const priorityDpCodesCount = await StandaloneDatapoints.find({
        ...dptypeQuery,
        datapointId: { $in: datapointsCount },
        isActive: true
      }).lean();
      const priorityCount = datapointsCount.length * currentYear.length;


      if (priorityDpCodesCount.length == priorityCount) {
        isDpcodeValidForCollection = true
        message = '';
      }

      if (checkHasError.length > 0) {
        repFinalSubmit = true; //!should be false.
      } else if (taskDetails.taskStatus == VerificationCompleted || taskDetails.taskStatus == Completed) {
        await TaskAssignment.updateOne({ _id: req.params.taskId }, { $set: { taskStatus: Completed } });
      }

      if (dpTypeValues.length === 1) {
        if (keyIssueName) {
          dptypeQuery = {
            ...dptypeQuery,
            _id: keyIssuesDpIds
          }
        }

        const keyIssuesCollection = await Datapoints.find(dptypeQuery)
          .sort({ code: 1 })
          .skip(+offset)
          .limit(+limit)
          .populate('keyIssueId');

        const keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
        keyIssueListObject.map(keyIssue => {
          keyIssuesList.push({
            label: keyIssue.keyIssueId.keyIssueName,
            value: keyIssue.keyIssueId.id
          })
        });

        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {

          let dpTypeDatapoints = await Datapoints.find({
            ...dptypeQuery, dpType: dpTypeValues[dpTypeIndex]
          }).skip(+offset)
            .limit(+limit)
            .sort({ code: 1 })
            .populate('keyIssueId')
            .populate('categoryId');

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
              let boardMemberEq = await BoardMembers.find(dpQuery).lean();
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
          kmpMatrix: kmpDpCodesData,
          isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted

        });
      } else {
        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {

          if (keyIssueName) {
            dptypeQuery = {
              ...dptypeQuery,
              _id: keyIssuesDpIds, // doubt id or _id 
            }
          }

          let dpTypeDatapoints = await Datapoints.find({
            ...dptypeQuery,
            dpType: dpTypeValues[dpTypeIndex]
          }).sort({ code: 1 })
            .skip(+offset)
            .limit(+limit)
            .populate('keyIssueId')
            .populate('categoryId');

            
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
        dpCodesData.sort((a,b) => (a.dpCode > b.dpCode) ? 1 : ((b.dpCode > a.dpCode) ? -1 : 0))
        return res.status(200).send({
          status: "200",
          message: "Data collection dp codes retrieved successfully!",
          repFinalSubmit: repFinalSubmit,
          keyIssuesList: keyIssuesList,
          standalone: {
            dpCodesData
          },
          isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
        });
      }

    } else if (taskDetails.taskStatus == CorrectionPending) {
      if (dpTypeValues.length === 1) {
        try {
          const errorDatapoints = await StandaloneDatapoints.find({ ...errorQuery, dpStatus: Error })
            .skip(+offset).limit(+limit)
            .populate({
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }).lean();

          orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);

          for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
            let datapointsObject = {
              dpCode: orderedDpCodes[errorDpIndex]?.datapointId.code,
              dpCodeId: orderedDpCodes[errorDpIndex]?.datapointId?.id,
              dpName: orderedDpCodes[errorDpIndex]?.datapointId.name,
              companyId: taskDetails?.companyId?.id,
              companyName: taskDetails?.companyId.companyName,
              keyIssueId: orderedDpCodes[errorDpIndex]?.datapointId.keyIssueId?.id,
              keyIssue: orderedDpCodes[errorDpIndex]?.datapointId.keyIssueId.keyIssueName,
              pillarId: taskDetails?.categoryId?.id,
              pillar: taskDetails?.categoryId.categoryName,
              fiscalYear: orderedDpCodes[errorDpIndex]?.year,
              status: orderedDpCodes[errorDpIndex]?.correctionStatus
            }
            if (dpCodesData.length > 0) {
              let yearfind = dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
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
            },
            isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
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
                ...errorQuery,
                dpStatus: Error
              })
                .skip(+offset)
                .limit(+limit)
                .populate([{
                  path: 'datapointId',
                  populate: {
                    path: 'keyIssueId'
                  }
                }]);
              orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);

              for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {

                let datapointsObject = {
                  dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
                  dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
                  dpName: orderedDpCodes[errorDpIndex].datapointId.name,
                  companyId: taskDetails?.companyId?.id,
                  companyName: taskDetails.companyId?.companyName,
                  keyIssueId: orderedDpCodes[errorDpIndex].datapointId?.keyIssueId?.id,
                  keyIssue: orderedDpCodes[errorDpIndex]?.datapointId?.keyIssueId?.keyIssueName,
                  pillarId: taskDetails?.categoryId?.id,
                  pillar: taskDetails?.categoryId?.categoryName,
                  fiscalYear: orderedDpCodes[errorDpIndex]?.year,
                  status: orderedDpCodes[errorDpIndex]?.correctionStatus
                }
                if (dpCodesData.length > 0) {
                  let yearfind = dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                  if (yearfind > -1) {
                    dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
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
                ...errorQuery,
                year: {
                  $in: currentYear
                },
                dpStatus: Error
              }).skip(+offset)
                .limit(+limit)
                .populate([{
                  path: 'datapointId',
                  populate: {
                    path: 'keyIssueId'
                  }
                }]),
              BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 }).lean()
            ]);
            orderedDpCodes = _.orderBy(errorboardDatapoints, ['datapointId.code'], ['asc']);
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
            for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
              _.filter(boardDpCodesData.boardMemberList, (object) => {
                if (object.label == orderedDpCodes[errorDpIndex].memberName) {
                  let boardDatapointsObject = {
                    dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
                    dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
                    dpName: orderedDpCodes[errorDpIndex].datapointId.name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: orderedDpCodes[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status: orderedDpCodes[errorDpIndex].correctionStatus
                  }
                  if (boardDpCodesData.dpCodesData.length > 0) {
                    let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                    if (yearfind > -1) {
                      boardDpCodesData.dpCodesData[yearfind].fiscalYear = boardDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
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
            let [errorkmpDatapoints, kmpMemberEq] = await Promise.all([KmpMatrixDataPoints.find({
              ...errorQuery,
              year: {
                $in: currentYear
              },
              dpStatus: Error
            }).skip(+offset)
              .limit(+limit)
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]),
            Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 })
            ]);

            orderedDpCodes = _.orderBy(errorkmpDatapoints, ['datapointId.code'], ['asc']);

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
            for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
              _.filter(kmpDpCodesData.kmpMemberList, (object) => {
                if (object.label == orderedDpCodes[errorDpIndex].memberName) {
                  let kmpDatapointsObject = {
                    dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
                    dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
                    dpName: orderedDpCodes[errorDpIndex].datapointId.name,
                    companyId: taskDetails.companyId.id,
                    companyName: taskDetails.companyId.companyName,
                    keyIssueId: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.id,
                    keyIssue: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                    pillarId: taskDetails.categoryId.id,
                    pillar: taskDetails.categoryId.categoryName,
                    fiscalYear: orderedDpCodes[errorDpIndex].year,
                    memberName: object.label,
                    memberId: object.value,
                    status: orderedDpCodes[errorDpIndex].correctionStatus
                  }
                  if (kmpDpCodesData.dpCodesData.length > 0) {
                    let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                    if (yearfind > -1) {
                      kmpDpCodesData.dpCodesData[yearfind].fiscalYear = kmpDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
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
            break;
          // return res.json({
          //   status: 500,
          //   message: 'Invalid dp type'
          // });
        }
      }
      return res.status(200).send({
        status: "200",
        message: "Data correction dp codes retrieved successfully!",
        standalone: {
          dpCodesData: dpCodesData
        },
        boardMatrix: boardDpCodesData,
        kmpMatrix: kmpDpCodesData,
        isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
      });

    } else if (taskDetails.taskStatus == CorrectionCompleted) {
      if (dpTypeValues.length === 1) {
        try {
          let errorDatapoints = await StandaloneDatapoints.find({
            ...errorQuery,
            year: {
              $in: currentYear
            },
            dpStatus: Correction
          }).skip(+offset)
            .limit(+limit)
            .populate([{
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            }]);


          orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);

          for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
            let datapointsObject = {
              dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
              dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
              dpName: orderedDpCodes[errorDpIndex].datapointId.name,
              companyId: taskDetails.companyId.id,
              companyName: taskDetails.companyId.companyName,
              keyIssueId: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.id,
              keyIssue: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.keyIssueName,
              pillarId: taskDetails.categoryId.id,
              pillar: taskDetails.categoryId.categoryName,
              fiscalYear: orderedDpCodes[errorDpIndex].year,
              status: orderedDpCodes[errorDpIndex].correctionStatus
            }
            if (dpCodesData.length > 0) {
              let yearfind = dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year);
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
            },
            isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
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
            const errorDatapoints = await StandaloneDatapoints.find({
              ...errorQuery,
              dpStatus: Correction
            }).skip(+offset)
              .limit(+limit)
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);
            orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);

            for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
              let datapointsObject = {
                dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
                dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
                dpName: orderedDpCodes[errorDpIndex].datapointId.name,
                companyId: taskDetails.companyId.id,
                companyName: taskDetails.companyId.companyName,
                keyIssueId: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.id,
                keyIssue: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                pillarId: taskDetails.categoryId.id,
                pillar: taskDetails.categoryId.categoryName,
                fiscalYear: orderedDpCodes[errorDpIndex].year,
                status: orderedDpCodes[errorDpIndex].correctionStatus
              }
              if (dpCodesData.length > 0) {
                let yearfind = dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                if (yearfind > -1) {
                  dpCodesData[yearfind].fiscalYear = dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                } else {
                  dpCodesData.push(datapointsObject);
                }
              } else {
                dpCodesData.push(datapointsObject);
              }

            }
            break;
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
              ...errorQuery,
              year: {
                $in: currentYear
              },
              dpStatus: Correction
            }).skip(+offset)
              .limit(+limit)
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);

            orderedDpCodes = _.orderBy(errorboardDatapoints, ['datapointId.code'], ['asc']);

            if (orderedDpCodes.length > 0) {
              for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
                _.filter(boardDpCodesData.boardMemberList, (object) => {
                  if (object.label == orderedDpCodes[errorDpIndex].memberName) {
                    let boardDatapointsObject = {
                      dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
                      dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
                      dpName: orderedDpCodes[errorDpIndex].datapointId.name,
                      companyId: taskDetails.companyId.id,
                      companyName: taskDetails.companyId.companyName,
                      keyIssueId: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.id,
                      keyIssue: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                      pillarId: taskDetails.categoryId.id,
                      pillar: taskDetails.categoryId.categoryName,
                      fiscalYear: orderedDpCodes[errorDpIndex].year,
                      memberName: object.label,
                      memberId: object.value,
                      status: orderedDpCodes[errorDpIndex].correctionStatus
                    }
                    if (boardDpCodesData.dpCodesData.length > 0) {
                      let yearfind = boardDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        boardDpCodesData.dpCodesData[yearfind].fiscalYear = boardDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
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
              ...errorQuery,
              year: {
                $in: currentYear
              },
              dpStatus: Correction
            }).skip(+offset)
              .limit(+limit)
              .populate([{
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              }]);
            orderedDpCodes = _.orderBy(errorkmpDatapoints, ['datapointId.code'], ['asc']);

            if (orderedDpCodes.length > 0) {
              for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
                _.filter(kmpDpCodesData.kmpMemberList, (object) => {
                  if (object.label == orderedDpCodes[errorDpIndex].memberName) {
                    let kmpDatapointsObject = {
                      dpCode: orderedDpCodes[errorDpIndex].datapointId.code,
                      dpCodeId: orderedDpCodes[errorDpIndex].datapointId.id,
                      dpName: orderedDpCodes[errorDpIndex].datapointId.name,
                      companyId: taskDetails.companyId.id,
                      companyName: taskDetails.companyId.companyName,
                      keyIssueId: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.id,
                      keyIssue: orderedDpCodes[errorDpIndex].datapointId.keyIssueId.keyIssueName,
                      pillarId: taskDetails.categoryId.id,
                      pillar: taskDetails.categoryId.categoryName,
                      fiscalYear: orderedDpCodes[errorDpIndex].year,
                      memberName: object.label,
                      memberId: object.value,
                      status: orderedDpCodes[errorDpIndex].correctionStatus
                    }
                    if (kmpDpCodesData.dpCodesData.length > 0) {
                      let yearfind = kmpDpCodesData.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        kmpDpCodesData.dpCodesData[yearfind].fiscalYear = kmpDpCodesData.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
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
          default:
            break;
          // return res.json({
          //   status: 500,
          //   message: 'Invalid dp type'
          // });
        }
      }
      return res.status(200).send({
        status: "200",
        message: "Data correction dp codes retrieved successfully!",
        standalone: {
          dpCodesData: dpCodesData
        },
        boardMatrix: boardDpCodesData,
        kmpMatrix: kmpDpCodesData,
        isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
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