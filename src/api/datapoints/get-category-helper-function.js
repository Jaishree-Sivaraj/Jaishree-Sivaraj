'use strict';

import _ from 'lodash';
import { Datapoints } from '.';
import { StandaloneDatapoints } from '../standalone_datapoints';
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints';
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints';
import { BoardMembers } from '../boardMembers';
import { Kmp } from '../kmp';
import {
  YetToStart,
  Correction,
  CorrectionCompleted,
  Completed,
  Error,
} from '../../constants/task-status';
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from '../../constants/dp-type';
import { format } from 'date-fns';
import { NUMBER } from '../../constants/dp-datatype';
import { getMemberJoiningDate, getTaskStartDate } from './dp-details-functions';

const QUALITATIVE = 'Qualitative';
const QUANTITATIVE = 'Quantitative';

export async function getDocumentCountAndPriorityDataAndAllDpTypeDetails(
  queryToCountDocuments,
  queryForDatapointCollection,
  queryForDpTypeCollection,
  queryForTotalPriorityDpCode
) {
  try {  // Here queryForDatapointCollection is dependent on the searchQuery, Filter and so.
    let [
      count,
      dpTypeValues,
      priorityDpCodes,
      totalPriorityDpWithoutFilter,
      currentAllStandaloneDetails,
      currentAllBoardMemberMatrixDetails,
      currentAllKmpMatrixDetails,
    ] = await Promise.all([
      Datapoints.countDocuments(queryToCountDocuments),
      Datapoints.find(queryForDatapointCollection).distinct('dpType'),
      // Priority Dp code is just for standalone Dp.
      Datapoints.find({ ...queryForDatapointCollection, isPriority: true })
        .populate("keyIssueId")
        .populate("categoryId"),
      Datapoints.find({ ...queryForTotalPriorityDpCode, isPriority: true })
        .populate("keyIssueId")
        .populate("categoryId"),
      StandaloneDatapoints.find(queryForDpTypeCollection)
        .populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId'),
      // Is memberName not needed
      BoardMembersMatrixDataPoints.find(queryForDpTypeCollection)
        .populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId'),
      KmpMatrixDataPoints.find(queryForDpTypeCollection)
        .populate('createdBy')
        .populate('datapointId')
        .populate('companyId')
        .populate('taskId'),
    ]);

    return {
      count,
      dpTypeValues,
      priorityDpCodes,
      totalPriorityDpWithoutFilter,
      currentAllStandaloneDetails,
      currentAllBoardMemberMatrixDetails,
      currentAllKmpMatrixDetails,
    };
  } catch (error) {
    console.log(error?.message);
  }
}

export async function getFilteredDatapointForStandalone(
  keyIssuesList,
  datapointList,
  queryKeyIssueSearch,
  dpTypeDatapoints,
  currentYear,
  currentAllStandaloneDetails,
  taskDetails,
  isPriority
) {
  try {
    keyIssuesList = await getKeyIssues(
      { ...queryKeyIssueSearch, isPriority: isPriority },
      keyIssuesList
    );
    datapointList = await getDataPointListForStandalone(
      dpTypeDatapoints,
      currentYear,
      currentAllStandaloneDetails,
      taskDetails,
      datapointList
    );
    return {
      status: '200',
      message: 'Data collection dp codes retrieved successfully!',
      response: {
        keyIssuesList,
        datapointList,
      },
    };
  } catch (error) {
    console.log(error?.message);
  }
}

export async function getKeyIssues(queryKeyIssueSearch, keyIssuesList) {
  try {
    const keyIssuesCollection = await Datapoints.find(queryKeyIssueSearch)
      .sort({ code: 1 })
      .populate('keyIssueId');

    const keyIssueListObject = _.uniqBy(keyIssuesCollection, 'keyIssueId');
    keyIssueListObject.map((keyIssue) => {
      keyIssuesList.push({
        label: keyIssue.keyIssueId.keyIssueName,
        value: keyIssue.keyIssueId.id,
      });
    });
    return keyIssuesList;
  } catch (error) { console.log(error?.message) }
}

export function getDataPointListForStandalone(
  datapointData,
  currentYear,
  currentAllStandaloneDetails,
  taskDetails,
  datapointList
) {
  try {
    for (let datapointsIndex = 0; datapointsIndex < datapointData.length; datapointsIndex++) {
      let datapointsObject = getDpObjectDetailsForStandalone(datapointData[datapointsIndex], taskDetails);

      for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
        _.filter(currentAllStandaloneDetails, (object) => {
          if (
            object.year == currentYear[currentYearIndex] &&
            object.datapointId.id == datapointData[datapointsIndex].id
          ) {
            datapointsObject.status = object.correctionStatus
              ? object.correctionStatus
              : Completed;
          }
        });
      }
      datapointList.dpCodesData.push(datapointsObject);
    }
    return datapointList;
  } catch (error) {
    console.log(error?.message);
  }
}

export function getResponse(
  result,
  response,
  count,
  isPriority,
  repFinalSubmit
) {
  result.response = {
    ...result.response,
    ...response,
    count: result?.response?.datapointList?.dpCodesData?.length < 1 ? 0 : count,
    repFinalSubmit: repFinalSubmit ? repFinalSubmit : '',
    isPriority,
  };
  return result;
}

export function getDpObjectDetailsForStandalone(dpTypeDatapoints, taskDetails) {
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
    status: YetToStart,
  };
}

export function getMemberDataPoint(dpTypeDatapoints, memberData, taskDetails) {
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
    status: YetToStart,
  };
}

export function getDpObjectForCorrrection(orderedDpCodes, taskDetails) {
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
  };
}

export async function getQueryWithKeyIssueOrDataTypeOrSearch(
  queryForHasError,
  keyIssueId,
  dataType,
  categoryId,
  datapointCodeQuery
) {

  try {
    let query = {};
    if (datapointCodeQuery?.length > 0) {
      query = { ...query, _id: { $in: datapointCodeQuery } };

    }

    if (keyIssueId !== '' && keyIssueId) {
      query = { ...query, keyIssueId };
    }

    if (dataType !== '' && dataType) {
      query = { ...query, ...getConditionForQualitativeAndQuantitativeDatapoints(dataType) };
    }

    const uniquedatapointId = await Datapoints.distinct('_id', query);
    queryForHasError = {
      ...queryForHasError,
      datapointId: { $in: uniquedatapointId },
    };
    return queryForHasError;
  } catch (error) {
    console.log(error?.message);
  }
}

export function getSearchQuery(searchValue, searchQuery) {
  searchQuery = {
    $or: [
      { code: { $regex: new RegExp(searchValue, 'gi') } },
      { name: { $regex: new RegExp(searchValue, 'gi') } },
    ],
  };

  return searchQuery;
}

export async function getConditionalTaskStatusCount(
  dpType,
  taskDetails,
  queryToCountDocuments,
  memberName
) {
  let allDpDetails;
  let dpStatus = taskDetails?.taskStatus == CorrectionCompleted ? Correction : Error;
  const query = {
    taskId: taskDetails?._id,
    status: true,
    isActive: true,
    dpStatus,
  };
  switch (dpType) {
    case STANDALONE:
      allDpDetails = await StandaloneDatapoints.distinct('datapointId', query);
      break;
    case BOARD_MATRIX:
      allDpDetails = await BoardMembersMatrixDataPoints.distinct(
        'datapointId',
        { ...query, memberName: { $regex: memberName, $options: 'i' } }
      );
      break;
    case KMP_MATRIX:
      allDpDetails = await KmpMatrixDataPoints.distinct('datapointId', {
        ...query,
        memberName: { $regex: memberName, $options: 'i' },
      });
      break;
    default:
      break;
  }

  queryToCountDocuments = {
    ...queryToCountDocuments,
    _id: { $in: allDpDetails },
  };
  return queryToCountDocuments;
}

export function getFilteredData(data) {
  data = _.filter(data, function (o) {
    return o.dpStatus == Correction;
  });
  return data;
}

// taskStartDate = starting year, company's endDate and endMonth.
export async function getMembers(activeMemberQuery, dpType, taskStartDate, currentYear, fiscalYearEndMonth, fiscalYearEndDate) {
  try {
    let memberList = []
    let memberDetails, terminatedDate, memberValue;

    // Getting all the active members
    switch (dpType) {
      case BOARD_MATRIX:
        memberDetails = await BoardMembers.find(activeMemberQuery);
        break;
      case KMP_MATRIX:
        memberDetails = await Kmp.find(activeMemberQuery);
        break;
      default:
        break;
    }

    memberDetails?.length > 0 && memberDetails?.map((member) => {
      terminatedDate = new Date(member?.endDateTimeStamp * 1000);// while adding endDateTimeStamp we are saving it /1000.
      terminatedDate = format(terminatedDate, 'dd-MM-yyyy');
      const memberJoiningDate = getMemberJoiningDate(member?.startDate);
      let yearsForDataCollection = '';
      //  2018-2019,2019-2020,2020-2021
      for (let yearIndex = 0; yearIndex < currentYear?.length; yearIndex++) {
        const splityear = currentYear[yearIndex].split('-');
        // 1st date is one more than the end date, i.e, if it is 1st then new date is 2nd
        const firstHalfDate = getTaskStartDate(currentYear[yearIndex], fiscalYearEndMonth, fiscalYearEndDate);
        const secondHalfDate = (new Date(splityear[1], Number(fiscalYearEndMonth) - 1, fiscalYearEndDate).getTime()) / 1000;

        /*memberJoiningDate= 2nd Sept 2016
        //  firstHalf = 1st April 2018, Any member who has joined before 1st of April and not been terminated 
        // secondHalf= 31st March 2019*/
        const logicForDecidingWhetherToConsiderYear = (memberJoiningDate <= firstHalfDate || memberJoiningDate <= secondHalfDate)
          && (member.endDateTimeStamp == 0 || member.endDateTimeStamp > firstHalfDate || member.endDateTimeStamp == null);
        if (logicForDecidingWhetherToConsiderYear) {
          if (yearsForDataCollection?.length !== 0) {
            yearsForDataCollection = yearsForDataCollection + ', ';
          }
          yearsForDataCollection = yearsForDataCollection + currentYear[yearIndex];

        }
      }

      const memberName =
        dpType == BOARD_MATRIX ? member.BOSP004 : member.MASP003;
      let label1 = memberName;
      //! If they have a termination date then.
      if (member.endDateTimeStamp > taskStartDate && member.endDateTimeStamp !== 0) {
        label1 = `${memberName}, last working date ${terminatedDate}`
      }

      //! If the member is terminated then.
      if (member.endDateTimeStamp < taskStartDate && member.endDateTimeStamp !== 0 && member.endDateTimeStamp !== null) {
        label1 = `${memberName}, is terminated on ${terminatedDate}`
      }

      let label = memberName;
      memberValue = {
        label,
        label1,
        value: member.id,
        year: yearsForDataCollection?.length > 0 ? yearsForDataCollection : '',
      };

      memberList.push(memberValue);
    });
    return memberList;
  } catch (error) {
    console.log(error?.message);
    return error?.message;
  }
}

export async function getFilteredDatapointsForBMAndKM(
  memberList,
  dpTypeDatapoints,
  memberId,
  datapointList,
  taskDetails,
  allDatapoints,
  taskStartDate,
  currentYear,
  dpType
) {
  try {
    const searchQueryForMemberName = { taskId: taskDetails?.id, status: true, isActive: true };
    // TODO Step1: Getting the memberlist 
    let allCollectedMembers =
      dpType == BOARD_MATRIX ?
        await BoardMembersMatrixDataPoints.distinct('memberName', searchQueryForMemberName) :
        await KmpMatrixDataPoints.distinct('memberName', searchQueryForMemberName)

    // TODO Step2: Iterating through the datapoints to get the list.
    for (
      let datapointsIndex = 0;
      datapointsIndex < dpTypeDatapoints.length;
      datapointsIndex++
    ) {
      for (
        let datapointListIndex = 0;
        datapointListIndex < memberList.length;
        datapointListIndex++
      ) {
        if (memberList[datapointListIndex].value == memberId) {
          // TODO Step 2.1: Getting the message based on the year for a particular user.
          const errorMessage =
            await getErrorMessageIfMemberIsNoLongerPartOfTheTask(
              memberList[datapointListIndex],
              dpType,
              datapointList,
              taskStartDate,
              memberId
            );

          if (errorMessage !== '') {
            return errorMessage;
          }

          // TODO 2.2: Getting the member details.
          let datapointObject = getMemberDataPoint(
            dpTypeDatapoints[datapointsIndex],
            memberList[datapointListIndex],
            taskDetails
          );

          // TODO 2.3: Checking for the correction status whether it is complete or incomplete based on the collected data and members.
          for (let currentYearIndex = 0; currentYearIndex < currentYear.length; currentYearIndex++) {
            for (let dpIndex = 0; dpIndex < allDatapoints.length; dpIndex++) {
              let object = allDatapoints[dpIndex];
              let memberName = object.memberName;
              let element = memberList[datapointListIndex].label;
              if (
                object.datapointId.id == dpTypeDatapoints[datapointsIndex].id &&
                object.year == currentYear[currentYearIndex] &&
                memberName.toLowerCase().includes(element.toLowerCase())
              ) {
                datapointObject.status = object.correctionStatus
                  ? object.correctionStatus
                  : 'Completed';
              }
            }
          }
          datapointList.dpCodesData.push(datapointObject);
        }
      }
    }
    return {
      status: 200,
      message: 'Data collection dp codes retrieved successfully!',
      response: {
        datapointList,
      },
      allCollectedMembers
    };
  } catch (error) {
    console.log(error?.message);
  }
}

export async function getFilterdDatapointForErrorForBMAndKM(
  memberList,
  dpType,
  taskDetails,
  currentYear,
  datapointList,
  queryForHasError,
  datapointCodeQuery,
  memberName,
  taskStartDate,
  isCorrectionCompleted,
  page,
  limit,
  memberId,
  count,
  dataType  //15
) {
  try {
    let orderedDpCodes;
    queryForHasError = {
      ...queryForHasError, year: {
        $in: currentYear,
      }
    }
    queryForHasError =
      memberName === ''
        ? queryForHasError
        : {
          ...queryForHasError,
          memberName: { $regex: memberName, $options: 'i' },
        };

    queryForHasError =
      datapointCodeQuery.length > 0
        ? { ...queryForHasError, datapointId: datapointCodeQuery }
        : queryForHasError;

    if (dataType !== '') {
      const datapointIdBaseOnDataType = await Datapoints.find({
        categoryId: taskDetails?.categoryId,
        ...getConditionForQualitativeAndQuantitativeDatapoints(dataType),
        status: true,
        dpType
      });
      queryForHasError = { ...queryForHasError, datapointId: { $in: datapointIdBaseOnDataType } };
    }

    const distinctDatapoint = dpType == BOARD_MATRIX ?
      await BoardMembersMatrixDataPoints.distinct('datapointId', queryForHasError)
      : await KmpMatrixDataPoints.distinct('datapointId', queryForHasError);

    const dpWithSkipAndlimit = await Datapoints.find({ _id: distinctDatapoint })
      .skip((page - 1) * limit)
      .limit(+limit)

    let dp = [];
    dpWithSkipAndlimit?.map(dpData => {
      dp.push(dpData?._id)
    });

    const [populateQuery, dpQuery] = [{
      path: 'datapointId',
      populate: {
        path: 'keyIssueId',
      },
    }, {
      taskId: taskDetails?._id,
      status: true,
      isActive: true,
      datapointId: { $in: dp },
      dpStatus: queryForHasError?.dpStatus
    }]

    let [errorDatapoints, allCollectedMembers] =
      dpType == BOARD_MATRIX
        ? await Promise.all([BoardMembersMatrixDataPoints.find(dpQuery)
          .populate([populateQuery]),
        BoardMembersMatrixDataPoints.distinct('memberName', queryForHasError)
        ])
        : await Promise.all([KmpMatrixDataPoints.find(dpQuery)
          .populate([populateQuery])],
          KmpMatrixDataPoints.distinct('memberName', queryForHasError)
        );

    orderedDpCodes =
      isCorrectionCompleted && _.uniq(errorDatapoints, 'datapointId');
    orderedDpCodes = _.orderBy(errorDatapoints, ['datapointId.code'], ['asc']);
    for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
      let object = orderedDpCodes[errorDpIndex].memberName;
      if (memberName.toLowerCase().includes(object.toLowerCase())) {
        const errorMessage =
          //! check
          await getErrorMessageIfMemberIsNoLongerPartOfTheTask(
            memberList,
            dpType,
            datapointList,
            taskStartDate,
            memberId,
            memberName
          );

        if (errorMessage !== '') {
          return errorMessage;
        } else {
          let datapointObject = getDpObjectForCorrrection(
            orderedDpCodes[errorDpIndex],
            taskDetails,
          );
          datapointObject = {
            ...datapointObject,
            memberName,
            memberId,
          };
          if (datapointList.dpCodesData.length > 0) {
            let yearfind = datapointList.dpCodesData.findIndex(
              (obj) =>
                obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code &&
                obj.memberName == orderedDpCodes[errorDpIndex].memberName
            );
            if (yearfind > -1) {
              datapointList.dpCodesData[yearfind].fiscalYear =
                datapointList.dpCodesData[yearfind].fiscalYear.concat(
                  ', ',
                  orderedDpCodes[errorDpIndex].year
                );
            } else {
              datapointList.dpCodesData.push(datapointObject);
            }
          } else {
            datapointList.dpCodesData.push(datapointObject);
          }
        }
      }
    }
    return {
      status: 200,
      message: 'Data collection dp codes retrieved successfully!',
      response: {
        datapointList,
        count: datapointList.dpCodesData.length < 1 ? 0 : count,
        allCollectedMembers
      },
    };
  } catch (error) {
    console.log(error?.message);
  }
}

export async function getErrorMessageIfMemberIsNoLongerPartOfTheTask(
  memberListForDisplay,
  dpType,
  datapointList,
  taskStartDate,
  memberId,
  memberName
) {
  try {
    let searchQuery = {},
      memberData;
    switch (dpType) {
      case BOARD_MATRIX:
        searchQuery =
          memberId == ''
            ? { BOSP004: memberName, status: true }
            : {
              $or: [{ _id: memberId }, { BOSP004: memberName, status: true }],
            };
        memberData = await BoardMembers.findOne(searchQuery);
        break;
      case KMP_MATRIX:
        searchQuery =
          memberId == ''
            ? { MASP003: memberName, status: true }
            : {
              $or: [{ _id: memberId }, { MASP003: memberName, status: true }],
            };
        memberData = await Kmp.findOne(searchQuery);
      default:
        console.log('Wrong dp Type');
        break;
    }

    if (memberData) {
      const gender =
        dpType == BOARD_MATRIX
          ? memberData.BODR005 == 'M'
            ? 'he'
            : 'she'
          : memberData.MASR008 == 'M'
            ? 'he'
            : 'she';
      if (memberData?.startDate == '') {
        return {
          status: 200,
          message: `Member's start date is empty kindly update`,
          response: {
            datapointList,
          },
        };
      }
      if (memberData?.endDateTimeStamp < taskStartDate && memberData?.endDateTimeStamp !== 0 && memberData?.endDateTimeStamp !== null) {
        return {
          status: 200,
          message: `Member is terminated, ${gender} is no longer part of this task`,
          response: {
            datapointList,
          },
        };
      } else if (memberListForDisplay.year == '') {
        return {
          status: 200,
          message: `Member is not part of the task's fiscal years`,
          response: {
            datapointList,
          },
        };
      } else {
        return '';
      }
    }
  } catch (error) {
    console.log(error?.message);
  }
}

export async function getFilteredErrorDatapointForStandalone(
  queryForHasError,
  keyIssueId,
  datapointCodeQuery,
  queryKeyIssueSearch,
  keyIssuesList,
  taskDetails,
  datapointList,
  page,
  limit,
  dataType,
  currentYear//11
) {
  try {
    queryForHasError =
      (keyIssueId == '' || !keyIssueId) && (dataType == '' || !dataType) && datapointCodeQuery?.length == 0
        ? queryForHasError
        : await getQueryWithKeyIssueOrDataTypeOrSearch(
          queryForHasError,
          keyIssueId,
          dataType,
          taskDetails?.categoryId?._id,
          datapointCodeQuery
        );

    const distinctDatapoint = await StandaloneDatapoints.distinct('datapointId', queryForHasError);
    const dpWithSkipAndlimit = await Datapoints.find({ _id: distinctDatapoint })
      .skip((page - 1) * limit)
      .limit(+limit)

    let dp = [];
    dpWithSkipAndlimit?.map(dpData => {
      dp.push(dpData?._id)
    });

    const errorDatapoints = await StandaloneDatapoints.find({
      taskId: taskDetails?._id,
      status: true,
      isActive: true,
      datapointId: { $in: dp },
      dpStatus: queryForHasError?.dpStatus, // this filter makes a difference alottt of them
      companyId: taskDetails?.companyId?._id
    })
      .populate({
        path: 'datapointId',
        populate: {
          path: 'keyIssueId',
        },
      });

    const orderedDpCodes = _.orderBy(
      errorDatapoints,
      ['datapointId.code'],
      ['asc']
    );
    keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
    for (let errorDpIndex = 0; errorDpIndex < orderedDpCodes.length; errorDpIndex++) {
      let datapointsObject = getDpObjectForCorrrection(
        orderedDpCodes[errorDpIndex],
        taskDetails
      );
      datapointsObject = {
        ...datapointsObject,
        memberId: '',
        memberName: '',
      };

      if (orderedDpCodes[errorDpIndex].datapointId.code == '444') {
        console.log('Here');
      }

      if (datapointList.dpCodesData.length > 0) {
        let yearfind = datapointList.dpCodesData.findIndex(
          (obj) => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code
        );
        if (yearfind > -1) {
          datapointList.dpCodesData[yearfind].fiscalYear =
            datapointList.dpCodesData[yearfind].fiscalYear.concat(
              ', ',
              orderedDpCodes[errorDpIndex].year
            );
        } else {
          datapointList.dpCodesData.push(datapointsObject);
        }
      } else {
        datapointList.dpCodesData.push(datapointsObject);
      }
    }
    return {
      status: 200,
      message: 'Data correction dp codes retrieved successfully!',
      response: {
        keyIssuesList,
        datapointList,
      },
    };
  } catch (error) {
    console.log(error?.message);
  }
}

export function getConditionForQualitativeAndQuantitativeDatapoints(dataType) {
  let dataTypeCondition;
  if (dataType !== '') {
    switch (dataType) {
      case QUALITATIVE:
        dataTypeCondition = { dataType: { $ne: NUMBER } };
        break;
      case QUANTITATIVE:
        dataTypeCondition = { dataType: NUMBER };
        break;
      default:
        console.log('Incorrect data type');
        break;
    }
    return dataTypeCondition;

  }
}
