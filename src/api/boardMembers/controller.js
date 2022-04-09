import _ from 'lodash'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { BoardMembers } from '.'
import { Kmp } from '../kmp'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'

export const create = async ({ user, bodymen: { body } }, res, next) => {
  // BoardMembers.create({ ...body, createdBy: user })
  //   .then((boardMembers) => boardMembers.view(true))
  //   .then(success(res, 201))
  //   .catch(next)
  try {
    let yearTimeStamp = 0;
    console.log(body.companyId, body.memberName, body.startDate, body.endDate, body.dob, body.gender, body.nationality, body.financialExp, body.industrialExp)
    let checkBoardMember = await BoardMembers.find({ companyId: body.companyId, BOSP004: body.memberName, status: true })
    if (checkBoardMember.length > 0) {
      return res.status(402).json({
        message: "BoardMember already exists",
      });
    } else {
      if (body.endDate != "") {
        yearTimeStamp = Math.floor(new Date(body.endDate).getTime() / 1000);
      }
      if (body.isExecutiveType == true) {
        await Kmp.create({
          companyId: body.companyId,
          MASP003: body.memberName,
          startDate: body.startDate,
          endDate: body.endDate,
          endDateTimeStamp: yearTimeStamp,
          dob: body.dob,
          MASR008: body.gender,
          clientTaxonomyId: body.clientTaxonomyId,
          createdBy: user
        }).catch(err => {
          return res.status(500).json({ message: err.messgae ? err.message : "Failed to created executive user" })
        })
      }
      await BoardMembers.create({
        companyId: body.companyId,
        BOSP004: body.memberName,
        startDate: body.startDate,
        endDate: body.endDate,
        endDateTimeStamp: yearTimeStamp,
        dob: body.dob,
        BODR005: body.gender,
        BODP001: body.nationality,
        BOSP005: body.financialExp,
        BOSP006: body.industrialExp,
        clientTaxonomyId: body.clientTaxonomyId,
        createdBy: user
      });
      return res.status(200).json({
        message: "BoardMember saved successfully"
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500
    });

  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  BoardMembers.count(query)
    .then(count => BoardMembers.find(query, select, cursor)
      .populate('createdBy')
      .populate('companyId')
      .then((boardMembers) => ({
        count,
        rows: boardMembers.map((boardMembers) => boardMembers.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  BoardMembers.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .then(notFound(res))
    .then((boardMembers) => boardMembers ? boardMembers.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  BoardMembers.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((boardMembers) => boardMembers ? Object.assign(boardMembers, body).save() : null)
    .then((boardMembers) => boardMembers ? boardMembers.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  BoardMembers.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((boardMembers) => boardMembers ? boardMembers.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const updateEndDate = async ({ user, body }, res, next) => {
  console.log(body.companyId, body.boardMembersToTerminate, body.endDate);
  try {
    let yearTimeStamp = Math.floor(new Date(body.endDate).getTime() / 1000);
    await BoardMembers.updateMany({
      companyId: body.companyId,
      _id: { $in: body.boardMembersToTerminate },
    }, {
      $set: { endDate: body.endDate, endDateTimeStamp: yearTimeStamp, createdBy: user }
    })
    return res.status(200).json({
      message: "BoardMember endDate updated successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500
    });

  }
}

export const activeMemberlist = async ({ user, params }, res, next) => {
  try {
    // let currentDate = Date.now();
    // let yearTimeStamp = Math.floor(new Date(currentDate).getTime()/1000);
    let allBoardMembers = await BoardMembers.find({ companyId: params.companyId, status: true });
    // let boardMemberGt = await BoardMembers.find({companyId: params.companyId,endDateTimeStamp:{$gt:yearTimeStamp}, status: true});
    // let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);
    let boardMemberListArray = [];

    if (allBoardMembers.length > 0) {
      for (let boardMemberListIndex = 0; boardMemberListIndex < allBoardMembers.length; boardMemberListIndex++) {
        let boardNameValue = {
          label: allBoardMembers[boardMemberListIndex].BOSP004,
          value: allBoardMembers[boardMemberListIndex].id,
        }
        boardMemberListArray.push(boardNameValue)
      }
      return res.status(200).json({
        message: "BoardMember List",
        BoardMembersList: boardMemberListArray
      });
    } else {
      return res.status(404).json({
        message: "No active members found",
        BoardMembersList: boardMemberListArray
      });
    }
  }
  catch (error) {
    return res.status(500).json({
      message: error?.message ? error?.message : 'Failed to fetch all board members',
      status: 500
    });
  }
}

export const getDistinctBoardMembersCompanywise = async ({ user, params }, res, next) => {
  // let distinctYears = await BoardMembersMatrixDataPoints.find({isActive: true, status: true}).distinct('year');
  // if (distinctYears.length > 0) {
  let distinctBoardMembers = [], distinctKmpMembers = [];
  // for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
  // let year = distinctYears[1];
  let allBoardMembersofYear = await BoardMembersMatrixDataPoints.find({ year: params.year, isActive: true, status: true })
    .populate('companyId');
  console.log('allBoardMembersofYear.length', allBoardMembersofYear.length);
  let uniqBoardMembers = _.uniqBy(allBoardMembersofYear, 'memberName');
  console.log('uniqBoardMembers length', uniqBoardMembers.length);
  for (let bmIndex = 0; bmIndex < uniqBoardMembers.length; bmIndex++) {
    try {
      let memberDetail = uniqBoardMembers[bmIndex];
      let memberObject = {
        // boardMemberMatrixId: memberDetail.id,
        companyId: memberDetail.companyId ? memberDetail.companyId.id : '',
        companyName: memberDetail.companyId ? memberDetail.companyId.companyName : '',
        memberName: memberDetail.memberName,
        expectedName: memberDetail.memberName,
        year: params.year
      };
      // console.log('memberObject', memberObject);
      let foundBoardMemberIndex = distinctBoardMembers.indexOf(memberObject);
      if (foundBoardMemberIndex == -1) {
        distinctBoardMembers.push(memberObject);
      }
    } catch (error) {
      return next(error);
    }
  }
  // if (distinctYears.length-1 == yearIndex) {
  //   return res.status(200).json({ status: "200", message: "Retrieved member details successfully!", data: { boardMembers: distinctBoardMembers, kmpMmbers: distinctKmpMembers } });
  // }
  // }
  return res.status(200).json({ status: "200", message: "Retrieved member details successfully!", data: { boardMembers: distinctBoardMembers, kmpMmbers: distinctKmpMembers } });
  // }
}


export const getDistinctKmpMembersCompanywise = async ({ user, params }, res, next) => {
  // let distinctYears = await BoardMembersMatrixDataPoints.find({isActive: true,status: true}).distinct('year');
  // if (distinctYears.length > 0) {
  let distinctKmpMembers = [];
  // for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
  // let year = distinctYears[1];
  let allKmpMembersofYear = await KmpMatrixDataPoints.find({ year: params.year, isActive: true, status: true })
    .populate('companyId');
  console.log('allKmpMembersofYear.length', allKmpMembersofYear.length);
  let uniqKmpMembers = _.uniqBy(allKmpMembersofYear, 'memberName');
  console.log('uniqKmpMembers length', uniqKmpMembers.length);
  for (let kmpmIndex = 0; kmpmIndex < uniqKmpMembers.length; kmpmIndex++) {
    let memberDetail = uniqKmpMembers[kmpmIndex];
    console.log('kmp member', kmpmIndex, memberDetail);
    let memberObject = {
      // kmpMemberMatrixId: memberDetail.id,
      companyId: memberDetail.companyId ? memberDetail.companyId.id : '',
      companyName: memberDetail.companyId ? memberDetail.companyId.companyName : '',
      memberName: memberDetail.memberName,
      expectedName: memberDetail.memberName,
      year: params.year
    };
    let foundKmpMemberIndex = distinctKmpMembers.indexOf(memberObject);
    console.log('foundKmpMemberIndex', foundKmpMemberIndex);
    if (foundKmpMemberIndex == -1) {
      distinctKmpMembers.push(memberObject);
    }
  }
  //   if (distinctYears.length-1 == yearIndex) {
  //     return res.status(200).json({ status: "200", message: "Retrieved member details successfully!", data: { boardMembers: distinctBoardMembers, kmpMmbers: distinctKmpMembers } });
  //   }
  // }
  return res.status(200).json({ status: "200", message: "Retrieved member details successfully!", data: { kmpMmbers: distinctKmpMembers } });
  // }
}