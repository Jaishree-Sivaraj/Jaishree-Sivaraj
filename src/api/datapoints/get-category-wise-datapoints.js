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
import { ClientTaxonomy } from '../clientTaxonomy';
// When the code was coded only standalone dp Type have priority dp code and it belongs to all Social, Environment and Governance pillar.
export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    const { taskId, dpType, keyIssueId, memberId, memberName, page, limit, searchValue } = req.body;

    // Error message 
    if (!page || !limit) {
      return res.status(500).json({
        status: 500,
        message: 'Missing page and limit'
      });
    }

    // initialising variables.
    let keyIssuesList = [], datapointList = { memberList: [], dpCodesData: [] };

    const [taskDetails, functionId] = await Promise.all([
      TaskAssignment.findOne({
        _id: taskId
      }).populate({
        path: 'companyId',
        populate: {
          path: 'clientTaxonomyId'
        }
      }).populate('categoryId'),
      Functions.findOne({
        functionType: 'Negative News',
        status: true
      })
    ]);
    const fiscalYearEndMonth = taskDetails.companyId.fiscalYearEndMonth;
    const fiscalYearEndDate = taskDetails.companyId.fiscalYearEndDate;
    
    const currentYear = taskDetails.year.split(', ');
    console.log(currentYear);

    let queryForDpTypeCollection = {
      taskId: taskId,
      companyId: taskDetails.companyId.id,
      year: { $in: currentYear },
      isActive: true,
      status: true
    },
      queryForDatapointCollection = {
        dataCollection: 'Yes',
        functionId: { $ne: functionId.id },
        clientTaxonomyId: taskDetails?.categoryId?.clientTaxonomyId,
        categoryId: taskDetails?.categoryId.id,
        status: true,

      },
      queryForHasError = {
        taskId,
        companyId: taskDetails?.companyId?.id,
        isActive: true,
        status: true
      };
    let queryKeyIssueSearch = queryForDatapointCollection;

    // Queries when there is a searchValue added.
    let searchQuery = {};
    searchQuery = searchValue !== '' ? getSearchQuery(searchValue, searchQuery) : searchQuery;

    // Query based on searchQuery.
    const datapointCodeQuery = searchValue !== '' ?
      await Datapoints.distinct('_id', { ...searchQuery, categoryId: taskDetails?.categoryId }) : [];

    let conditionalTaskStatus = [CorrectionPending, ReassignmentPending, CorrectionCompleted];
    let queryToCountDocuments = { ...queryForDatapointCollection, dpType };

    conditionalTaskStatus.includes(taskDetails?.taskStatus) ?
      queryToCountDocuments = await getConditionalTaskStatusCount(dpType, taskDetails, queryToCountDocuments, memberName)
      : queryToCountDocuments;

    queryToCountDocuments = datapointCodeQuery.length > 0 ?
      { ...queryToCountDocuments, dpType, _id: { $in: datapointCodeQuery } }
      : queryToCountDocuments;

    queryToCountDocuments = keyIssueId !== '' ?
      { ...queryToCountDocuments, keyIssueId }
      : queryToCountDocuments;

    if (req.user.userType == CompanyRepresentative || req.user.userType == ClientRepresentative) {
      queryToCountDocuments.isRequiredForReps = true
    }
    queryForDatapointCollection = { ...queryForDatapointCollection, ...searchQuery };
    queryForDatapointCollection = keyIssueId !== '' ?
      { ...queryForDatapointCollection, keyIssueId }
      : queryForDatapointCollection;

    const {
      count,
      dpTypeValues,
      priorityDpCodes,
      currentAllStandaloneDetails,
      currentAllBoardMemberMatrixDetails,
      currentAllKmpMatrixDetails,

    } = await getDocumentCountAndPriorityDataAndAllDpTypeDetails(queryToCountDocuments, queryForDatapointCollection, queryForDpTypeCollection);

    const clientTaxonomyDetails = await ClientTaxonomy.findOne({ _id: taskDetails?.categoryId?.clientTaxonomyId }, { isDerivedCalculationRequired: 1 } )

  // Checking for pirority Dp codes is only done when task Status is pending as during data collection only we need to be careful and aware.
  let orderedDpCodes;
  switch (taskDetails.taskStatus) {
    case Pending:
    case CollectionCompleted:
    case VerificationCompleted:
    case Completed:
      // Error message if there is no dpTypes.
      if (dpTypeValues?.length < 0) {
        return res.status(400).json({
          status: '400',
          message: 'No dp codes available'
        });
      }

      let repFinalSubmit = false;
      let mergedDatapoints, distinctDpIds = [];

      if (taskDetails.taskStatus == VerificationCompleted || taskDetails.taskStatus == Completed) {
        await TaskAssignment.updateOne({ _id: taskId }, { $set: { taskStatus: Completed } });
      }

      mergedDatapoints = _.concat(currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails);
      // if (taskDetails.taskStatus == CorrectionCompleted) {
      //   const allStandaloneDetails = getFilteredData(currentAllStandaloneDetails);
      //   const allBoardMemberMatrixDetails = getFilteredData(currentAllBoardMemberMatrixDetails);
      //   const allKmpMatrixDetails = getFilteredData(currentAllKmpMatrixDetails);
      //   const correctionPendingMergedDatapoints = _.concat(allStandaloneDetails, allBoardMemberMatrixDetails, allKmpMatrixDetails);
      //   distinctDpIds = _.uniq(_.map(correctionPendingMergedDatapoints, 'datapointId'));
      // }

      const checkHasError = _.filter(mergedDatapoints, function (o) { return o?.hasError == true; });
      // only when rep raises error they can submit.const
      repFinalSubmit = checkHasError?.length > 0 && true;

      const totalPriortyDataCollected = mergedDatapoints.filter(mergedData => {
        return priorityDpCodes.find(priortyDp => {
          return priortyDp.id == mergedData.datapointId.id;
        });
      });

      const totalUniquePriortyDpCollected = totalPriortyDataCollected?.length / currentYear?.length;
      if (priorityDpCodes.length !== totalUniquePriortyDpCollected) {
        keyIssuesList = await getKeyIssues({ ...queryForDatapointCollection, isPriority: true }, keyIssuesList);
        datapointList = await getDataPointListForStandalone(priorityDpCodes, currentYear, currentAllStandaloneDetails, taskDetails, datapointList);
        return res.status(200).json({
          status: '200',
          message: 'Data collection dp codes retrieved successfully!',
          response: {
            keyIssuesList,
            datapointList,
            count: priorityDpCodes.length,
            isPriority: true,
            fiscalYear: taskDetails?.year,
            isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
          }
        });
      }

      // If all priority Dp codes are completed we get all Dp codes including Priority Dp codes.
      if (dpTypeValues.includes(BOARD_MATRIX) || dpTypeValues.includes(KMP_MATRIX)) {
        try {
          if (req.user.userType == CompanyRepresentative || req.user.userType == ClientRepresentative) {
            queryForDatapointCollection.isRequiredForReps = true
          }
          // if (taskDetails.taskStatus == CorrectionCompleted && distinctDpIds?.length > 0) {
          //   queryForDatapointCollection._id = { $in: distinctDpIds };
          // }

          const dpTypeDatapoints = await
            Datapoints.find({
              ...queryForDatapointCollection,
              dpType: dpType,
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
              keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
              datapointList = await getDataPointListForStandalone(dpTypeDatapoints, currentYear, currentAllStandaloneDetails, taskDetails, datapointList);
              return res.status(200).send({
                status: '200',
                message: 'Data collection dp codes retrieved successfully!',
                response: {
                  repFinalSubmit,
                  keyIssuesList,
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
                }

              });
            case BOARD_MATRIX:
              let boardMemberEq = await BoardMembers.find(dpQuery);
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex], fiscalYearEndMonth, fiscalYearEndDate);
                const boardMemberGt = await BoardMembers.find({
                  companyId: taskDetails.companyId.id,
                  endDateTimeStamp: { $gte: yearTimeStamp },
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
                        let memberName = object.memberName;
                        let element = datapointList.memberList[boarMemberListIndex].label;
                        if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id
                          && object.year == currentYear[currentYearIndex]
                          && memberName.toLowerCase().includes(element.toLowerCase())) {
                          boardDatapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                        }
                      })
                    }
                    datapointList.dpCodesData.push(boardDatapointsObject);
                  }
                }
              }
              return res.status(200).send({
                status: '200',
                message: 'Data collection dp codes retrieved successfully!',
                response: {
                  repFinalSubmit: repFinalSubmit,
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList?.dpCodesData?.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
                }

              });
            case KMP_MATRIX:
              const kmpMemberEq = await Kmp.find(dpQuery);
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex], fiscalYearEndMonth, fiscalYearEndDate);

                const kmpMemberGt = await Kmp.find({
                  companyId: taskDetails.companyId.id,
                  endDateTimeStamp: { $gte: yearTimeStamp },
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
                        let memberName = object.memberName;
                        let element = datapointList.memberList[kmpMemberListIndex].label;
                        if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex] && memberName.toLowerCase().includes(element.toLowerCase())) {
                          kmpDatapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed'
                        }
                      })
                    }
                    datapointList.dpCodesData.push(kmpDatapointsObject);
                  }
                }
              }

              return res.status(200).send({
                status: '200',
                message: 'Data collection dp codes retrieved successfully!',
                response: {
                  repFinalSubmit: repFinalSubmit,
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList?.dpCodesData?.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired

                }
              });
            default:
              return res.status(500).send({
                status: '500',
                message: 'Invalid dp type',
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
          let queryForDpTypeCollection = keyIssueId !== '' ? {
            ...queryForDatapointCollection,
            keyIssueId,
          } : queryForDatapointCollection;

          // Filtering with the Reps
          if (req.user.userType == CompanyRepresentative || req.user.userType == ClientRepresentative) {
            queryForDpTypeCollection.isRequiredForReps = true
          }
          // if (taskDetails.taskStatus == CorrectionCompleted && distinctDpIds.length > 0) {
          //   queryForDpTypeCollection._id = { $in: distinctDpIds };
          // }

          const dpTypeDatapoints = await Datapoints.find({ ...queryForDpTypeCollection, ...searchQuery })
            .skip(((page - 1) * limit))
            .limit(+limit)
            .sort({ code: 1 })
            .populate('keyIssueId')
            .populate('categoryId');

          keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
          for (let datapointsIndex = 0; datapointsIndex < dpTypeDatapoints?.length; datapointsIndex++) {
            let datapointsObject = getDpObjectDetailsForStandalone(dpTypeDatapoints[datapointsIndex], taskDetails);
            for (let currentYearIndex = 0; currentYearIndex < currentYear?.length; currentYearIndex++) {
              _.filter(currentAllStandaloneDetails, (object) => {
                if (object.datapointId.id == dpTypeDatapoints[datapointsIndex].id && object.year == currentYear[currentYearIndex]) {
                  datapointsObject.status = object.correctionStatus ? object.correctionStatus : 'Completed';
                }
              })
            }
            datapointList.dpCodesData.push(datapointsObject);
          }

          return res.status(200).json({
            status: '200',
            message: 'Data collection dp codes retrieved successfully!',
            response: {
              repFinalSubmit,
              keyIssuesList,
              datapointList,
              isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
              count: datapointList?.dpCodesData?.length < 1 ? 0 : count,
              isPriority: false,
              fiscalYear: taskDetails?.year,
              isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired

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
          queryForHasError = { ...queryForHasError, dpStatus: Error };
          switch (dpType) {
            case STANDALONE:
              queryForHasError = keyIssueId === '' ? queryForHasError : await getQueryWithKeyIssue(queryForHasError, keyIssueId, datapointCodeQuery);
              queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
              const errorDatapoints = await StandaloneDatapoints.find(queryForHasError)
                .skip((page - 1) * limit)
                .limit(+limit)
                .populate([{
                  path: 'datapointId',
                  populate: {
                    path: 'keyIssueId'
                  }
                }]);

              orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
              keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
              for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {

                let datapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                datapointsObject = {
                  ...datapointsObject,
                  memberId: '',
                  memberName: ''
                };
                if (datapointList.dpCodesData.length > 0) {
                  let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                  if (yearfind > -1) {
                    datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
                  } else {
                    datapointList.dpCodesData.push(datapointsObject);
                  }
                } else {
                  datapointList.dpCodesData.push(datapointsObject);
                }
              }
              return res.status(200).send({
                status: '200',
                message: 'Data correction dp codes retrieved successfully!',
                response: {
                  keyIssuesList,
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired

                }
              });
            case BOARD_MATRIX:
              queryForHasError = memberName === '' ? queryForHasError : { ...queryForHasError, memberName: { '$regex': memberName, '$options': 'i' } };
              queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
              const [errorboardDatapoints, boardMemberEq] = await Promise.all([
                BoardMembersMatrixDataPoints.find({
                  ...queryForHasError,
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
                const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex], fiscalYearEndMonth, fiscalYearEndDate);
                const boardMemberGt = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gte: yearTimeStamp }, status: true });
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
                  let memberName = orderedDpCodes[errorDpIndex].memberName;
                  if (memberName.toLowerCase().includes((object.label).toLowerCase())) {
                    let boardDatapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                    boardDatapointsObject = {
                      ...boardDatapointsObject,
                      memberName: object.label,
                      memberId: object.value,
                    }
                    if (datapointList.dpCodesData.length > 0) {
                      let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
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
                status: '200',
                message: 'Data correction dp codes retrieved successfully!',
                response: {
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
                }
              });
            case KMP_MATRIX:
              queryForHasError = memberName === '' ? queryForHasError : { ...queryForHasError, memberName: { '$regex': memberName, '$options': 'i' } };
              queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
              let [errorkmpDatapoints, kmpMemberEq] = await Promise.all([KmpMatrixDataPoints.find({
                ...queryForHasError,
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
                let endDateString = yearSplit[1] + '-12-31';
                let yearTimeStamp = Math.floor(new Date(endDateString).getTime() / 1000);
                let kmpMemberGt = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gte: yearTimeStamp }, status: true });
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
                  let memberName = orderedDpCodes[errorDpIndex].memberName;
                  if (memberName.toLowerCase().includes((object.label).toLowerCase())) {
                    let kmpDatapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                    kmpDatapointsObject = {
                      ...kmpDatapointsObject,
                      memberName: object.label,
                      memberId: object.value,
                    }
                    if (datapointList.dpCodesData.length > 0) {
                      let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                      if (yearfind > -1) {
                        datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
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
                status: '200',
                message: 'Data correction dp codes retrieved successfully!',
                response: {
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
                }
              });
            default:
              return res.status(500).send({
                status: '500',
                message: 'Invalid Dp Type value'
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
          queryForHasError = { ...queryForHasError, dpStatus: Error };
          queryForHasError = keyIssueId === '' ? queryForHasError : await getQueryWithKeyIssue(queryForHasError, keyIssueId, datapointCodeQuery);
          queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
          const errorDatapoints = await StandaloneDatapoints.find(queryForHasError)
            .skip((page - 1) * limit)
            .limit(+limit)
            .populate({
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            });

          orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
          keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
          for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
            let datapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
            if (datapointList.dpCodesData.length > 0) {
              let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
              } else {
                datapointList.dpCodesData.push(datapointsObject);
              }
            } else {
              datapointList.dpCodesData.push(datapointsObject);
            }
          }
          return res.status(200).send({
            status: '200',
            message: 'Data correction dp codes retrieved successfully!',
            response: {
              keyIssuesList,
              datapointList,
              isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
              count: datapointList.dpCodesData.length < 1 ? 0 : count,
              isPriority: false,
              fiscalYear: taskDetails?.year,
              isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
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
    case CorrectionCompleted:
      if (dpTypeValues.includes(BOARD_MATRIX) || dpTypeValues.includes(KMP_MATRIX)) {
        try {
          queryForHasError = { ...queryForHasError, dpStatus: 'Correction' };
          switch (dpType) {
            case STANDALONE:
              queryForHasError = keyIssueId === '' ? queryForHasError : await getQueryWithKeyIssue(queryForHasError, keyIssueId, datapointCodeQuery);
              queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
              const errorDatapoints = await StandaloneDatapoints.find(queryForHasError)
                .skip((page - 1) * limit)
                .limit(+limit)
                .populate([{
                  path: 'datapointId',
                  populate: {
                    path: 'keyIssueId'
                  }
                }]);
              orderedDpCodes = _.uniq(errorDatapoints, 'datapointId');
              orderedDpCodes = _.orderBy(orderedDpCodes, ['datapointId.code'], ['asc']);

              // orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
              keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
              for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {

                let datapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                datapointsObject = {
                  ...datapointsObject,
                  memberId: '',
                  memberName: ''
                };
                if (datapointList.dpCodesData.length > 0) {
                  let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
                  if (yearfind > -1) {
                    datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
                  } else {
                    datapointList.dpCodesData.push(datapointsObject);
                  }
                } else {
                  datapointList.dpCodesData.push(datapointsObject);
                }
              }
              return res.status(200).send({
                status: '200',
                message: 'Data correction dp codes retrieved successfully!',
                response: {
                  keyIssuesList,
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired

                }
              });
            case BOARD_MATRIX:
              queryForHasError = memberName === '' ? queryForHasError : { ...queryForHasError, memberName: { '$regex': memberName, '$options': 'i' } };
              queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
              const [errorboardDatapoints, boardMemberEq] = await Promise.all([
                BoardMembersMatrixDataPoints.find({
                  ...queryForHasError,
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
              orderedDpCodes = _.uniq(errorboardDatapoints, 'datapointId');
              orderedDpCodes = _.orderBy(orderedDpCodes, ['datapointId.code'], ['asc']);
              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                const yearTimeStamp = getDpMemberGt(currentYear[currentYearIndex], fiscalYearEndMonth, fiscalYearEndDate);
                const boardMemberGt = await BoardMembers.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gte: yearTimeStamp }, status: true });
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
              if (memberName != '') {
                for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
                  _.filter(datapointList.memberList, (object) => {
                    let memberName = orderedDpCodes[errorDpIndex].memberName;
                    if (memberName.includes((object.label))) {
                      let boardDatapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                      boardDatapointsObject = {
                        ...boardDatapointsObject,
                        memberName: object.label,
                        memberId: object.value,
                      }
                      if (datapointList.dpCodesData.length > 0) {
                        let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                        if (yearfind > -1) {
                          datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
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

              return res.status(200).send({
                status: '200',
                message: 'Data correction dp codes retrieved successfully!',
                response: {
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
                }
              });
            case KMP_MATRIX:
              queryForHasError = memberName === '' ? queryForHasError : { ...queryForHasError, memberName: { '$regex': memberName, '$options': 'i' } };
              queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
              let [errorkmpDatapoints, kmpMemberEq] = await Promise.all([KmpMatrixDataPoints.find({
                ...queryForHasError,
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
              orderedDpCodes = _.uniq(errorkmpDatapoints, 'datapointId');
              orderedDpCodes = _.orderBy(orderedDpCodes, ['datapointId.code'], ['asc']);

              for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
                let yearSplit = currentYear[currentYearIndex].split('-');
                let endDateString = yearSplit[1] + '-12-31';
                let yearTimeStamp = Math.floor(new Date(endDateString).getTime() / 1000);
                let kmpMemberGt = await Kmp.find({ companyId: taskDetails.companyId.id, endDateTimeStamp: { $gte: yearTimeStamp }, status: true });
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

              if (memberName != '') {
                for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
                  _.filter(datapointList.memberList, (object) => {
                    let memberName = orderedDpCodes[errorDpIndex].memberName;
                    if (memberName.toLowerCase().includes((object.label).toLowerCase())) {
                      let kmpDatapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
                      kmpDatapointsObject = {
                        ...kmpDatapointsObject,
                        memberName: object.label,
                        memberId: object.value,
                      }
                      if (datapointList.dpCodesData.length > 0) {
                        let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code && obj.memberName == orderedDpCodes[errorDpIndex].memberName);
                        if (yearfind > -1) {
                          datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
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

              return res.status(200).send({
                status: '200',
                message: 'Data correction dp codes retrieved successfully!',
                response: {
                  datapointList,
                  isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
                  count: datapointList.dpCodesData.length < 1 ? 0 : count,
                  isPriority: false,
                  fiscalYear: taskDetails?.year,
                  isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired

                }
              });
            default:
              return res.status(500).send({
                status: '500',
                message: 'Invalid Dp Type value'
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
          queryForHasError = { ...queryForHasError, dpStatus: "Correction" };
          queryForHasError = keyIssueId === '' ? queryForHasError : await getQueryWithKeyIssue(queryForHasError, keyIssueId, datapointCodeQuery);
          queryForHasError = datapointCodeQuery.length > 0 ? { ...queryForHasError, datapointId: datapointCodeQuery } : queryForHasError;
          const errorDatapoints = await StandaloneDatapoints.find(queryForHasError)
            .skip((page - 1) * limit)
            .limit(+limit)
            .populate({
              path: 'datapointId',
              populate: {
                path: 'keyIssueId'
              }
            });
          orderedDpCodes = _.uniq(errorDatapoints, 'datapointId');
          orderedDpCodes = _.orderBy(orderedDpCodes, ['datapointId.code'], ['asc']);

          // orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
          keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
          for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
            let datapointsObject = getDpObjectForCorrrection(orderedDpCodes[errorDpIndex], taskDetails);
            if (datapointList.dpCodesData.length > 0) {
              let yearfind = datapointList.dpCodesData.findIndex(obj => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code);
              if (yearfind > -1) {
                datapointList.dpCodesData[yearfind].fiscalYear = datapointList.dpCodesData[yearfind].fiscalYear.concat(', ', orderedDpCodes[errorDpIndex].year)
              } else {
                datapointList.dpCodesData.push(datapointsObject);
              }
            } else {
              datapointList.dpCodesData.push(datapointsObject);
            }
          }
          return res.status(200).json({
            status: '200',
            message: 'Data correction dp codes retrieved successfully!',
            response: {
              keyIssuesList,
              datapointList,
              isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
              count,
              isPriority: false,
              fiscalYear: taskDetails?.year,
              isDerivedCalculationRequired: clientTaxonomyDetails?.isDerivedCalculationRequired
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

function getDpMemberGt(currentyear, month, date) {
  // The year is in Example:2020-2021 
  let year = currentyear.split('-');
  // year =['2020','2021']
  // new Date(year[0], month, 0).getDate()= this will get the number of days in a month.
  // ? If the date that is there is the last date of the month, the subsequent day will be the 1st
  const endDate = new Date(year[0], month, 0).getDate() == date ? 1 : (Number(date) + 1);
  // ? If the month is december then, the subsequent month will be the January
  // * Here month starts from 0.
  const endMonth = new Date(year[0], month, 0).getMonth() == 11 ? 0 : (Number(month));

  if (month == 12) { year[0] = (Number(year[0]) + 1) };

  const yearTimeStamp = Math.floor(new Date(year[0], endMonth, endDate).getTime() / 1000);
  return yearTimeStamp;
}

function getDpObjectDetailsForStandalone(dpTypeDatapoints, taskDetails) {
  return {
    dpCode: dpTypeDatapoints?.code,
    dpCodeId: dpTypeDatapoints?.id,
    dpName: dpTypeDatapoints?.name,
    description: dpTypeDatapoints?.description,
    companyId: taskDetails?.companyId.id,
    companyName: taskDetails?.companyId.companyName,
    keyIssueId: dpTypeDatapoints?.keyIssueId.id,
    keyIssue: dpTypeDatapoints?.keyIssueId.keyIssueName,
    pillarId: dpTypeDatapoints?.categoryId.id,
    pillar: dpTypeDatapoints?.categoryId.categoryName,
    memberId: '',
    memberName: '',
    fiscalYear: taskDetails?.year,
    status: YetToStart
  }
}

function getMemberDataPoint(dpTypeDatapoints, memberData, taskDetails) {
  return {
    dpCode: dpTypeDatapoints?.code,
    dpCodeId: dpTypeDatapoints?.id,
    dpName: dpTypeDatapoints?.name,
    description: dpTypeDatapoints?.description,
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
    description: orderedDpCodes?.datapointId?.description,
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

async function getKeyIssues(queryKeyIssueSearch, keyIssuesList) {
  const keyIssuesCollection = await Datapoints.find(queryKeyIssueSearch)
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

async function getQueryWithKeyIssue(queryForHasError, keyIssueId, datapointCodeQuery) {
  const datapointwithKeyIssue = await Datapoints.distinct('_id', { keyIssueId });
  if (datapointCodeQuery.length > 0) {
    datapointwithKeyIssue.push(datapointwithKeyIssue);
  }

  queryForHasError = {
    ...queryForHasError,
    datapointId: { $in: datapointwithKeyIssue }
  }
  return queryForHasError;
}

function getSearchQuery(searchValue, searchQuery) {
  searchQuery = {
    $or: [
      { code: { $regex: new RegExp(searchValue, 'gi') } },
      { name: { $regex: new RegExp(searchValue, 'gi') } }
    ]
  }

  return searchQuery;

}

async function getConditionalTaskStatusCount(dpType, taskDetails, queryToCountDocuments, memberName) {
  let allDpDetails;
  let dpStatus = taskDetails?.taskStatus == CorrectionCompleted ? Correction : Error;
  const query = { taskId: taskDetails?._id, status: true, isActive: true, dpStatus };
  switch (dpType) {
    case STANDALONE:
      allDpDetails = await StandaloneDatapoints.distinct('datapointId', query);
      break;
    case BOARD_MATRIX:
      allDpDetails = await BoardMembersMatrixDataPoints.distinct('datapointId', { ...query, memberName: { '$regex': memberName, '$options': 'i' } })
      break;
    case KMP_MATRIX:
      allDpDetails = await KmpMatrixDataPoints.distinct('datapointId', { ...query, memberName: { '$regex': memberName, '$options': 'i' } })
      break;
    default:
      break;

  }
  console.log(queryToCountDocuments);
  queryToCountDocuments = { ...queryToCountDocuments, _id: { $in: allDpDetails } };
  console.log(queryToCountDocuments)
  return queryToCountDocuments;
}

async function getDocumentCountAndPriorityDataAndAllDpTypeDetails(queryToCountDocuments, queryForDatapointCollection, queryForDpTypeCollection) {
  console.log(queryToCountDocuments);
  let [count, dpTypeValues, priorityDpCodes, currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails] = await Promise.all([
    Datapoints.countDocuments(queryToCountDocuments),
    Datapoints.find(queryForDatapointCollection).distinct('dpType'),
    // Priority Dp code is just for standalone Dp.
    Datapoints.find({ ...queryForDatapointCollection, isPriority: true })
      .populate('keyIssueId')
      .populate('categoryId'),
    StandaloneDatapoints.find(queryForDpTypeCollection).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId'),
    // Is memberName not needed 
    BoardMembersMatrixDataPoints.find(queryForDpTypeCollection).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId'),
    KmpMatrixDataPoints.find(queryForDpTypeCollection).populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .populate('taskId')
  ]);
  console.log(count);
  return { count, dpTypeValues, priorityDpCodes, currentAllStandaloneDetails, currentAllBoardMemberMatrixDetails, currentAllKmpMatrixDetails };
}

function getFilteredData(data) {
  data = _.filter(data, function (o) { return o.dpStatus == Correction });
  return data;
}

async function getDataPointListForStandalone(datapointData, currentYear, currentAllStandaloneDetails, taskDetails, datapointList) {

  for (let datapointsIndex = 0; datapointsIndex < datapointData.length; datapointsIndex++) {
    let datapointsObject = getDpObjectDetailsForStandalone(datapointData[datapointsIndex], taskDetails);
    for (let currentYearIndex = datapointsIndex; currentYearIndex < currentYear.length; currentYearIndex++) {
      _.filter(currentAllStandaloneDetails, (object) => {
        if (object.datapointId.id == (datapointData[datapointsIndex].id && object.year == currentYear[currentYearIndex])) {
          datapointsObject.status = object.correctionStatus ? object.correctionStatus : Completed;
        }
      })
    }
    datapointList.dpCodesData.push(datapointsObject);
  }

  return datapointList;
}

