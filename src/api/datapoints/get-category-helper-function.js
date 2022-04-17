"use strict";

import _ from "lodash";
import { Datapoints } from ".";
import { StandaloneDatapoints } from "../standalone_datapoints";
import { BoardMembersMatrixDataPoints } from "../boardMembersMatrixDataPoints";
import { KmpMatrixDataPoints } from "../kmpMatrixDataPoints";
import { BoardMembers } from "../boardMembers";
import { Kmp } from "../kmp";
import {
  YetToStart,
  Correction,
  CorrectionCompleted,
  Completed,
  Error,
} from "../../constants/task-status";
import { STANDALONE, BOARD_MATRIX, KMP_MATRIX } from "../../constants/dp-type";
import { format } from "date-fns";

export async function getDocumentCountAndPriorityDataAndAllDpTypeDetails(
  queryToCountDocuments,
  queryForDatapointCollection,
  queryForDpTypeCollection
) {
  // Here queryForDatapointCollection is dependent on the searchQuery, Filter and so.
  let [
    count,
    dpTypeValues,
    priorityDpCodes,
    currentAllStandaloneDetails,
    currentAllBoardMemberMatrixDetails,
    currentAllKmpMatrixDetails,
  ] = await Promise.all([
    Datapoints.countDocuments(queryToCountDocuments),
    Datapoints.find(queryForDatapointCollection).distinct("dpType"),
    // Priority Dp code is just for standalone Dp.
    Datapoints.find({ ...queryForDatapointCollection, isPriority: true })
      .populate("keyIssueId")
      .populate("categoryId"),
    StandaloneDatapoints.find(queryForDpTypeCollection)
      .populate("createdBy")
      .populate("datapointId")
      .populate("companyId")
      .populate("taskId"),
    // Is memberName not needed
    BoardMembersMatrixDataPoints.find(queryForDpTypeCollection)
      .populate("createdBy")
      .populate("datapointId")
      .populate("companyId")
      .populate("taskId"),
    KmpMatrixDataPoints.find(queryForDpTypeCollection)
      .populate("createdBy")
      .populate("datapointId")
      .populate("companyId")
      .populate("taskId"),
  ]);

  return {
    count,
    dpTypeValues,
    priorityDpCodes,
    currentAllStandaloneDetails,
    currentAllBoardMemberMatrixDetails,
    currentAllKmpMatrixDetails,
  };
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
      status: "200",
      message: "Data collection dp codes retrieved successfully!",
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
  const keyIssuesCollection = await Datapoints.find(queryKeyIssueSearch)
    .sort({ code: 1 })
    .populate("keyIssueId");

  const keyIssueListObject = _.uniqBy(keyIssuesCollection, "keyIssueId");
  keyIssueListObject.map((keyIssue) => {
    keyIssuesList.push({
      label: keyIssue.keyIssueId.keyIssueName,
      value: keyIssue.keyIssueId.id,
    });
  });
  return keyIssuesList;
}

export function getDataPointListForStandalone(
  datapointData,
  currentYear,
  currentAllStandaloneDetails,
  taskDetails,
  datapointList
) {
  for (
    let datapointsIndex = 0;
    datapointsIndex < datapointData.length;
    datapointsIndex++
  ) {
    let datapointsObject = getDpObjectDetailsForStandalone(
      datapointData[datapointsIndex],
      taskDetails
    );
    // BODC001,MACR005,MACR006
    console.log(datapointData[datapointsIndex].code);
    for (
      let currentYearIndex = 0;
      currentYearIndex < currentYear.length;
      currentYearIndex++
    ) {
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
    repFinalSubmit: repFinalSubmit ? repFinalSubmit : "",
    isPriority,
  };
  return result;
}

export function getTaskStartDate(currentyear, month, date) {
  // We will get the first year
  let [taskStartingYear] = currentyear.split("-");
  // ? If the date that is there is the last date of the month, the subsequent day will be the 1st
  const taskStartingDate =
    new Date(taskStartingYear, month, 0).getDate() == date
      ? 1
      : Number(date) + 1;
  // ? If the month is december then, the subsequent month will be the January
  // * Here month starts from 0.
  const taskStartingMonth =
    new Date(taskStartingYear, month, 0).getMonth() == 11 ? 0 : Number(month);
  // because month starts with 0 hence 3 is April and not march. Therefore, we are not increamenting the month.
  if (month == 12) {
    taskStartingYear = Number(taskStartingYear) + 1;
  }
  const yearTimeStamp = Math.floor(
    new Date(taskStartingYear, taskStartingMonth, taskStartingDate).getTime() /
    1000
  );
  return yearTimeStamp;
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
    memberId: "",
    memberName: "",
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
    status: orderedDpCodes?.correctionStatus,
  };
}

export async function getQueryWithKeyIssue(
  queryForHasError,
  keyIssueId,
  datapointCodeQuery
) {
  const datapointwithKeyIssue = await Datapoints.distinct("_id", {
    keyIssueId,
  });
  if (datapointCodeQuery.length > 0) {
    datapointwithKeyIssue.push(datapointwithKeyIssue);
  }

  queryForHasError = {
    ...queryForHasError,
    datapointId: { $in: datapointwithKeyIssue },
  };
  return queryForHasError;
}

export function getSearchQuery(searchValue, searchQuery) {
  searchQuery = {
    $or: [
      { code: { $regex: new RegExp(searchValue, "gi") } },
      { name: { $regex: new RegExp(searchValue, "gi") } },
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
  let dpStatus =
    taskDetails?.taskStatus == CorrectionCompleted ? Correction : Error;
  const query = {
    taskId: taskDetails?._id,
    status: true,
    isActive: true,
    dpStatus,
  };
  switch (dpType) {
    case STANDALONE:
      allDpDetails = await StandaloneDatapoints.distinct("datapointId", query);
      break;
    case BOARD_MATRIX:
      allDpDetails = await BoardMembersMatrixDataPoints.distinct(
        "datapointId",
        { ...query, memberName: { $regex: memberName, $options: "i" } }
      );
      break;
    case KMP_MATRIX:
      allDpDetails = await KmpMatrixDataPoints.distinct("datapointId", {
        ...query,
        memberName: { $regex: memberName, $options: "i" },
      });
      break;
    default:
      break;
  }

  queryToCountDocuments = {
    ...queryToCountDocuments,
    _id: { $in: allDpDetails },
  };
  console.log(queryToCountDocuments);
  return queryToCountDocuments;
}

export function getFilteredData(data) {
  data = _.filter(data, function (o) {
    return o.dpStatus == Correction;
  });
  return data;
}

export async function getMembers(dpQuery, dpType, taskStartDate, currentYear) {
  try {
    let memberList = []
    let memberDetails,
      terminatedDate,
      endDate,
      memberValue
    switch (dpType) {
      case BOARD_MATRIX:
        memberDetails = await BoardMembers.find(dpQuery);
        break;
      case KMP_MATRIX:
        memberDetails = await Kmp.find(dpQuery);
        break;
      default:
        break;
    }
    memberDetails.map((member) => {
      terminatedDate = new Date(member?.endDateTimeStamp * 1000);
      terminatedDate = format(terminatedDate, "MM-dd-yyyy");
      const startDate = new Date(member?.startDate).getFullYear();
      endDate = new Date(member.endDate).getFullYear()
        ? new Date(member.endDate).getFullYear()
        : "";

      let yearsForDataCollection = "";
      for (let yearIndex = 0; yearIndex < currentYear?.length; yearIndex++) {
        const splityear = currentYear[yearIndex].split("-");
        if (startDate <= splityear[0] || startDate <= splityear[1]) {
          yearsForDataCollection =
            yearsForDataCollection + currentYear[yearIndex];
          if (yearIndex !== currentYear?.length - 1) {
            yearsForDataCollection = yearsForDataCollection + ", ";
          }
        }
      }
      const memberName =
        dpType == BOARD_MATRIX ? member.BOSP004 : member.MASP003;
      let label1 = memberName;
      if (member.endDateTimeStamp >= taskStartDate) {
        label1 = `${memberName}, last working date ${terminatedDate}`
      } else if (member.endDateTimeStamp == 0) {
        label1 = `${memberName}, last working date ${terminatedDate}`
      }

      let label = memberName;
      memberValue = {
        label,
        label1,
        value: member.id,
        year: yearsForDataCollection?.length > 0 ? yearsForDataCollection : "",
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
  dpQuery,
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
    let [memberList, allCollectedMembers] = await Promise.all([
      getMembers(
        dpQuery,
        dpType,
        taskStartDate,
        currentYear
      ),
      dpType == BOARD_MATRIX ?
        BoardMembersMatrixDataPoints.distinct('memberName', searchQueryForMemberName) :
        KmpMatrixDataPoints.distinct('memberName', searchQueryForMemberName)
    ]);
    datapointList.memberList = memberList;
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
          const errorMessage =
            await getErrorMessageIfMemberIsNoLongerPartOfTheTask(
              memberList[datapointListIndex],
              dpType,
              datapointList,
              taskStartDate,
              memberId
            );
          if (errorMessage !== "") {
            return errorMessage;
          }
          let datapointObject = getMemberDataPoint(
            dpTypeDatapoints[datapointsIndex],
            memberList[datapointListIndex],
            taskDetails
          );
          // filtered data to get status.
          for (
            let currentYearIndex = 0;
            currentYearIndex < currentYear.length;
            currentYearIndex++
          ) {
            _.filter(allDatapoints, (object) => {
              let memberName = object.memberName;
              let element = memberList[datapointListIndex].label;
              if (
                object.datapointId.id == dpTypeDatapoints[datapointsIndex].id &&
                object.year == currentYear[currentYearIndex] &&
                memberName.toLowerCase().includes(element.toLowerCase())
              ) {
                datapointObject.status = object.correctionStatus
                  ? object.correctionStatus
                  : "Completed";
              }
            });
          }
          datapointList.dpCodesData.push(datapointObject);
        }
      }
    }
    return {
      status: 200,
      message: "Data collection dp codes retrieved successfully!",
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
  dpQuery,
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
  count
) {
  try {
    let orderedDpCodes;
    queryForHasError =
      memberName === ""
        ? queryForHasError
        : {
          ...queryForHasError,
          memberName: { $regex: memberName, $options: "i" },
        };

    queryForHasError =
      datapointCodeQuery.length > 0
        ? { ...queryForHasError, datapointId: datapointCodeQuery }
        : queryForHasError;

    const [findQuery, filterAllMemberWhoseDataIsCollected] = [{
      ...queryForHasError,
      year: {
        $in: currentYear,
      },
      memberName
    }, {
      ...queryForHasError,
      year: {
        $in: currentYear,
      }
    }];

    const populateQuery = {
      path: "datapointId",
      populate: {
        path: "keyIssueId",
      },
    };

    let [errorDatapoints, allCollectedMembers] =
      dpType == BOARD_MATRIX
        ? await Promise.all([BoardMembersMatrixDataPoints.find(findQuery)
          .skip((page - 1) * limit)
          .limit(+limit)
          .populate([populateQuery]),
        BoardMembersMatrixDataPoints.distinct('memberName', filterAllMemberWhoseDataIsCollected)
        ])
        : await Promise.all([KmpMatrixDataPoints.find(findQuery)
          .skip((page - 1) * limit)
          .limit(+limit)
          .populate([populateQuery])],
          KmpMatrixDataPoints.distinct('memberName', filterAllMemberWhoseDataIsCollected)
        );

    orderedDpCodes =
      isCorrectionCompleted && _.uniq(errorDatapoints, "datapointId");
    orderedDpCodes = _.orderBy(errorDatapoints, ["datapointId.code"], ["asc"]);

    let memberList = await getMembers(
      dpQuery,
      dpType,
      taskStartDate,
      currentYear
    );
    datapointList.memberList = memberList;
    for (
      let errorDpIndex = 0;
      errorDpIndex < orderedDpCodes.length;
      errorDpIndex++
    ) {
      for (let memberIndex = 0; memberIndex < memberList?.length; memberIndex++) {
        let memberName = orderedDpCodes[errorDpIndex].memberName;
        let object = memberList[memberIndex];
        if (memberName.toLowerCase().includes(object.label.toLowerCase())) {
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

          if (errorMessage !== "") {
            return errorMessage;
          } else {
            let datapointObject = getDpObjectForCorrrection(
              orderedDpCodes[errorDpIndex],
              taskDetails
            );
            datapointObject = {
              ...datapointObject,
              memberName: object.label,
              memberId: object.value,
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
                    ", ",
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

    }
    return {
      status: 200,
      message: "Data collection dp codes retrieved successfully!",
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
    if (memberListForDisplay.year == "") {
      return {
        status: 200,
        message: `Member's not part of the task`,
        response: {
          datapointList,
        },
      };
    }

    let searchQuery = {},
      memberData;
    switch (dpType) {
      case BOARD_MATRIX:
        searchQuery =
          memberId == ""
            ? { BOSP004: memberName, status: true }
            : {
              $or: [{ _id: memberId }, { BOSP004: memberName, status: true }],
            };
        memberData = await BoardMembers.findOne(searchQuery);
        break;
      case KMP_MATRIX:
        searchQuery =
          memberId == ""
            ? { MASP003: memberName, status: true }
            : {
              $or: [{ _id: memberId }, { MASP003: memberName, status: true }],
            };
        memberData = await Kmp.findOne(searchQuery);
      default:
        console.log("Wrong dp Type");
        break;
    }

    if (memberData) {
      if (
        memberData?.endDateTimeStamp < taskStartDate &&
        memberData?.endDateTimeStamp !== 0
      ) {
        const gender =
          dpType == BOARD_MATRIX
            ? memberData.BODR005 == "M"
              ? "he"
              : "she"
            : memberData.MASR008 == "M"
              ? "he"
              : "she";
        return {
          status: 200,
          message: `Member is terminated, ${gender} is no longer part of this task`,
          response: {
            datapointList,
          },
        };
      } else {
        return "";
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
  limit
) {
  try {
    queryForHasError =
      keyIssueId === ""
        ? queryForHasError
        : await getQueryWithKeyIssue(
          queryForHasError,
          keyIssueId,
          datapointCodeQuery
        );
    queryForHasError =
      datapointCodeQuery.length > 0
        ? { ...queryForHasError, datapointId: datapointCodeQuery }
        : queryForHasError;

    const errorDatapoints = await StandaloneDatapoints.find(queryForHasError)
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate({
        path: "datapointId",
        populate: {
          path: "keyIssueId",
        },
      });

    const orderedDpCodes = _.orderBy(
      errorDatapoints,
      ["datapointId.code"],
      ["asc"]
    );
    keyIssuesList = await getKeyIssues(queryKeyIssueSearch, keyIssuesList);
    for (
      let errorDpIndex = 0;
      errorDpIndex < orderedDpCodes.length;
      errorDpIndex++
    ) {
      let datapointsObject = getDpObjectForCorrrection(
        orderedDpCodes[errorDpIndex],
        taskDetails
      );
      datapointsObject = {
        ...datapointsObject,
        memberId: "",
        memberName: "",
      };
      if (datapointList.dpCodesData.length > 0) {
        let yearfind = datapointList.dpCodesData.findIndex(
          (obj) => obj.dpCode == orderedDpCodes[errorDpIndex].datapointId.code
        );
        if (yearfind > -1) {
          datapointList.dpCodesData[yearfind].fiscalYear =
            datapointList.dpCodesData[yearfind].fiscalYear.concat(
              ", ",
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
      message: "Data correction dp codes retrieved successfully!",
      response: {
        keyIssuesList,
        datapointList,
      },
    };
  } catch (error) {
    console.log(error?.message);
  }
}
