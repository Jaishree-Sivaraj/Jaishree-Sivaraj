import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Kmp } from '.'
import _ from 'lodash'
import * as fs from 'fs'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { BoardMembers } from '../boardMembers'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'

export const create = async({ user, bodymen: { body } }, res, next) =>{
  // Kmp.create({ ...body, createdBy: user })
  //   .then((kmp) => kmp.view(true))
  //   .then(success(res, 201))
  //   .catch(next)
  try {
    let checkKMPMember = await Kmp.find({companyId:body.companyId, MASP003: body.memberName})
    if(checkKMPMember.length > 0){    
      return res.status(402).json({
        message: "KMPMember already exists",
      });
         
    } else {
      if(body.endDate != ""){      
        let yearTimeStamp = Math.floor(new Date(body.endDate).getTime()/1000);
        await Kmp.create({
          companyId: body.companyId,
          MASP003: body.memberName, 
          startDate: body.startDate, 
          endDate:body.endDate, 
          endDateTimeStamp: yearTimeStamp, 
          dob: body.dob, 
          MASR008:body.gender, 
          clientTaxonomyId: body.clientTaxonomyId,
          createdBy:user
        })
        return res.status(200).json({
          message: "KMPMember saved successfully"
        });
  
      } else{
        await Kmp.create({
          companyId: body.companyId,
          MASP003: body.memberName, 
          startDate: body.startDate, 
          endDate:body.endDate, 
          endDateTimeStamp: 0, 
          dob: body.dob, 
          MASR008:body.gender, 
          clientTaxonomyId: body.clientTaxonomyId,
          createdBy:user
        });
        return res.status(200).json({
          message: "KMPMember saved successfully"
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
  Kmp.count(query)
    .then(count => Kmp.find(query, select, cursor)
      .populate('createdBy')
      .populate('companyId')
      .then((kmps) => ({
        count,
        rows: kmps.map((kmp) => kmp.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Kmp.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .then(notFound(res))
    .then((kmp) => kmp ? kmp.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Kmp.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((kmp) => kmp ? Object.assign(kmp, body).save() : null)
    .then((kmp) => kmp ? kmp.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Kmp.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((kmp) => kmp ? kmp.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const updateEndDate = async({ user, body }, res, next) =>{
  console.log(body.companyId, body.kmpMembersToTerminate, body.endDate);
    try {
        let yearTimeStamp = Math.floor(new Date(body.endDate).getTime()/1000);
        await Kmp.updateMany({
          companyId: body.companyId,
          _id: {$in : body.kmpMembersToTerminate},    
        },{
          $set:{endDate: body.endDate, endDateTimeStamp: yearTimeStamp, createdBy:user}
        }).then((result,err) =>{
          if(err){
            return res.status(500).json({
              message: error.message,
              status: 500
            });
          } else{       
            return res.status(200).json({
              message: "KmpMember endDate updated successfully"
            });
          }
        });       
      } catch (error) {
        return res.status(500).json({
          message: error.message,
          status: 500
        });
        
      }
    }
    
export const activeMemberlist = async({ user, params }, res, next) =>{
  try {
    let currentDate = Date.now();
    let yearTimeStamp = Math.floor(new Date(currentDate).getTime()/1000);
    let kmpEq = await Kmp.find({companyId: params.companyId, endDateTimeStamp: 0});
    let kmpGt = await Kmp.find({companyId: params.companyId,endDateTimeStamp:{$gt:yearTimeStamp}});
    let mergeKmpMemberList = _.concat(kmpEq,kmpGt);
    let kmpMemberlist = [];
    if(mergeKmpMemberList.length > 0){
      for (let kmpMemberIndex = 0; kmpMemberIndex < mergeKmpMemberList.length; kmpMemberIndex++) {
        let kmpNameValue = {
          label: mergeKmpMemberList[kmpMemberIndex].MASP003,
          value: mergeKmpMemberList[kmpMemberIndex].id
        }
        kmpMemberlist.push(kmpNameValue);            
      }
      return res.status(200).json({
        message: "KmpMember List",
        KMPList: kmpMemberlist
      });
    } else{
      return res.status(404).json({
        message: "No active members found",
        KMPList: kmpMemberlist
      });
    }     
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500
    });    
  }
}

export const boardMemberNamingCorrections = async({ user, params }, res, next) => {
  console.log('boardMemberNamingCorrections called!');
  fs.readFile(__dirname + '/bm-consolidated.json', async (err, data) => {
    if (err) throw err;
    let membersList = JSON.parse(data);
    console.log('membersList length', membersList.length);
    let yearMembersList = _.filter(membersList, { year: "2018-2019" });
    console.log('yearMembersList length', yearMembersList.length);
    for (let index = 0; index < yearMembersList.length; index++) {
      let memberDetail = yearMembersList[index];
      if (memberDetail.memberName != memberDetail.expectedName) {
        await BoardMembersMatrixDataPoints.updateMany({ 
          companyId: memberDetail.companyId, 
          // year: memberDetail.year, 
          memberName: memberDetail.memberName 
        }, { 
          $set: { memberName: memberDetail.expectedName } 
        });
        console.log(memberDetail);
      }
      let memberFound = await BoardMembersMatrixDataPoints.findOne({ 
        memberName: memberDetail.expectedName,
        companyId: memberDetail.companyId,
        status: true
      });
      console.log('memberFound', memberFound);
      if(memberFound){
        let memberGenderDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c1fbe8b9d1b577cecb3",//BODR005-board member gender id
          status: true 
        });
        console.log('memberGenderDetail', memberGenderDetail);
        let memberNationalityDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c1dbe8b9d1b577cecae",//BODR005-board member nationality id
          status: true 
        });
        console.log('memberNationalityDetail', memberNationalityDetail);
        let memberIndustryExpDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c32be8b9d1b577cece1",//BODR005-board member industry experience id
          status: true 
        });
        console.log('memberIndustryExpDetail', memberIndustryExpDetail);
        let memberFinancialExpDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c32be8b9d1b577cece2",//BODR005-board member financial experience id
          status: true 
        });
        console.log('memberFinancialExpDetail', memberFinancialExpDetail);
        let memberAppointmentDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c2abe8b9d1b577ceccf",//BODR005-board member appointment date id
          status: true 
        });
        console.log('memberAppointmentDetail', memberAppointmentDetail);
        let memberExecutiveDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c23be8b9d1b577cecbd",//BODR005-board member Is Executive?
          status: true 
        });
        console.log('memberExecutiveDetail', memberExecutiveDetail);
        let appointedDate = '', endDate = '', endDateTimeStamp = '';
        let memberStatus = true;
        if (memberAppointmentDetail && memberAppointmentDetail.response != '') {
          appointedDate = getJsDateFromExcel(memberAppointmentDetail.response);        
        }
        let memberCessationDetail = await BoardMembersMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c2bbe8b9d1b577cecd0",//BODR005-board member cessation date id
          status: true 
        });
        console.log('memberCessationDetail', memberCessationDetail);
        if (memberCessationDetail && memberCessationDetail.response != '') {
          endDate = getJsDateFromExcel(memberCessationDetail.response);
          endDateTimeStamp = Math.floor(new Date(endDate).getTime()/1000);
          let currentTimeStamp = Math.floor(new Date().getTime()/1000);
          if (currentTimeStamp > endDateTimeStamp) {
            memberStatus = false;
          }
        }
        let newBoardMemberObject = {
          createdBy: user,
          companyId: memberDetail.companyId,
          BOSP004: memberDetail.expectedName,
          startDate: appointedDate,
          endDate: endDate,
          endDateTimeStamp: endDateTimeStamp,
          dob: '',
          BODR005: memberGenderDetail ? memberGenderDetail.response : '',
          BODP001: memberNationalityDetail ? memberNationalityDetail.response : '',
          BOSP005: memberIndustryExpDetail ? memberIndustryExpDetail.response : '',
          BOSP006: memberFinancialExpDetail ? memberFinancialExpDetail.response : '',
          memberStatus: memberStatus,
          status: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        console.log('newBoardMemberObject', newBoardMemberObject);
        await BoardMembers.updateOne({ 
          companyId: memberDetail.companyId,
          BOSP004: memberDetail.expectedName,
          status: true
         }, { 
          $set: newBoardMemberObject
         }, {
           $upsert: true
        });
        
        if (memberExecutiveDetail && memberExecutiveDetail.response == 'Yes') {
          let newKMPMemberObject = {
            createdBy: user,
            companyId: memberDetail.companyId,
            MASP003: memberDetail.expectedName,
            startDate: '',
            endDate: '',
            endDateTimeStamp: 0,
            MASR008: memberGenderDetail ? memberGenderDetail.response : '',
            memberStatus: true,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          console.log('newKMPMemberObject', newKMPMemberObject);
          await Kmp.updateOne({ 
            companyId: memberDetail.companyId,
            MASP003: memberDetail.expectedName,
            status: true
          }, { 
            $set: newKMPMemberObject
          }, {
            $upsert: true
          });
        }
      }
    }
    return res.status(200).json({ status: "200", message: "Board member names corrected!" });
  })
}

export const kmpMemberNamingCorrections = async({ user, params }, res, next) => {
  console.log('kmpMemberNamingCorrections called!');
  fs.readFile(__dirname + '/kmp-consolidated.json', async (err, data) => {
    if (err) throw err;
    let membersList = JSON.parse(data);
    console.log('membersList length', membersList.length);
    let yearMembersList = _.filter(membersList, { year: "2018-2019" });
    console.log('yearMembersList length', yearMembersList.length);
    for (let index = 0; index < 5; index++) {
      let memberDetail = yearMembersList[index];
      if (memberDetail.memberName != memberDetail.expectedName) {
        await KmpMatrixDataPoints.updateMany({ 
          companyId: memberDetail.companyId, 
          year: memberDetail.year, 
          memberName: memberDetail.memberName 
        }, { 
          $set: { memberName: memberDetail.expectedName } 
        });
        console.log(memberDetail);
      }
      let memberFound = await KmpMatrixDataPoints.findOne({ 
        memberName: memberDetail.expectedName,
        companyId: memberDetail.companyId,
        status: true
      });
      console.log('memberFound', memberFound);
      if(memberFound){
        let memberGenderDetail = await KmpMatrixDataPoints.findOne({ 
          memberName: memberDetail.expectedName,
          companyId: memberDetail.companyId,
          datapointId: "609d2c65be8b9d1b577ced55",//MASR008-kmp member gender id
          status: true 
        });
        console.log('memberGenderDetail', memberGenderDetail);
        let newKmpMemberObject = {
          createdBy: user,
          companyId: memberDetail.companyId,
          MASP003: memberDetail.expectedName,
          startDate: '',
          endDate: '',
          endDateTimeStamp: 0,
          dob: '',
          MASR008: memberGenderDetail ? memberGenderDetail.response : '',
          memberStatus: true,
          status: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        console.log('newKmpMemberObject', newKmpMemberObject);
        await Kmp.updateOne({ 
          companyId: memberDetail.companyId,
          MASP003: memberDetail.expectedName,
          status: true
         }, { 
          $set: newKmpMemberObject
         }, {
           $upsert: true
        });
      }
    }
    return res.status(200).json({ status: "200", message: "Board member names corrected!" });
  })
}