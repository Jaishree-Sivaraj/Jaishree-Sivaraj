import _ from 'lodash'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Group } from '.'
import { User } from '../user'
import { Batches } from '../batches'
import { Categories } from '../categories'
import { UserPillarAssignments } from '../user_pillar_assignments'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Group.create({ ...body, createdBy: user })
    .then((group) => group.view(true))
    .then(success(res, 201))
    .catch(next)

export const createGroup = async ({ user, bodymen: { body } }, res, next) => {
  try {
      let membersList = [];
      if (body.grpMembers && body.grpMembers.length > 0) {
        for (let grpIndex = 0; grpIndex < body.grpMembers.length; grpIndex++) {
          const analyst = body.grpMembers[grpIndex].userDetails ? body.grpMembers[grpIndex].userDetails.value : null;
          membersList.push(analyst);
        }
      }
      let batchList = []
      if (body.assignedBatches && body.assignedBatches.length > 0) {
        for (let batchIndex = 0; batchIndex < body.assignedBatches.length; batchIndex++) {
          const batch = body.assignedBatches[batchIndex]._id;
          batchList.push(batch);
        }
      }
      let groupObject = {
        groupName: body.grpName ? body.grpName : ' ',
        groupAdmin: body.grpAdmin ? body.grpAdmin.value : ' ',
        assignedMembers: membersList,
        batchList: batchList,
        status: true
      }
      if (body.groupId == '' || body.groupId == null || !body.groupId) {
        await Group.create({ ...groupObject, createdBy: user })
          .then(async (group) => {
            if (membersList.length > 0) {
              await User.updateMany({
                "_id": { $in: membersList }
              }, { $set: { isAssignedToGroup: true } }, {});
            }
            if (batchList.length > 0) {
              await Batches.updateMany({
                "_id": { $in: batchList }
              }, { $set: { isAssignedToGroup: true } }, {});
            }
            res.status(200).json({ status: "200", message: "Group Created Successfully" });
          })
          .catch((error) => {  
            if (error.name === 'MongoError' && error.code === 11000) {
              res.status(409).json({
                valid: false,
                param: 'groupName',
                message: 'groupName already registered'
              })
          }else { 
            return res.status(500).json({status: "500", message: error.message ? error.message : 'Failed to create group!'}) }
        });
      } else {
        //before updating the group details marked all group member's and batch's isAssignedToGroup as false bcz some group members might be removed
        await Group.findById(body.groupId).then(async(groupDetail) => {
          if (groupDetail) {
            console.log('groupDetail.assignedMembers', groupDetail.assignedMembers);
            if (groupDetail.assignedMembers.length > 0) {
              await User.updateMany({
                "_id": { $in: groupDetail.assignedMembers }
              }, { $set: { isAssignedToGroup: false } }, {});
            }
            if (groupDetail.batchList.length > 0) {
              await Batches.updateMany({
                "_id": { $in: groupDetail.batchList }
              }, { $set: { isAssignedToGroup: false } }, {});
            }
          }
        }).catch((error) => { return res.status(500).json({status: "500", message: error.message ? error.message : 'Group not found!'}) });
  
        await Group.update({ _id: body.groupId },{ $set: { ...groupObject, createdBy: user } })
          .then(async (group) => {
            if (membersList.length > 0) {
              await User.updateMany({
                "_id": { $in: membersList }
              }, { $set: { isAssignedToGroup: true } }, {});
            }
            if (batchList.length > 0) {
              await Batches.updateMany({
                "_id": { $in: batchList }
              }, { $set: { isAssignedToGroup: true } }, {});
            }
            res.status(200).json({ status: "200", message: "Group updated Successfully" });
          })
          .catch((error) => { return res.status(500).json({status: "500", message: error.message ? error.message : 'Failed to update group!'}) });
      }
  } catch (error) {
    res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to create Group!" });
  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Group.count(query)
    .then(count => Group.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy')
      .populate('groupAdmin')
      .populate('batchList')
      .populate('assignedMembers')
      .then((groups) => {
        let responseList = [];
        groups.forEach(item => {
          let memberObjects = [];
          item.assignedMembers.forEach(obj => {
            memberObjects.push({ value: obj.id, label: obj.name });
          })
          let objectToPush = {
            _id: item.id,
            groupName: item.groupName,
            admin: { value: item.groupAdmin.id, label: item.groupAdmin.name },
            assignBatch: item.batchList,
            assignMembers: memberObjects,
            status: true
          }
          responseList.push(objectToPush);
        });
        return ({
          message: "Groups retrieved successfully",
          status: "200",
          count,
          rows: responseList
        })
      })
    )
    .then(success(res))
    .catch(next)

export const getGroupsOfAnAdmin = ({ params, querymen: { query, select, cursor } }, res, next) => {
  Group.count({ groupAdmin: params.groupAdmin ? params.groupAdmin : null })
    .then(count => Group.find({ groupAdmin: params.groupAdmin ? params.groupAdmin : null })
      .populate('createdBy')
      .populate('groupAdmin')
      .populate('batchList')
      .populate('assignedMembers')
      .then((groups) => {
        let responseList = [];
        groups.forEach(item => {
          let memberObjects = [];
          item.assignedMembers.forEach(obj => {
            memberObjects.push({ value: obj.id, label: obj.name });
          })
          let objectToPush = {
            _id: item.id,
            groupName: item.groupName,
            admin: { value: item.groupAdmin.id, label: item.groupAdmin.name },
            assignBatch: item.batchList,
            assignMembers: memberObjects,
            status: true
          }
          responseList.push(objectToPush);
        });
        return ({
          count,
          message: "Groups retrieved successfully!",
          status: "200",
          rows: responseList
        })
      })
    )
    .then(success(res))
    .catch(next)
}

export const show = async({ params }, res, next) => {
  await Group.findById(params.id)
    .populate('createdBy')
    .populate('groupAdmin')
    .populate('batchList')
    .populate('assignedMembers')
    .then(async(group) => {
      let batchObjects = [], groupTaxonomies = [], pillarList = [];
      if (group) {
        if (group.batchList && group.batchList.length >0) {
          for (let batchIndex = 0; batchIndex < group.batchList.length; batchIndex++) {
            let obj = group.batchList[batchIndex];
            if (obj && Object.keys(obj).length > 0) {
              let batchDetail = await Batches.findOne({"_id": obj._id}).populate('clientTaxonomy');
              batchObjects.push({ value: obj._id, label: obj.batchName, taxonomy:{ value: batchDetail.clientTaxonomy.id, label: batchDetail.clientTaxonomy.taxonomyName }, isAssignedToGroup: true });
              let foundObject = groupTaxonomies.find((item)=>item.value == batchDetail.clientTaxonomy.id);
              if(!foundObject){
                groupTaxonomies.push({ value: batchDetail.clientTaxonomy.id, label: batchDetail.clientTaxonomy.taxonomyName });
                await Categories.find({ clientTaxonomyId: batchDetail.clientTaxonomy.id, status: true }).populate('clientTaxonomyId')
                .then((categories) => {
                  if (categories && categories.length > 0) {
                    for (let cIndex = 0; cIndex < categories.length; cIndex++) {
                      pillarList.push({ value: categories[cIndex].id, label: categories[cIndex].categoryName + ' - ' + categories[cIndex].clientTaxonomyId.taxonomyName });
                    }
                  }
                });
              }              
            }
          }        
        }
        await Batches.find({isAssignedToGroup: false, status: true})
        .populate('companiesList')
        .populate('clientTaxonomy')
        .then((batchList) => {
          if (batchList) {
            if (batchList && batchList.length >0) {
              for (let bIndex = 0; bIndex < batchList.length; bIndex++) {
                let obj = batchList[bIndex];
                if (obj && Object.keys(obj).length > 0) {
                  batchObjects.push({ 
                    value: obj._id, 
                    label: obj.batchName, 
                    taxonomy:{ value: obj.clientTaxonomy.id, label: obj.clientTaxonomy.taxonomyName }, 
                    isAssignedToGroup: obj.isAssignedToGroup 
                  });
                }
              }
            }
          }
        })
        .catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : 'Unassigned batches not found!' });
        })
        let admin = {};
        let adminDetail = await User.findById(group.groupAdmin ? group.groupAdmin.id : null)
        .populate({ path: 'roleDetails.roles' })
        .populate({ path: 'roleDetails.primaryRole' })
        .catch((error) => {
          return res.status(500).json({status: "500", message: error.message ? error.message : "Group admin not found!"})
        });
        if (adminDetail) {
          admin = {
            userDetails: {
              value: group.groupAdmin.id,
              label: adminDetail.name + "-" + admin.email,
            },
            roleDetails: {
              role: adminDetail.roleDetails.roles.map((rec) => {
                return { value: rec.id, label: rec.roleName }
              }),
              primaryRole: { value: adminDetail.roleDetails.primaryRole ? adminDetail.roleDetails.primaryRole.id : null, label: adminDetail.roleDetails.primaryRole ? adminDetail.roleDetails.primaryRole.roleName : null }
            }
          };
        }
        let memberObjects = [], membersForPillar = [];
        for (let amIndex = 0; amIndex < group.assignedMembers.length; amIndex++) {
          const obj = group.assignedMembers[amIndex];
          let member = {}, pillarMember = {};
          let memberDetail = await User.findById(obj ? obj.id : null)
          .populate({ path: 'roleDetails.roles' })
          .populate({ path: 'roleDetails.primaryRole' });
          if (memberDetail) {
            member = {
              userDetails: {
                value: obj.id,
                label: memberDetail.name + "-" + memberDetail.email,
              },
              roleDetails: {
                role: memberDetail.roleDetails.roles.map((rec) => {
                  return { value: rec.id, label: rec.roleName }
                }),
                primaryRole: { value: memberDetail.roleDetails.primaryRole ? memberDetail.roleDetails.primaryRole.id : null, label: memberDetail.roleDetails.primaryRole ? memberDetail.roleDetails.primaryRole.roleName : null }
              },
              isAssignedToGroup: true
            };
            memberObjects.push(member)
            let pillarDetail = await UserPillarAssignments.findOne({ userId: obj.id, status: true })
            .populate('userId')
            .populate('primaryPillar')
            .populate('secondaryPillar')
            .catch((error) => {
              return res.status(500).json({status: "500", message: error.message ? error.message : "Pillar assignment not found!"})
            });
            if (pillarDetail) {
              pillarMember = {
                value: obj.id,
                label: obj.name + "-" + obj.email,
                isPillarAssigned: true,
                primaryPillar: pillarDetail.primaryPillar,
                secondaryPillar: pillarDetail.secondaryPillar
              }
            } else {
              pillarMember = {
                value: obj.id,
                label: obj.name + "-" + obj.email,
                isPillarAssigned: false,
                primaryPillar: {},
                secondaryPillar: []
              }
            }
            membersForPillar.push(pillarMember);
          } else {
            memberObjects.push({ userDetails: { value: obj.id, label: obj.name } });
          }
        }
        let allAnalystAndQaMembers = await User.find({
          isUserApproved: true,
          isAssignedToGroup: false,
          isRoleAssigned: true,
          isUserActive: true,
          userType: "Employee",
          status: true
        }).populate({ path: 'roleDetails.roles' })
        .populate({ path: 'roleDetails.primaryRole' })
        .catch((error) => {
          return res.status(500).json({status: "500", message: error.message ? error.message : "Group admin not found!"})
        });
        if (allAnalystAndQaMembers && allAnalystAndQaMembers.length > 0) {
          for (let uIndex = 0; uIndex < allAnalystAndQaMembers.length; uIndex++) {
            const obj = allAnalystAndQaMembers[uIndex];
            let member = {};
            if (obj) {
              member = {
                userDetails: {
                  value: obj.id,
                  label: obj.name + "-" + obj.email,
                },
                roleDetails: {
                  role: obj.roleDetails.roles.map((rec) => {
                    return { value: rec.id, label: rec.roleName }
                  }),
                  primaryRole: { value: obj.roleDetails.primaryRole ? obj.roleDetails.primaryRole.id : null, label: obj.roleDetails.primaryRole ? obj.roleDetails.primaryRole.roleName : null }
                },
                isAssignedToGroup: false
              };
              memberObjects.push(member)
            }
            
          }          
        }
        let responseObject = {
          _id: group.id,
          groupName: group.groupName,
          assignBatch: batchObjects,
          memberforgrpEdit: memberObjects,
          memberForPillar: membersForPillar,
          taxonomyList: groupTaxonomies ? groupTaxonomies : [],
          pillarList: pillarList,
          admin: admin
        }
        return res.status(200).json({ status: "200", message: "Retrieved group successfully!", data: responseObject });
      } else {
        return res.status(400).json({ status: "400", message: "Group not found!", data: null });
      }
    })
}

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Group.findById(params.id)
    .populate('createdBy')
    .populate('groupAdmin')
    .populate('batchList')
    .populate('assignedMembers')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((group) => group ? Object.assign(group, body).save() : null)
    .then((group) => group ? group.view(true) : null)
    .then(success(res))
    .catch(next)

export const updateGroup = async ({ user, bodymen: { body }, params }, res, next) => {
  let membersList = [];
  if (body.grpMembers && body.grpMembers.length > 0) {
    for (let aindex = 0; aindex < body.grpMembers.length; aindex++) {
      const member = body.grpMembers[aindex].userDetails ? body.grpMembers[aindex].userDetails.value : null;
      membersList.push(member);
    }
  }
  let batchList = [];
  if (body.assignedBatches && body.assignedBatches.length > 0) {
    for (let bindex = 0; bindex < body.assignedBatches.length; bindex++) {
      const batch = body.assignedBatches[bindex]._id;
      batchList.push(batch);
    }
  }
  let groupObject = {
    groupName: body.groupName ? body.groupName : '',
    groupAdmin: body.admin ? body.admin.value : '',
    assignedMembers: membersList,
    batchList: batchList,
    status: body.status
  }

  await Group.update({ _id: params.id }, { $set: groupObject })
    .then((err, result) => {
      if (err) {
        console.log('error', err);
        return err;
      } else {
        return ({ message: "Group updated successfuly!", status: "200", data: groupObject });
      }
    })
}

export const destroy = ({ user, params }, res, next) =>
  Group.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((group) => group ? group.remove() : null)
    .then(success(res, 204))
    .catch(next)
