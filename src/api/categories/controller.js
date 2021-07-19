import { success, notFound } from '../../services/response/'
import { Categories } from '.'
import { Group } from '../group'
import { UserPillarAssignments } from '../user_pillar_assignments'

export const create = ({ bodymen: { body } }, res, next) =>
  Categories.create(body)
    .then((categories) => categories.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Categories.count(query)
    .then(count => Categories.find(query, select, cursor)
      .then((categories) => ({
        count,
        rows: categories.map((categories) => categories.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Categories.findById(params.id)
    .then(notFound(res))
    .then((categories) => categories ? categories.view() : null)
    .then(success(res))
    .catch(next)

export const getTaxonomyCategories = async({ bodymen: { body }, params }, res, next) => {
  await Categories.find({ clientTaxonomyId: body.clientTaxonomyId ? body.clientTaxonomyId : null })
    .then(async(categories) => {
      await Group.findById(body.groupId)
      .populate('groupAdmin')
      .populate('batchList')
      .populate('assignedMembers')
      .then(async(groupDetail) => {
        let groupMembers = groupDetail.assignedMembers ? groupDetail.assignedMembers : [];
        if (groupMembers.length > 0) {
          console.log('groupMembers', groupMembers);
          await UserPillarAssignments.find({clientTaxonomyId: body.clientTaxonomyId, status: true})
          .populate('userId')
          .then((pillarAssignedUsers) => {
            let unAssignedUsers = [];
            if (pillarAssignedUsers && Object.keys(pillarAssignedUsers).length>0) {
              if (groupMembers.length > 0) {
                for (let gIndex = 0; gIndex < groupMembers.length; gIndex++) {
                  const object = groupMembers[gIndex];
                  var foundUser = pillarAssignedUsers.find(rec => { return rec.userId.id === object.id; });
                  console.log('foundUser', foundUser);
                  if (!foundUser) {
                    unAssignedUsers.push({ 
                      value: groupMembers[gIndex].id, 
                      label: groupMembers[gIndex].name, 
                      isPillarAssigned: false
                    });
                  } else {
                    unAssignedUsers.push({ 
                      value: groupMembers[gIndex].id, 
                      label: groupMembers[gIndex].name, 
                      isPillarAssigned: true
                    });
                  }                   
                }
              }
            } else {
              if (groupMembers.length > 0) {
                for (let gIndex = 0; gIndex < groupMembers.length; gIndex++) {
                  unAssignedUsers.push({ 
                    value: groupMembers[gIndex].id, 
                    label: groupMembers[gIndex].name, 
                    isPillarAssigned: false 
                  });
                }
              }
            }
            return res.status(200).json({
              status: "200",
              message: "Retrieved details successfully!",
              count: categories.length,
              categories: categories.map((categories) => categories.view()),
              members: unAssignedUsers
            })
          })
          .catch((error) => {
            return res.status(500).json({status: "500", message: error.message ? error.message : "No pillar assigned for this group member of selected taxonomy!"})
          });
        } else {
          return res.status(200).json({
            status: "200",
            message: "Retrieved details successfully!",
            count: categories.length,
            categories: categories.map((categories) => categories.view()),
            unAssignedUsers: []
          })
        }
      })
      .catch((error) => { return res.status(500).json({"status": 500, "message": error.message ? error.message : "Group not found!"}) })
    })
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to fetch categories!"})
    })
}

export const update = ({ bodymen: { body }, params }, res, next) =>
  Categories.findById(params.id)
    .then(notFound(res))
    .then((categories) => categories ? Object.assign(categories, body).save() : null)
    .then((categories) => categories ? categories.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Categories.findById(params.id)
    .then(notFound(res))
    .then((categories) => categories ? categories.remove() : null)
    .then(success(res, 204))
    .catch(next)
