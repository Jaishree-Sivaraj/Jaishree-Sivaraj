import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Kmp } from '.'
import _ from 'lodash'

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
  console.log(body.companyId, body.memberName, body.endDate);
    try {
        let yearTimeStamp = Math.floor(new Date(body.endDate).getTime()/1000);
        await Kmp.updateMany({
          companyId: body.companyId,
          id: {$in : body.memberName},    
        },{
          $set:{endDate: body.endDate, endDateTimeStamp: yearTimeStamp,createdBy:user}
        })
        return res.status(200).json({
          message: "KmpMember endDate updated successfully"
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
        if(mergeKmpMemberList.length > 0){
          return res.status(200).json({
            message: "KmpMember List",
            KMPList: mergeKmpMemberList
          });
        } else{
          return res.status(404).json({
            message: "No active members found"
          });
        }     
      } catch (error) {
        return res.status(500).json({
          message: error.message,
          status: 500
        });    
      }
    }
