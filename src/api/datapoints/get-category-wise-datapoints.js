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
export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    const { taskId, dpType, keyIssueId, memberId, memberName, page, limit } = req.body;

    if (!page || !limit) {
      return res.status(500).json({
        status: 500,
        message: 'Limit and Page Missing'
      });
    }

    let [keyIssuesList, datapointList] = [[], {
      memberList: [],
      dpCodesData: []
    }];

    const [taskDetails, functionId, getIsDerivedCalculationCompleted] = await Promise.all([
      TaskAssignment.findOne({
        _id: taskId
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
        _id: taskId
      },
        {
          _id: 0,
          isDerviedCalculationCompleted: 1
        })

    ]);

    const currentYear = taskDetails.year.split(",");

    let [query, dptypeQuery] = [{
      taskId: taskId,
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
    console.log('test', dpType);

    const dpTypeValues = await Datapoints.find(dptypeQuery).distinct('dpType').lean();

    const [currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails] = await
      Promise.all([
        StandaloneDatapoints.find(query).populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId'),
        BoardMembersMatrixDataPoints.find({...query, memberName}).populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId'),
        KmpMatrixDataPoints.find({...query, memberName}).populate('createdBy')
          .populate('datapointId')
          .populate('companyId')
          .populate('taskId')
      ]);

    // For Search using key-issues.
    let keyIssuesDpIds;
    let errorQuery = {
      taskId: req.params?.taskId,
      companyId: taskDetails?.companyId?.id,
      isActive: true,
      status: true
    }

    if (keyIssueId) {
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
          dpCodeData: datapointList.dpCodesData
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
        await TaskAssignment.updateOne({ _id: taskId }, { $set: { taskStatus: Completed } });
      }

      if (dpTypeValues.length > 1 && dpTypeValues > 0) {
        if (keyIssueId) {
          dptypeQuery = {
            ...dptypeQuery,
            _id: keyIssuesDpIds
          }
        }

        const keyIssuesCollection = await Datapoints.find({
          dataCollection: 'Yes',
          functionId: {
            "$ne": functionId.id
          },
          clientTaxonomyId: taskDetails?.companyId?.clientTaxonomyId.id,
          categoryId: taskDetails?.categoryId.id,
          status: true
        })
          .sort({ code: 1 })
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
          }).skip(+page)
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
                    memberId: "",
                    memberName: "",
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
                  datapointList.dpCodesData.push(datapointsObject);
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
                    memberId: "",
                    memberName: "",
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
                  datapointList.dpCodesData.push(datapointsObject);
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
                  if (datapointList.memberList.length > 0) {
                    let boardMemberValues = datapointList.memberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                    if (boardMemberValues.length > 0) {
                      let memberIndex = datapointList.memberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                      datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                    } else {
                      datapointList.memberList.push(boardNameValue);
                    }
                  } else {
                    datapointList.memberList.push(boardNameValue);
                  }
                }
              }
              for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                for (let boarMemberListIndex = 0; boarMemberListIndex < datapointList.memberList.length; boarMemberListIndex++) {
                  // initisalised object.
                  if (datapointList.memberList[boarMemberListIndex].value == memberId) {
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
                      fiscalYear: datapointList.memberList[boarMemberListIndex].year,
                      memberName: datapointList.memberList[boarMemberListIndex].label,
                      memberId: datapointList.memberList[boarMemberListIndex].value,
                      status: "Yet to Start"
                    }
                    // filtered data to get status.
                    for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                      _.filter(currentAllBoardMemberMatrixDetails, (object) => {
                        if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id
                          && object.year == currentYear[currentYearIndex]
                          && object.memberName == datapointList.memberList[boarMemberListIndex].label) {
                          boardDatapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                        }
                      })
                    }
                    datapointList.dpCodesData.push(boardDatapointsObject);
                  }
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
                  if (datapointList.memberList.length > 0) {
                    let kmpMemberValues = datapointList.memberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                    if (kmpMemberValues.length > 0) {
                      let memberIndex = datapointList.memberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                      datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                    } else {
                      datapointList.memberList.push(kmpNameValue);
                    }
                  } else {
                    datapointList.memberList.push(kmpNameValue);
                  }
                }
              }
              for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                for (let kmpMemberListIndex = 0; kmpMemberListIndex < datapointList.memberList.length; kmpMemberListIndex++) {
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
                    fiscalYear: datapointList.memberList[kmpMemberListIndex].year,
                    memberName: datapointList.memberList[kmpMemberListIndex].label,
                    memberId: datapointList.memberList[kmpMemberListIndex].value,
                    status: 'Yet to Start'
                  }
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllKmpMatrixDetails, (object) => {
                      if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && object.memberName == datapointList.memberList[kmpMemberListIndex].label) {
                        kmpDatapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed'
                      }
                    })
                  }
                  datapointList.dpCodesData.push(kmpDatapointsObject);
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
          datapointList,
          isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted

        });
      } else {
        for (let dpTypeIndex = 0; dpTypeIndex < dpTypeValues.length; dpTypeIndex++) {

          if (keyIssueId) {
            dptypeQuery = {
              ...dptypeQuery,
              _id: keyIssuesDpIds, // doubt id or _id 
            }
          }

          let dpTypeDatapoints = await Datapoints.find(
            {
              dataCollection: 'Yes',
              functionId: {
                "$ne": functionId.id
              },
              clientTaxonomyId: taskDetails?.companyId?.clientTaxonomyId.id,
              categoryId: taskDetails?.categoryId.id,
              status: true,
              dpType: dpTypeValues[dpTypeIndex]
            })
            .sort({ code: 1 })
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
                memberId: "",
                memberName: "",
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
              datapointList.dpCodesData.push(datapointsObject);
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
                memberId: "",
                memberName: "",
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
              datapointList.dpCodesData.push(datapointsObject);
            }
          }
        }
        datapointList.dpCodesData.sort((a, b) => (a.dpCode > b.dpCode) ? 1 : ((b.dpCode > a.dpCode) ? -1 : 0))
        return res.status(200).send({
          status: "200",
          message: "Data collection dp codes retrieved successfully!",
          repFinalSubmit: repFinalSubmit,
          keyIssuesList: keyIssuesList,
          datapointList,
          isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
        });
      }

    } else if (taskDetails.taskStatus == CorrectionPending) {
      if (dpTypeValues.length > 1 && dpTypeValues > 0) {
        try {
          const errorDatapoints = await StandaloneDatapoints.find({ ...errorQuery, dpStatus: Error })
            .skip(+page).limit(+limit)
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
            if (datapointList.dpCodesData.length > 0) {
              let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
              } else {
                datapointList.dpCodesData.push(datapointsObject);
              }
            } else {
              datapointList.dpCodesData.push(datapointsObject);
            }
          }
          return res.status(200).send({
            status: "200",
            message: "Data correction dp codes retrieved successfully!",
            keyIssuesList,
            datapointList,
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
                .skip(+page)
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
                  memberId: "",
                  memberName: "",
                  fiscalYear: orderedDpCodes[errorDpIndex]?.year,
                  status: orderedDpCodes[errorDpIndex]?.correctionStatus
                }
                if (datapointList.dpCodesData.length > 0) {
                  let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                  if (yearfind > -1) {
                    datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                  } else {
                    datapointList.dpCodesData.push(datapointsObject);
                  }
                } else {
                  datapointList.dpCodesData.push(datapointsObject);
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
              }).skip(+page)
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
                if (datapointList.memberList.length > 0) {
                  let boardMemberValues = datapointList.memberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                  if (boardMemberValues.length > 0) {
                    let memberIndex = datapointList.memberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                    datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    datapointList.memberList.push(boardNameValue);
                  }
                } else {
                  datapointList.memberList.push(boardNameValue);
                }
              }
            }
            for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
              _.filter(datapointList.memberList, (object) => {
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
                  if (datapointList.dpCodesData.length > 0) {
                    let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                    if (yearfind > -1) {
                      datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                    } else {
                      datapointList.dpCodesData.push(boardDatapointsObject);
                    }
                  } else {
                    datapointList.dpCodesData.push(boardDatapointsObject);
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
            }).skip(+page)
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
                if (datapointList.memberList.length > 0) {
                  let kmpMemberValues = datapointList.memberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                  if (kmpMemberValues.length > 0) {
                    let memberIndex = datapointList.memberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                    datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    datapointList.memberList.push(kmpNameValue);
                  }
                } else {
                  datapointList.memberList.push(kmpNameValue);
                }
              }
            }
            for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
              _.filter(datapointList.memberList, (object) => {
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
                  if (datapointList.dpCodesData.length > 0) {
                    let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                    if (yearfind > -1) {
                      datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                    } else {
                      datapointList.dpCodesData.push(kmpDatapointsObject);
                    }
                  } else {
                    datapointList.dpCodesData.push(kmpDatapointsObject);
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
        keyIssuesList,
        datapointList,
        isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
      });

    } else if (taskDetails.taskStatus == CorrectionCompleted) {
      if (dpTypeValues.length > 1 && dpTypeValues > 0) {
        try {
          let errorDatapoints = await StandaloneDatapoints.find({
            ...errorQuery,
            year: {
              $in: currentYear
            },
            dpStatus: Correction
          }).skip(+page)
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
              memberId: "",
              memberName: "",
              fiscalYear: orderedDpCodes[errorDpIndex].year,
              status: orderedDpCodes[errorDpIndex].correctionStatus
            }
            if (datapointList.dpCodesData.length > 0) {
              let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year);
              } else {
                datapointList.dpCodesData.push(datapointsObject);
              }
            } else {
              datapointList.dpCodesData.push(datapointsObject);
            }
          }
          return res.status(200).send({
            status: "200",
            message: "Data correction dp codes retrieved successfully!",
            keyIssuesList,
            datapointList,
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
            }).skip(+page)
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
                memberId: "",
                memberName: "",
                fiscalYear: orderedDpCodes[errorDpIndex].year,
                status: orderedDpCodes[errorDpIndex].correctionStatus
              }
              if (datapointList.dpCodesData.length > 0) {
                let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                if (yearfind > -1) {
                  datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                } else {
                  datapointList.dpCodesData.push(datapointsObject);
                }
              } else {
                datapointList.dpCodesData.push(datapointsObject);
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
                if (datapointList.memberList.length > 0) {
                  let boardMemberValues = datapointList.memberList.filter((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id);
                  if (boardMemberValues.length > 0) {
                    let memberIndex = datapointList.memberList.findIndex((obj) => obj.value == mergeBoardMemberList[boardMemberNameListIndex].id)
                    datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    datapointList.memberList.push(boardNameValue);
                  }
                } else {
                  datapointList.memberList.push(boardNameValue);
                }
              }
            }
            let errorboardDatapoints = await BoardMembersMatrixDataPoints.find({
              ...errorQuery,
              year: {
                $in: currentYear
              },
              dpStatus: Correction
            }).skip(+page)
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
                _.filter(datapointList.memberList, (object) => {
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
                    if (datapointList.dpCodesData.length > 0) {
                      let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                      } else {
                        datapointList.dpCodesData.push(boardDatapointsObject);
                      }
                    } else {
                      datapointList.dpCodesData.push(boardDatapointsObject);
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
                if (datapointList.memberList.length > 0) {
                  let kmpMemberValues = datapointList.memberList.filter((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id);
                  if (kmpMemberValues.length > 0) {
                    let memberIndex = datapointList.memberList.findIndex((obj) => obj.value == mergeKmpMemberList[kmpMemberNameListIndex].id)
                    datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ',' + currentYear[currentYearIndex];
                  } else {
                    datapointList.memberList.push(kmpNameValue);
                  }
                } else {
                  datapointList.memberList.push(kmpNameValue);
                }
              }
            }
            let errorkmpDatapoints = await KmpMatrixDataPoints.find({
              ...errorQuery,
              year: {
                $in: currentYear
              },
              dpStatus: Correction
            }).skip(+page)
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
                _.filter(datapointList.memberList, (object) => {
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
                    if (datapointList.dpCodesData.length > 0) {
                      let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(",", orderedDpCodes[errorDpIndex].year)
                      } else {
                        datapointList.dpCodesData.push(kmpDatapointsObject);
                      }
                    } else {
                      datapointList.dpCodesData.push(kmpDatapointsObject);
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
        keyIssuesList,
        datapointList,
        isDerviedCalculationCompleted: getIsDerivedCalculationCompleted?.isDerviedCalculationCompleted
      });
    } else {
      return res.json({
        status: 500,
        message: 'Invalid Task Status'
      })
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