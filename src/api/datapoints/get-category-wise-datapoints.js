import _ from 'lodash';
import { Datapoints } from '.';
import { Functions } from '../functions';
import { TaskAssignment } from '../taskAssignment';
import {
  Pending,
  CollectionCompleted,
  CorrectionPending,
  ReassignmentPending,
  CorrectionCompleted,
  VerificationCompleted,
  Completed,
  Error,
} from '../../constants/task-status';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import {
  CompanyRepresentative,
  ClientRepresentative,
} from '../../constants/roles';
import { ClientTaxonomy } from '../clientTaxonomy';
import {
  getTaskStartDate,
  getSearchQuery,
  getConditionalTaskStatusCount,
  getDocumentCountAndPriorityDataAndAllDpTypeDetails,
  getFilteredDatapointForStandalone,
  getFilteredDatapointsForBMAndKM,
  getFilterdDatapointForErrorForBMAndKM,
  getFilteredErrorDatapointForStandalone,
  getResponse,
  getConditionForQualitativeAndQuantitativeDatapoints
} from './get-category-helper-function';
// When the code was coded only standalone dp Type have priority dp code and it belongs to all Social, Environment and Governance pillar.
export const getCategorywiseDatapoints = async (req, res, next) => {
  try {
    const {
      taskId,
      dpType,
      keyIssueId,
      memberId,
      memberName,
      page,
      limit,
      searchValue,
      dataType
    } = req.body;

    // Error message
    if (!page || !limit) {
      return res.status(500).json({
        status: 500,
        message: 'Missing page and limit',
      });
    }

    // initialising variables.
    let keyIssuesList = [],
      datapointList = { memberList: [], dpCodesData: [] };

    const [taskDetails, functionId] = await Promise.all([
      TaskAssignment.findOne({
        _id: taskId,
      })
        .populate({
          path: 'companyId',
          populate: {
            path: 'clientTaxonomyId',
          },
        })
        .populate('categoryId'),
      Functions.findOne({
        functionType: 'Negative News',
        status: true,
      }),
    ]);
    const fiscalYearEndMonth = taskDetails.companyId.fiscalYearEndMonth;
    const fiscalYearEndDate = taskDetails.companyId.fiscalYearEndDate;
    const currentYear = taskDetails.year.split(', ');
    //  Starting date of the task.
    let taskStartDate = getTaskStartDate(
      currentYear[0],
      fiscalYearEndMonth,
      fiscalYearEndDate
    );

    let queryForDpTypeCollection = {
      taskId: taskId,
      companyId: taskDetails.companyId.id,
      year: { $in: currentYear },
      isActive: true,
      status: true,
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
        status: true,
      };
    let queryKeyIssueSearch = queryForDatapointCollection;
    let queryForTotalPriorityDpCode = queryForDatapointCollection;

    // Queries when there is a searchValue added.
    let searchQuery = {};
    searchQuery =
      searchValue !== ''
        ? getSearchQuery(searchValue, searchQuery)
        : searchQuery;

    queryForDatapointCollection = {
      ...queryForDatapointCollection, //code and name based search.
      ...searchQuery,
    };


    // Query based on searchQuery.
    const datapointCodeQuery =
      searchValue !== ''
        ? await Datapoints.distinct('_id', { // get datapointId for dpType Collections (Standalone, BM and KM * BM=Board Matrix, KM= KMP-Matrix.)
          ...searchQuery,
          categoryId: taskDetails?.categoryId,
        })
        : [];

    let queryToCountDocuments = { ...queryForDatapointCollection, dpType }; // for counting only.

    let conditionalTaskStatus = [
      CorrectionPending,
      ReassignmentPending,
      CorrectionCompleted,
    ];
    conditionalTaskStatus.includes(taskDetails?.taskStatus)
      // dpStatus is error only error based datapoint is selected.
      ? (queryToCountDocuments = await getConditionalTaskStatusCount( // getQuery along with datapoints with Error.
        dpType,
        taskDetails,
        queryToCountDocuments,
        memberName
      ))
      : queryToCountDocuments;

    // When there is a search.
    queryToCountDocuments =
      datapointCodeQuery.length > 0
        ? { ...queryToCountDocuments, dpType, _id: { $in: datapointCodeQuery } }
        : queryToCountDocuments;

    if (keyIssueId !== '') {
      queryToCountDocuments = { ...queryToCountDocuments, keyIssueId };
      queryForDatapointCollection = { ...queryForDatapointCollection, keyIssueId }
    }

    if (dataType !== '') {
      queryForDatapointCollection = {
        ...queryForDatapointCollection, ...getConditionForQualitativeAndQuantitativeDatapoints(dataType)
      };

      queryToCountDocuments = {
        ...queryToCountDocuments, ...getConditionForQualitativeAndQuantitativeDatapoints(dataType)
      };
    }

    if (
      req.user.userType == CompanyRepresentative ||
      req.user.userType == ClientRepresentative
    ) {
      queryToCountDocuments.isRequiredForReps = true;
    }
    const {
      count,
      dpTypeValues,
      priorityDpCodes,
      totalPriorityDpWithoutFilter,
      currentAllStandaloneDetails,
      currentAllBoardMemberMatrixDetails,
      currentAllKmpMatrixDetails,
    } = await getDocumentCountAndPriorityDataAndAllDpTypeDetails(
      queryToCountDocuments,
      queryForDatapointCollection,
      queryForDpTypeCollection,
      queryForTotalPriorityDpCode
    );

    const clientTaxonomyDetails = await ClientTaxonomy.findOne(
      { _id: taskDetails?.categoryId?.clientTaxonomyId },
      { isDerivedCalculationRequired: 1 }
    );
    const isDerivedCalculationRequired = clientTaxonomyDetails?.isDerivedCalculationRequired;

    const activeMemberQuery = { companyId: taskDetails.companyId.id, status: true };
    let response = {
      status: 200,
      fiscalYear: taskDetails?.year,
      isDerviedCalculationCompleted: taskDetails?.isDerviedCalculationCompleted,
      isDerivedCalculationRequired,
    };
    // Checking for pirority Dp codes is only done when task Status is pending as during data collection only we need to be careful and aware.
    let result;
    switch (taskDetails.taskStatus) {
      case Pending:
      case CollectionCompleted:
      case VerificationCompleted:
      case Completed:
        // Error message if there is no dpTypes.
        if (dpTypeValues?.length < 0) {
          return res.status(400).json({
            status: '400',
            message: 'No dp codes available',
          });
        }

        let repFinalSubmit = false;
        let mergedDatapoints = _.concat(
          currentAllStandaloneDetails,
          currentAllBoardMemberMatrixDetails,
          currentAllKmpMatrixDetails
        );
        const checkHasError = _.filter(mergedDatapoints, function (o) {
          return o?.hasError == true;
        });
        repFinalSubmit = checkHasError?.length > 0 && true;

        const totalPriortyDataCollected = mergedDatapoints.filter(
          (mergedData) => {
            return totalPriorityDpWithoutFilter.find((priortyDp) => {
              return priortyDp.id == mergedData.datapointId.id;
            });
          }
        );

        const totalUniquePriortyDpCollected = totalPriortyDataCollected?.length / currentYear?.length;
        if (totalPriorityDpWithoutFilter?.length !== totalUniquePriortyDpCollected) {
          result = await getFilteredDatapointForStandalone(
            keyIssuesList,
            datapointList,
            queryKeyIssueSearch,
            priorityDpCodes,
            currentYear,
            currentAllStandaloneDetails,
            taskDetails,
            true
          );
          result = getResponse(result, response, count, true, repFinalSubmit);
          return res.status(200).json(result);
        }

        if (req.user.userType == CompanyRepresentative || req.user.userType == ClientRepresentative) {
          queryForDatapointCollection.isRequiredForReps = true;
        }

        const dpTypeDatapoints = await Datapoints.find({
          ...queryForDatapointCollection,
          dpType: dpType,
        })
          .skip((page - 1) * limit)
          .limit(+limit)
          .sort({ code: 1 })
          .populate('keyIssueId')
          .populate('categoryId');

        if (dpTypeValues.includes(BOARD_MATRIX) || dpTypeValues.includes(KMP_MATRIX)) {
          try {
            switch (dpType) {
              case STANDALONE:
                result = await getFilteredDatapointForStandalone(
                  keyIssuesList,
                  datapointList,
                  queryKeyIssueSearch,
                  dpTypeDatapoints,
                  currentYear,
                  currentAllStandaloneDetails,
                  taskDetails,
                  false
                );
                result = getResponse(
                  result,
                  response,
                  count,
                  false,
                  repFinalSubmit
                );
                return res.status(200).json(result);
              case BOARD_MATRIX:
                result = await getFilteredDatapointsForBMAndKM(
                  activeMemberQuery, // this is for finding the active boardMember
                  dpTypeDatapoints,// this is datapoint found
                  memberId,//from the payload
                  datapointList, //the static datas are pre-filled
                  taskDetails,
                  currentAllBoardMemberMatrixDetails,
                  taskStartDate,//starting date.
                  currentYear,
                  BOARD_MATRIX
                );
                result = getResponse(
                  result,
                  response,
                  count,
                  false,
                  repFinalSubmit
                );
                return res.status(200).json(result);
              case KMP_MATRIX:
                result = await getFilteredDatapointsForBMAndKM(
                  activeMemberQuery,
                  dpTypeDatapoints,
                  memberId,
                  datapointList,
                  taskDetails,
                  currentAllKmpMatrixDetails,
                  taskStartDate,
                  currentYear,
                  KMP_MATRIX
                );
                result = getResponse(
                  result,
                  response,
                  count,
                  false,
                  repFinalSubmit
                );
                return res.status(200).json(result);
              default:
                return res.status(500).send({
                  status: '500',
                  message: 'Invalid dp type',
                });
            }
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: error?.message
                ? error?.message
                : 'Failed to fetch all Dp code',
            });
          }
        } else if (dpType == STANDALONE) {
          try {
            result = await getFilteredDatapointForStandalone(
              keyIssuesList,
              datapointList,
              queryKeyIssueSearch,
              dpTypeDatapoints,
              currentYear,
              currentAllStandaloneDetails,
              taskDetails,
              false
            );
            result = getResponse(
              result,
              response,
              count,
              false,
              repFinalSubmit
            );
            return res.status(200).json(result);
          } catch (error) {
            return res.status(409).json({
              status: 409,
              message: error?.message
                ? error?.message
                : 'Failed to fetch all dp codes',
            });
          }
        } else {
          return res.status(200).json({
            status: 200,
            message: 'No datapoints available',
          });
        }
      case ReassignmentPending:
      case CorrectionPending:
        queryForHasError = { ...queryForHasError, dpStatus: Error };
        if (
          dpTypeValues.includes(BOARD_MATRIX) ||
          dpTypeValues.includes(KMP_MATRIX)
        ) {
          try {
            switch (dpType) {
              case STANDALONE:
                result = await getFilteredErrorDatapointForStandalone(
                  queryForHasError,
                  keyIssueId,
                  datapointCodeQuery,
                  queryKeyIssueSearch,
                  keyIssuesList,
                  taskDetails,
                  datapointList,
                  page,
                  limit,
                  dataType
                );
                result = getResponse(
                  result,
                  response,
                  count,
                  false,
                  repFinalSubmit
                );
                return res.status(200).json(result);
              case BOARD_MATRIX:
                result = await getFilterdDatapointForErrorForBMAndKM(
                  activeMemberQuery,
                  BOARD_MATRIX,
                  taskDetails,
                  currentYear,
                  datapointList,
                  queryForHasError,
                  datapointCodeQuery,
                  memberName,
                  taskStartDate,
                  false,
                  page,
                  limit,
                  memberId,
                  count,
                  dataType
                );
                result = getResponse(result, response, count, false);
                return res.status(200).json(result);
              case KMP_MATRIX:
                result = await getFilterdDatapointForErrorForBMAndKM(
                  activeMemberQuery,
                  KMP_MATRIX,
                  taskDetails,
                  currentYear,
                  datapointList,
                  queryForHasError,
                  datapointCodeQuery,
                  memberName,
                  taskStartDate,
                  false,
                  page,
                  limit,
                  memberId,
                  count,
                  dataType
                );
                result = getResponse(result, response, count, false);
                return res.status(200).json(result);
              default:
                return res.status(500).send({
                  status: '500',
                  message: 'Invalid Dp Type value',
                });
            }
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: error?.message
                ? error?.message
                : 'Failed to fetch all dp codes',
            });
          }
        } else if (dpType == STANDALONE) {
          try {
            result = await getFilteredErrorDatapointForStandalone(
              queryForHasError,
              keyIssueId,
              datapointCodeQuery,
              queryKeyIssueSearch,
              keyIssuesList,
              taskDetails,
              datapointList,
              page,
              limit
            );
            result = getResponse(result, response, count, false);
            return res.status(200).json(result);
          } catch (error) {
            return res.status(500).json({
              message: error,
            });
          }
        } else {
          return res.status(200).json({
            status: 200,
            message: 'No datapoints available',
          });
        }
      case CorrectionCompleted:
        queryForHasError = { ...queryForHasError, dpStatus: 'Correction' };
        if (
          dpTypeValues.includes(BOARD_MATRIX) ||
          dpTypeValues.includes(KMP_MATRIX)
        ) {
          try {
            switch (dpType) {
              case STANDALONE:
                result = await getFilteredErrorDatapointForStandalone(
                  queryForHasError,
                  keyIssueId,
                  datapointCodeQuery,
                  queryKeyIssueSearch,
                  keyIssuesList,
                  taskDetails,
                  datapointList,
                  page,
                  limit
                );
                result = getResponse(result, response, count, false);
                return res.status(200).json(result);
              case BOARD_MATRIX:
                result = await getFilterdDatapointForErrorForBMAndKM(
                  activeMemberQuery,
                  BOARD_MATRIX,
                  taskDetails,
                  currentYear,
                  datapointList,
                  queryForHasError,
                  datapointCodeQuery,
                  memberName,
                  taskStartDate,
                  true,
                  page,
                  limit,
                  memberId,
                  count,
                  dataType
                );
                result = getResponse(result, response, count, false);
                return res.status(200).json(result);
              case KMP_MATRIX:
                result = await getFilterdDatapointForErrorForBMAndKM(
                  activeMemberQuery,
                  KMP_MATRIX,
                  taskDetails,
                  currentYear,
                  datapointList,
                  queryForHasError,
                  datapointCodeQuery,
                  memberName,
                  taskStartDate,
                  true,
                  page,
                  limit,
                  memberId,
                  count,
                  dataType
                );
                result = getResponse(result, response, count, false);
                return res.status(200).json(result);
              default:
                return res.status(500).send({
                  status: '500',
                  message: 'Invalid Dp Type value',
                });
            }
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: error?.message
                ? error?.message
                : 'Failed to fetch all dp codes',
            });
          }
        } else if (dpType == STANDALONE) {
          try {
            result = await getFilteredErrorDatapointForStandalone(
              queryForHasError,
              keyIssueId,
              datapointCodeQuery,
              queryKeyIssueSearch,
              keyIssuesList,
              taskDetails,
              datapointList,
              page,
              limit
            );
            result = getResponse(result, response, count, false);
            return res.status(200).json(result);
          } catch (error) {
            return res.status(500).json({
              message: error?.message,
            });
          }
        } else {
          return res.status(200).json({
            status: 200,
            message: 'No datapoints available',
          });
        }

      default:
        return res.status(409).json({
          status: 409,
          message: 'Invalid Task Status',
        });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error?.message ? error?.message : 'Failed to fetch all dp codes',
    });
  }
};

// Generic Functions.
