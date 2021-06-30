import _ from 'lodash'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Group } from '.'
import { User } from '../user'
import { BatchWisePillarAssignment } from '../batchWisePillarAssignment'
import { json } from 'body-parser'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Group.create({ ...body, createdBy: user })
    .then((group) => group.view(true))
    .then(success(res, 201))
    .catch(next)

export const createGroup = async ({ user, bodymen: { body } }, res, next) => {
  try {
    let membersList = [], batchWisePillars = [];;
    if (body.grpMembers && body.grpMembers.length > 0) {
      for (let grpIndex = 0; grpIndex < body.grpMembers.length; grpIndex++) {
        let ss = body.grpMembers[grpIndex]
        console.log(ss)
        const analyst = body.grpMembers[grpIndex].userDetail.value;
        membersList.push(analyst);
      }
    }
    let batchList = []
    if (body.assignedBatches && body.assignedBatches.length > 0) {
      for (let batchIndex = 0; batchIndex < body.assignedBatches.length; batchIndex++) {
        const batch = body.assignedBatches[batchIndex].id;
        const batchMembers = body.assignedBatches[batchIndex].members;
        for (let memberIndex = 0; memberIndex < batchMembers.length; memberIndex++) {
          let batchWisePillarMemberObject = {
            userId: batchMembers[memberIndex].userId,
            batchId: batch,
            pillars: batchMembers[memberIndex].pillars
          }
          batchWisePillars.push(batchWisePillarMemberObject);
        }
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
    await Group.create({ ...groupObject, createdBy: user })
      .then(async (group) => {
        if (membersList.length > 0) {
          await User.updateMany({
            "_id": { $in: membersList }
          }, { $set: { isAssignedToGroup: true } }, {});
        }
      })
    // .then(success(res, 201))
    // .catch(next)
    await BatchWisePillarAssignment.insertMany(batchWisePillars)
      .then((err, result) => {
        if (err) {
          console.log('error', err);
        } else {
          //  console.log('result', result);
        }
      });
    res.status(200).json({ status: "200", message: "Group Created Successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Group.count(query)
    .then(count => Group.find(query)
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

export const show = ({ params }, res, next) =>
  Group.findById(params.id)
    .populate('createdBy')
    .populate('groupAdmin')
    .populate('batchList')
    .populate('assignedMembers')
    .then(notFound(res))
    .then((group) => {
      let batchObjects = [];
      group.batchList.forEach(obj => {
        batchObjects.push({ value: obj.id, label: obj.batchName });
      })
      let memberObjects = [];
      group.assignedMembers.forEach(obj => {
        memberObjects.push({ value: obj.id, label: obj.name });
      })
      let responseObject = {
        _id: group.id,
        groupName: group.groupName,
        assignBatch: batchObjects,
        assignMembers: memberObjects,
        admin: { value: group.groupAdmin.id, label: group.groupAdmin.name }
      }
      return ({ message: "Retrieved group successfully!", status: "200", data: responseObject });
    })
    .then(success(res))
    .catch(next)

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
  if (body.assignMembers && body.assignMembers.length > 0) {
    for (let aindex = 0; aindex < body.assignMembers.length; aindex++) {
      const member = body.assignMembers[aindex].value;
      membersList.push(member);
    }
  }
  let batchList = [];
  if (body.assignBatch && body.assignBatch.length > 0) {
    for (let bindex = 0; bindex < body.assignBatch.length; bindex++) {
      const batch = body.assignBatch[bindex].value;
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
