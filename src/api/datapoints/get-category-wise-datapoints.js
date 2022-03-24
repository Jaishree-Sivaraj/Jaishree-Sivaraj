import _ from 'lodash';
import { Datapoints } from '.'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { Functions } from '../functions'
import { TaskAssignment } from '../taskAssignment'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp';
import { YetToStart, Pending, CollectionCompleted, CorrectionPending, ReassignmentPending, Correction, CorrectionCompleted, VerificationCompleted, Completed, Error } from '../../constants/task-status';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { CompanyRepresentative, ClientRepresentative } from '../../constants/roles';

// When the code was coded only standalone dp Type have priority dp code and it belongs to all Social, Environment and Governance pillar.
export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    const { taskId, dpType, keyIssueId, memberId, memberName, categoryId, page, limit, dpCode, dpName } = req.body;

    // Error message if page and limit is not present.
    if (!page || !limit) {
      return res.status(500).json({
        status: 500,
        message: 'Limit and Page Missing'
      });
    }

    let generalMatchQuery = {};

    if (dpCode !== '') {
      generalMatchQuery.code = { $regex: new RegExp(dpCode, 'gi') };
    }

    // initialising variables.
    let [keyIssuesList, datapointList] = [
      [],
      {
        memberList: [],
        dpCodesData: []
      }];

    // Finding taskDetails, Controversial function id and isDerivedCalculationCompleted Flag.
    const [taskDetails, functionId] = await Promise.all([
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
      })
    ]);

    const currentYear = taskDetails.year.split(", ");

    // Generic Queries used all over files..
    let [query, dptypeQuery, errorQuery] = [
      //  query 
      {
        taskId: taskId,
        companyId: taskDetails.companyId.id,
        year: {
          $in: currentYear
        },
        isActive: true,
        status: true
      },
      // dptypeQuery
      {
        dataCollection: 'Yes',
        functionId: {
          "$ne": functionId.id
        },
        clientTaxonomyId: taskDetails?.categoryId?.clientTaxonomyId,
        categoryId: taskDetails?.categoryId.id,
        status: true
      },
      // errorQuery
      {
        taskId,
        companyId: taskDetails?.companyId?.id,
        isActive: true,
        status: true
      }
    ];

    // For Standalone and boardMatrix search
    let datapointCodeQuery;
    if (dpCode !== '') {
      const datapointListQuery = await Datapoints.findOne({ ...generalMatchQuery, categoryId: taskDetails?.categoryId });
      datapointCodeQuery = datapointListQuery?._id
    }
    let countQuery = { ...dptypeQuery, dpType: dpType, ...generalMatchQuery };

    if (keyIssueId !== '') {
      countQuery = { ...dptypeQuery, dpType: dpType, ...generalMatchQuery, keyIssueId };
    }
    
    if (memberName !== '') {
      let memberDp;
      switch (dpType) {
        case BOARD_MATRIX:
          memberDp = await BoardMembersMatrixDataPoints.distinct('datapointId'
            , { memberName, status: true, isActive: true });
          countQuery = { ...countQuery, _id: memberDp };
          break;
        case KMP_MATRIX:
          memberDp = await KmpMatrixDataPoints.distinct('datapointId'
            , { memberName, status: true, isActive: true });
          countQuery = { ...countQuery, _id: memberDp };
          break;
        default:
          break;
      }

    }
    
    if (taskDetails.taskStatus == CorrectionPending || taskDetails.taskStatus == ReassignmentPending) {
      let allDpDetails;
      const errQuery = { taskId: taskDetails?._id, status: true, isActive: true, dpStatus: 'Error' }
      switch (dpType) {
        case STANDALONE:
          allDpDetails = await StandaloneDatapoints.distinct('datapointId', errQuery);
          break;
        case BOARD_MATRIX:
          allDpDetails = await BoardMembersMatrixDataPoints.distinct('datapointId', { ...errQuery, memberName })
          break;
        case KMP_MATRIX:
          allDpDetails = await KmpMatrixDataPoints.distinct('datapointId', { ...errQuery, memberName })
          break;
        default:
          break;

      }
      countQuery = { ...countQuery, _id: { $in: allDpDetails } }

    }
    // Counting datapoint just with keyIssueId filter as board-matrix and kmp-matrix dp codes will not be displayed without memberid.
    let [count, dpTypeValues, priorityDpCodes, currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails] = await Promise.all([
      Datapoints.countDocuments(countQuery),
      Datapoints.find(dptypeQuery).distinct('dpType'),
      // !Discuss pagination later. when priority dp more than 10. more than 10...
      Datapoints.find(keyIssueId !== '' ? { ...dptypeQuery, isPriority: true, keyIssueId, ...generalMatchQuery } : { ...dptypeQuery, isPriority: true, ...generalMatchQuery })
        .populate('keyIssueId')
        .populate('categoryId'),
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

    // Checking for pirority Dp codes is only done when task Status is pending as during data collection only we need to be careful and aware.
    let orderedDpCodes;
    switch (taskDetails.taskStatus) {
      case Pending:
      case CollectionCompleted:
      case VerificationCompleted:
      case CorrectionCompleted:
      case Completed:
        // Error message if there is no dpTypes.
        if (dpTypeValues.length < 0) {
          return res.status(400).json({
            status: "400",
            message: "No dp codes available"
          });
        }
        let repFinalSubmit = false;
        let mergedDatapoints, distinctDpIds = [];
        if (taskDetails.taskStatus == CorrectionCompleted) {
          currentAllStandaloneDetails = _.filter(currentAllStandaloneDetails, function (o) { return o.dpStatus == "Correction"; });
          currentAllBoardMemberMatrixDetails = _.filter(currentAllBoardMemberMatrixDetails, function (o) { return o.dpStatus == "Correction"; });
          currentAllKmpMatrixDetails = _.filter(currentAllKmpMatrixDetails, function (o) { return o.dpStatus == "Correction"; });
          mergedDatapoints = _.concat(currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails);
          distinctDpIds = _.uniq(_.map(mergedDatapoints, 'datapointId'));
        } else {
          mergedDatapoints = _.concat(currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails);
        }
        const checkHasError = _.filter(mergedDatapoints, function (o) { return o.hasError == true; });
        if (checkHasError.length > 0) { // only when rep raises error they can submit.
          repFinalSubmit = true;
        } else if (taskDetails.taskStatus == VerificationCompleted || taskDetails.taskStatus == Completed) {
          await TaskAssignment.updateOne({ _id: taskId }, { $set: { taskStatus: Completed } });
        }

        // If priority Dp Codes are not collected then only priority Dp codes are responded.
        // comparing all  priority Dp code with merged DpCodes and getting total priority dp collection
        const totalPriortyDataCollected = mergedDatapoints.filter(mergedData => {
          return priorityDpCodes.find(priortyDp => {
            return priortyDp.id == mergedData.datapointId.id;
          });
        });

        const totalUniquePriortyDpCollected = totalPriortyDataCollected.length / currentYear.length;
        // If priority DP code have not been completed then show only priority Dp codes.
        if (priorityDpCodes.length !== totalUniquePriortyDpCollected) {
          keyIssuesList = await getKeyIssues({ ...dptypeQuery, isPriority: true }, keyIssuesList);
          for (let datapointsIndex = 0; datapointsIndex < priorityDpCodes.length; datapointsIndex++) {
            let datapointsObject = getDpObjectDetailsForStandalone(priorityDpCodes[datapointsIndex], taskDetails);
            for (let currentYearIndex = datapointsIndex; currentYearIndex < currentYear.length; currentYearIndex++) {
              _.filter(currentAllStandaloneDetails, (object) => {
                if (object.datapointId.id == priorityDpCodes[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                  datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                }
              })
            }
            datapointList.dpCodesData.push(datapointsObject);
          }
          return res.status(200).json({
            status: "200",
            message: "Data collection dp codes retrieved successfully!",
            response: {
              keyIssuesList,
              datapointList,
              count: priorityDpCodes.length,
              isPriority: true
            }
          });
        }

        // If all priority Dp codes are completed we get all Dp codes including Priority Dp codes.
        if (dpTypeValues.includes(BOARD_MATRIX) || dpTypeValues.includes(KMP_MATRIX)) {
          try {
            if (req.user.userType == CompanyRepresentative || req.user.userType == ClientRepresentative) {
              dptypeQuery.isRequiredForReps = true
            }
            if (taskDetails.taskStatus == CorrectionCompleted && distinctDpIds?.length > 0) {
              dptypeQuery._id = { $in: distinctDpIds };
            }

            const dpTypeDatapoints = await
              Datapoints.find({
                ...dptypeQuery,
                dpType: dpType,
                ...generalMatchQuery
              }
              ).skip((page - 1) * limit)
                .limit(+limit)
                .sort({ code: 1 })
                .populate('keyIssueId')
                .populate('categoryId');
            // This is to find the members in board-matrix and kmp-matrix.
            const dpQuery = { companyId: taskDetails.companyId.id, endDateTimeStamp: 0, status: true };
            switch (dpType) {
              case STANDALONE:
                keyIssuesList = await getKeyIssues(dptypeQuery, keyIssuesList);
                for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
                  let datapointsObject = getDpObjectDetailsForStandalone(dpTypeDatapoints[datapointsIndex], taskDetails);
                  for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                    _.filter(currentAllStandaloneDetails, (object) => {
                      if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id
                        && object.year == currentYear[currentYearIndex]) {
                        datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                      }
                    })
                  }
                  datapointList.dpCodesData.push(datapointsObject);
                }
                return res.status(200).send({
                  status: "200",
                  message: "Data collection dp codes retrieved successfully!",
                  response: {
                    repFinalSubmit,
                    keyIssuesList,
                    datapointList,
                    isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                    count: datapointList.dpCodesData.length < 1 ? 0 : count,
                    isPriority: false
                  }

                });
              case BOARD_MATRIX:
                let boardMemberEq = await BoardMembers.find(dpQuery);
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                  const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex]);
                  const boardMemberGt = await BoardMembers.find({
                    companyId: taskDetails.companyId.id,
                    endDateTimeStamp: { $gt: yearTimeStamp },
                    status: true
                  });
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
                        datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ', ' + currentYear[currentYearIndex];
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
                    //TODO: Getting DpCodes only belonging to the request memberId.
                    if (datapointList.memberList[boarMemberListIndex].value == memberId) {
                      let boardDatapointsObject = getMemberDataPoint(dpTypeDatapoints[datapointsIndex], datapointList.memberList[boarMemberListIndex], taskDetails);
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
                return res.status(200).send({
                  status: "200",
                  message: "Data collection dp codes retrieved successfully!",
                  response: {
                    repFinalSubmit: repFinalSubmit,
                    datapointList,
                    isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                    count: datapointList?.dpCodesData?.length < 1 ? 0 : count,
                    isPriority: false
                  }

                });
              case KMP_MATRIX:
                const kmpMemberEq = await Kmp.find(dpQuery);
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                  const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex]);

                  const kmpMemberGt = await Kmp.find({
                    companyId: taskDetails.companyId.id,
                    endDateTimeStamp: { $gt: yearTimeStamp },
                    status: true
                  });
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
                        datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ', ' + currentYear[currentYearIndex];
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
                    if (datapointList.memberList[kmpMemberListIndex].value == memberId) {
                      let kmpDatapointsObject = getMemberDataPoint(dpTypeDatapoints[datapointsIndex], datapointList.memberList[kmpMemberListIndex], taskDetails);
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
                }

                return res.status(200).send({
                  status: "200",
                  message: "Data collection dp codes retrieved successfully!",
                  response: {
                    repFinalSubmit: repFinalSubmit,
                    datapointList,
                    isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                    count: datapointList?.dpCodesData?.length < 1 ? 0 : count,
                    isPriority: false

                  }
                });
              default:
                return res.status(500).send({
                  status: "500",
                  message: "Invalid dp type",
                });
            }
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: error?.message ? error?.message : 'Failed to fetch all Dp code'
            })
          }
        } else if (dpType == STANDALONE) {
          try {
            let query = keyIssueId ? {
              ...dptypeQuery,
              keyIssueId,
            } : dptypeQuery;

            // Filtering with the Reps
            if (req.user.userType == CompanyRepresentative || req.user.userType == ClientRepresentative) {
              query.isRequiredForReps = true
            }
            if (taskDetails.taskStatus == CorrectionCompleted && distinctDpIds.length > 0) {
              query._id = { $in: distinctDpIds };
            }

            const dpTypeDatapoints = await Datapoints.find({ ...query, ...generalMatchQuery })
              .skip(((page - 1) * limit))
              .limit(+limit)
              .sort({ code: 1 })
              .populate('keyIssueId')
              .populate('categoryId');

            keyIssuesList = await getKeyIssues(dptypeQuery, keyIssuesList);
            for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints.length; datapointsIndex++) {
              let datapointsObject = getDpObjectDetailsForStandalone(dpTypeDatapoints[datapointsIndex], taskDetails);
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                _.filter(currentAllStandaloneDetails, (object) => {
                  if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                    datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                  }
                })
              }
              datapointList.dpCodesData.push(datapointsObject);
            }

            return res.status(200).json({
              status: "200",
              message: "Data collection dp codes retrieved successfully!",
              response: {
                repFinalSubmit,
                keyIssuesList,
                datapointList,
                isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                count: datapointList?.dpCodesData?.length < 1 ? 0 : count,
                isPriority: false

              }
            });

          } catch (error) {
            return res.status(409).json({
              status: 409,
              message: error?.message ? error?.message : 'Failed to fetch all dp codes'
            });
          }
        } else {
          return res.status(200).json({
            status: 200,
            message: 'No datapoints available'
          });
        }
      case ReassignmentPending:
      case CorrectionPending:
        if (dpTypeValues.includes(BOARD_MATRIX) || dpTypeValues.includes(KMP_MATRIX)) {
          try {
            errorQuery = { ...errorQuery, dpStatus: Error };
            switch (dpType) {
              case STANDALONE:
                errorQuery = keyIssueId === '' ? errorQuery : await getQueryWithKeyIssue(errorQuery, keyIssueId, datapointCodeQuery);
                errorQuery = datapointCodeQuery ? { ...errorQuery, datapointId: datapointCodeQuery } : errorQuery;
                const errorDatapoints = await StandaloneDatapoints.find(errorQuery)
                  .skip((page - 1) * limit)
                  .limit(+limit)
                  .populate([{
                    path: 'datapointId',
                    populate: {
                      path: 'keyIssueId'
                    }
                  }]);

                orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
                keyIssuesList = await getKeyIssues(dptypeQuery, keyIssuesList);
                for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {

                  let datapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                  datapointsObject = {
                    ...datapointsObject,
                    memberId: "",
                    memberName: ""
                  };
                  if (datapointList.dpCodesData.length > 0) {
                    let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                    if (yearfind > -1) {
                      datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(", ", orderedDpCodes[errorDpIndex].year)
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
                  response: {
                    keyIssuesList,
                    datapointList,
                    isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                    count: datapointList.dpCodesData.length < 1 ? 0 : count,
                    isPriority: false

                  }
                });
              case BOARD_MATRIX:
                errorQuery = memberName === '' ? errorQuery : { ...errorQuery, memberName };
                errorQuery = datapointCodeQuery ? { ...errorQuery, datapointId: datapointCodeQuery } : errorQuery;
                const [errorboardDatapoints, boardMemberEq] = await Promise.all([
                  BoardMembersMatrixDataPoints.find({
                    ...errorQuery,
                    year: {
                      $in: currentYear
                    }
                  }).skip((page - 1) * limit)
                    .limit(+limit)
                    .populate([{
                      path: 'datapointId',
                      populate: {
                        path: 'keyIssueId'
                      }
                    }]),
                  BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: 0 })
                ]);
                orderedDpCodes = _.orderBy(errorboardDatapoints, ['datapointId.code'], ['asc']);
                for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                  const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex]);
                  const boardMemberGt = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp }, status: true });
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
                        datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ', ' + currentYear[currentYearIndex];
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
                      let boardDatapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                      boardDatapointsObject = {
                        ...boardDatapointsObject,
                        memberName: object.label,
                        memberId: object.value,
                      }
                      if (datapointList.dpCodesData.length > 0) {
                        let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                        if (yearfind > -1) {
                          datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(", ", orderedDpCodes[errorDpIndex].year)
                        } else {
                          datapointList.dpCodesData.push(boardDatapointsObject);
                        }
                      } else {
                        datapointList.dpCodesData.push(boardDatapointsObject);
                      }
                    }
                  })
                }

                return res.status(200).send({
                  status: "200",
                  message: "Data correction dp codes retrieved successfully!",
                  response: {
                    datapointList,
                    isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                    count: datapointList.dpCodesData.length < 1 ? 0 : count,
                    isPriority: false
                  }
                });
              case KMP_MATRIX:
                errorQuery = memberName === '' ? errorQuery : { ...errorQuery, memberName };
                errorQuery = datapointCodeQuery ? { ...errorQuery, datapointId: datapointCodeQuery } : errorQuery;
                let [errorkmpDatapoints, kmpMemberEq] = await Promise.all([KmpMatrixDataPoints.find({
                  ...errorQuery,
                  year: {
                    $in: currentYear
                  }
                }).skip((page - 1) * limit)
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
                  let kmpMemberGt = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gt: yearTimeStamp }, status: true });
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
                        datapointList.memberList[memberIndex].year = datapointList.memberList[memberIndex].year + ', ' + currentYear[currentYearIndex];
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
                      let kmpDatapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                      kmpDatapointsObject = {
                        ...kmpDatapointsObject,
                        memberName: object.label,
                        memberId: object.value,
                      }
                      if (datapointList.dpCodesData.length > 0) {
                        let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                        if (yearfind > -1) {
                          datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(", ", orderedDpCodes[errorDpIndex].year)
                        } else {
                          datapointList.dpCodesData.push(kmpDatapointsObject);
                        }
                      } else {
                        datapointList.dpCodesData.push(kmpDatapointsObject);
                      }
                    }
                  });
                }
                return res.status(200).send({
                  status: "200",
                  message: "Data correction dp codes retrieved successfully!",
                  response: {
                    datapointList,
                    isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                    count: datapointList.dpCodesData.length < 1 ? 0 : count,
                    isPriority: false
                  }
                });
              default:
                return res.status(500).send({
                  status: "500",
                  message: "Invalid Dp Type value"
                });
            }
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: error?.message ? error?.message : 'Failed to fetch all dp codes'
            });
          }
        } else if (dpType == STANDALONE) {
          try {
            errorQuery = { ...errorQuery, dpStatus: Error };
            errorQuery = keyIssueId === '' ? errorQuery : await getQueryWithKeyIssue(errorQuery, keyIssueId, datapointCodeQuery);
            errorQuery = datapointCodeQuery ? { ...errorQuery, datapointId: datapointCodeQuery } : errorQuery;
            const errorDatapoints = await StandaloneDatapoints.find(errorQuery)
              .skip((page - 1) * limit)
              .limit(+limit)
              .populate({
                path: 'datapointId',
                populate: {
                  path: 'keyIssueId'
                }
              });

            orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
            keyIssuesList = await getKeyIssues(dptypeQuery, keyIssuesList);
            for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
              let datapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
              if (datapointList.dpCodesData.length > 0) {
                let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                if (yearfind > -1) {
                  datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(", ", orderedDpCodes[errorDpIndex].year)
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
              response: {
                keyIssuesList,
                datapointList,
                isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                count: datapointList.dpCodesData.length < 1 ? 0 : count,
                isPriority: false
              }
            });
          } catch (error) {
            return res.status(500).json({
              message: error
            });
          }
        } else {
          return res.status(200).json({
            status: 200,
            message: 'No datapoints available'
          });
        }

      default:
        return res.status(409).json({
          status: 409,
          message: 'Invalid Task Status'
        });
    }


  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error?.message ? error?.message : 'Failed to fetch all dp codes'
    });

  }
}

// Generic Functions.

function getDpMemberGt(currentyear) {
  const yearSplit = currentyear.split('-');
  const endDateString = yearSplit[1] + "-12-31";
  const yearTimeStamp = Math.floor(new Date(endDateString).getTime() / 1000);
  return yearTimeStamp;
}

function getDpObjectDetailsForStandalone(dpTypeDatapoints, taskDetails) {
  return {
    dpCode: dpTypeDatapoints?.code,
    dpCodeId: dpTypeDatapoints?.id,
    dpName: dpTypeDatapoints?.name,
    companyId: taskDetails?.companyId.id,
    companyName: taskDetails?.companyId.companyName,
    keyIssueId: dpTypeDatapoints?.keyIssueId.id,
    keyIssue: dpTypeDatapoints?.keyIssueId.keyIssueName,
    pillarId: dpTypeDatapoints?.categoryId.id,
    pillar: dpTypeDatapoints?.categoryId.categoryName,
    memberId: "",
    memberName: "",
    fiscalYear: taskDetails?.year,
    status: YetToStart
  }
}

function getMemberDataPoint(dpTypeDatapoints, memberData, taskDetails) {
  return {
    dpCode: dpTypeDatapoints?.code,
    dpCodeId: dpTypeDatapoints?.id,
    dpName: dpTypeDatapoints?.name,
    companyId: taskDetails?.companyId?.id,
    companyName: taskDetails?.companyId?.companyName,
    keyIssueId: dpTypeDatapoints?.keyIssueId.id,
    keyIssue: dpTypeDatapoints?.keyIssueId.keyIssueName,
    pillarId: dpTypeDatapoints?.categoryId.id,
    pillar: dpTypeDatapoints?.categoryId.categoryName,
    dataType: dpTypeDatapoints?.dataType,
    fiscalYear: memberData?.year,
    memberName: memberData?.label,
    memberId: memberData?.value,
    status: YetToStart
  }
}

function getDpObjectForCorrrection(orderedDpCodes, taskDetails) {
  return {
    dpCode: orderedDpCodes?.datapointId?.code,
    dpCodeId: orderedDpCodes?.datapointId?.id,
    dpName: orderedDpCodes?.datapointId?.name,
    companyId: taskDetails?.companyId?.id,
    companyName: taskDetails?.companyId.companyName,
    keyIssueId: orderedDpCodes?.datapointId.keyIssueId?.id,
    keyIssue: orderedDpCodes?.datapointId.keyIssueId.keyIssueName,
    pillarId: taskDetails?.categoryId?.id,
    pillar: taskDetails?.categoryId.categoryName,
    fiscalYear: orderedDpCodes?.year,
    status: orderedDpCodes?.correctionStatus



  }
}

async function getKeyIssues(dptypeQuery, keyIssuesList) {
  const keyIssuesCollection = await Datapoints.find(dptypeQuery)
    .sort({ code: 1 })
    .populate('keyIssueId');

  const keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
  keyIssueListObject.map(keyIssue => {
    keyIssuesList.push({
      label: keyIssue.keyIssueId.keyIssueName,
      value: keyIssue.keyIssueId.id
    })
  });
  return keyIssuesList;
}

async function getQueryWithKeyIssue(errorQuery, keyIssueId, datapointCodeQuery) {
  const datapointwithKeyIssue = await Datapoints.distinct('_id', { keyIssueId });
  if (datapointCodeQuery) {
    datapointwithKeyIssue.push(datapointwithKeyIssue);
  }

  errorQuery = {
    ...errorQuery,
    datapointId: { $in: datapointwithKeyIssue }
  }
  return errorQuery;
}


