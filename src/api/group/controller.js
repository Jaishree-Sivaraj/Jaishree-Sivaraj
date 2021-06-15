import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Group } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Group.create({ ...body, createdBy: user })
    .then((group) => group.view(true))
    .then(success(res, 201))
    .catch(next)

export const createGroup = async({ user, bodymen: { body } }, res, next) =>{
  let qaList = [];
  if (body.assignQA && body.assignQA.length > 0) {
    for (let index = 0; index < body.assignQA.length; index++) {
      const qa = body.assignQA[index].value;
      qaList.push(qa);
    }
  }
  let analystList = [];
  if (body.assignAnalyst && body.assignAnalyst.length > 0) {
    for (let aindex = 0; aindex < body.assignAnalyst.length; aindex++) {
      const analyst = body.assignAnalyst[aindex].value;
      analystList.push(analyst);
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
    assignedQA: qaList,
    assignedAnalyst: analystList,
    batchList: batchList,
    status: true
  }
  await Group.create({ ...groupObject, createdBy: user })
    .then((group) => group.view(true))
    .then(success(res, 201))
    .catch(next)
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Group.count(query)
    .then(count => Group.find(query)
      .populate('createdBy')
      .populate('groupAdmin')
      .populate('batchList')
      .populate('assignedAnalyst')
      .populate('assignedQA')
      .then((groups) => {
        let responseList = [];
        groups.forEach(item => {
          // let batchObjects = [];
          // item.batchList.forEach(obj => {
          //   batchObjects.push({value: obj.id, label: obj.batchName});
          // })
          let analystObjects = [];
          item.assignedAnalyst.forEach(obj => {
            analystObjects.push({value: obj.id, label: obj.name});
          })
          let qaObjects = [];
          item.assignedQA.forEach(obj => {
            qaObjects.push({value: obj.id, label: obj.name});
          })
          let objectToPush = {
            _id: item.id,
            groupName: item.groupName,
            admin: { value: item.groupAdmin.id, label: item.groupAdmin.name },
            assignBatch: item.batchList,
            assignAnalyst: analystObjects,
            assignQA: qaObjects,
            status: true
          }
          responseList.push(objectToPush);
        });
        return ({
          count,
          rows: responseList
        })
    })
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Group.findById(params.id)
    .populate('createdBy')
    .populate('groupAdmin')
    .populate('batchList')
    .populate('assignedAnalyst')
    .populate('assignedQA')
    .then(notFound(res))
    .then((group) => {
      let batchObjects = [];
      group.batchList.forEach(obj => {
        batchObjects.push({value: obj.id, label: obj.batchName});
      })
      let analystObjects = [];
      group.assignedAnalyst.forEach(obj => {
        analystObjects.push({value: obj.id, label: obj.name});
      })
      let qaObjects = [];
      group.assignedQA.forEach(obj => {
        qaObjects.push({value: obj.id, label: obj.name});
      })
      let responseObject = {
        _id: group.id,
        groupName: group.groupName,
        assignBatch: batchObjects,
        assignAnalyst: analystObjects,
        assignQA: qaObjects,
        admin: { value: group.groupAdmin.id, label: group.groupAdmin.name }
      }
      return (responseObject);
    })
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Group.findById(params.id)
    .populate('createdBy')
    .populate('groupAdmin')
    .populate('batchList')
    .populate('assignedAnalyst')
    .populate('assignedQA')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((group) => group ? Object.assign(group, body).save() : null)
    .then((group) => group ? group.view(true) : null)
    .then(success(res))
    .catch(next)

export const updateGroup = async({ user, bodymen: { body }, params }, res, next) => {
  let qaList = [];
  if (body.assignQA && body.assignQA.length > 0) {
    for (let index = 0; index < body.assignQA.length; index++) {
      const qa = body.assignQA[index].value;
      qaList.push(qa);
    }
  }
  let analystList = [];
  if (body.assignAnalyst && body.assignAnalyst.length > 0) {
    for (let aindex = 0; aindex < body.assignAnalyst.length; aindex++) {
      const analyst = body.assignAnalyst[aindex].value;
      qaList.push(analyst);
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
    assignedQA: qaList,
    assignedAnalyst: analystList,
    batchList: batchList,
    status: body.status
  }
  
  await Group.update({_id: params.id}, { $set: groupObject })
  .then((err, result) => {
    if (err) {
      console.log('error', err);
      return err;
    } else {
      return ({ message: "Group updated successfuly!", data: groupObject });
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
