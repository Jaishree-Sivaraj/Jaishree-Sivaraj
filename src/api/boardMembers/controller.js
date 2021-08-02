import { success, notFound, authorOrAdmin } from '../../services/response/'
import { BoardMembers } from '.'
import _ from 'lodash'

export const create = async({ user, bodymen: { body } }, res, next) =>{
  // BoardMembers.create({ ...body, createdBy: user })
  //   .then((boardMembers) => boardMembers.view(true))
  //   .then(success(res, 201))
  //   .catch(next)
  try {
  
  console.log(body.companyId, body.memberName, body.startDate, body.endDate, body.dob, body.gender, body.nationality, body.financialExp, body.industrialExp)
  let checkBoardMember = await BoardMembers.find({companyId:body.companyId, BOSP004: body.memberName})
  if(checkBoardMember.length > 0){    
    return res.status(402).json({
      message: "BoardMember already exists",
    });
       
  } else {
    if(body.endDate != ""){      
      let yearTimeStamp = Math.floor(new Date(body.endDate).getTime()/1000);
      await BoardMembers.create({
        companyId: body.companyId,
        BOSP004: body.memberName, 
        startDate: body.startDate, 
        endDate:body.endDate, 
        endDateTimeStamp: yearTimeStamp, 
        dob: body.dob, 
        BODR005:body.gender, 
        BODP001: body.nationality, 
        BOSP005: body.financialExp, 
        BOSP006: body.industrialExp,
        clientTaxonomyId: body.clientTaxonomyId,
        createdBy:user
      });      
      return res.status(200).json({
        message: "BoardMember saved successfully"
      });

    } else{
      await BoardMembers.create({
        companyId: body.companyId,
        BOSP004: body.memberName, 
        startDate: body.startDate, 
        endDate:body.endDate, 
        endDateTimeStamp: 0, 
        dob: body.dob, 
        BODR005:body.gender, 
        BODP001: body.nationality, 
        BOSP005: body.financialExp, 
        BOSP006: body.industrialExp,
        clientTaxonomyId: body.clientTaxonomyId,
        createdBy:user
      });      
      return res.status(200).json({
        message: "BoardMember saved successfully"
      });
    } 
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

export const updateEndDate = async({ user, body }, res, next) =>{
  console.log(body.companyId, body.memberName, body.endDate);
  try {
    let yearTimeStamp = Math.floor(new Date(body.endDate).getTime()/1000);
    await BoardMembers.updateMany({
      companyId: body.companyId,
      _id : {$in: body.memberName},    
    },{
      $set:{endDate: body.endDate, endDateTimeStamp: yearTimeStamp,createdBy:user}
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

export const activeMemberlist = async({ user, params }, res, next) =>{
 // try {
    let currentDate = Date.now();
    let yearTimeStamp = Math.floor(new Date(currentDate).getTime()/1000);
    let boardMemberEq = await BoardMembers.find({companyId: params.companyId, endDateTimeStamp: 0});
    let boardMemberGt = await BoardMembers.find({companyId: params.companyId,endDateTimeStamp:{$gt:yearTimeStamp}});
    let mergeBoardMemberList = _.concat(boardMemberEq,boardMemberGt);
    let boardMemberListArray = [];

    if(mergeBoardMemberList.length > 0){
      for (let boardMemberListIndex = 0; boardMemberListIndex < mergeBoardMemberList.length; boardMemberListIndex++) {
        let boardNameValue = {
          label: mergeBoardMemberList[boardMemberListIndex].BOSP004,
          value: mergeBoardMemberList[boardMemberListIndex].id,
        }   
        boardMemberListArray.push(boardNameValue)
      }
      return res.status(200).json({
        message: "BoardMember List",
        BoardMembersList: boardMemberListArray
      });
    } else{
      return res.status(404).json({
        message: "No active members found",
        BoardMembersList: boardMemberListArray
      });
    }     
   //} 
   //catch (error) {
  //   return res.status(500).json({
  //     message: error,
  //     status: 500
  //   });    
  // }
}