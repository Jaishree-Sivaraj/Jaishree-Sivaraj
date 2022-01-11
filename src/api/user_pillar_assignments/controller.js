import { success, notFound, authorOrAdmin } from '../../services/response/'
import { UserPillarAssignments } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  UserPillarAssignments.create({ ...body, createdBy: user })
    .then((userPillarAssignments) => userPillarAssignments.view(true))
    .then(success(res, 201))
    .catch(next)

export const assignPillarToUsers = async(req, res, next) => {
  try {
    let body = req.body;
    if (body && body.length > 0) {
      let pillarAssignmentList = [];
      for (let index = 0; index < body.length; index++) {
        let secondaryPillarList = [];
        if (body[index].secondary.length > 0) {
          for (let sIndex = 0; sIndex < body[index].secondary.length; sIndex++) {
            if (body[index].secondary[sIndex].value) {
              secondaryPillarList.push(body[index].secondary[sIndex].value);            
            }
          }
        }
        let objectToInsert = {
          clientTaxonomyId: body[index].taxonomy ? body[index].taxonomy.value : null,
          primaryPillar: body[index].primary ? body[index].primary.value : null,
          secondaryPillar: secondaryPillarList,
          userId: body[index].user ? body[index].user : null,
          status: true,
          createdBy: req.user
        }
        pillarAssignmentList.push(objectToInsert);
      }
      await UserPillarAssignments.insertMany(pillarAssignmentList)
      .then((record) => {
        return res.status(200).json({ status: "200", message: "Pillar assignment successful!" });
      })
      .catch((error) => {
        return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to assign pillar!" });
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to assign the pillars to users" })
  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  UserPillarAssignments.count(query)
    .then(count => UserPillarAssignments.find(query, select, cursor)
    .populate('clientTaxonomyId')
    .populate('primaryPillar')
    .populate('secondaryPillar')
    .populate('userId')
    .populate('createdBy')
      .then((userPillarAssignments) => ({
        count,
        rows: userPillarAssignments.map((userPillarAssignments) => userPillarAssignments.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  UserPillarAssignments.findById(params.id)
  .populate('clientTaxonomyId')
  .populate('primaryPillar')
  .populate('secondaryPillar')
  .populate('userId')
  .populate('createdBy')
    .then(notFound(res))
    .then((userPillarAssignments) => userPillarAssignments ? userPillarAssignments.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  UserPillarAssignments.findById(params.id)
  .populate('clientTaxonomyId')
  .populate('primaryPillar')
  .populate('secondaryPillar')
  .populate('userId')
  .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((userPillarAssignments) => userPillarAssignments ? Object.assign(userPillarAssignments, body).save() : null)
    .then((userPillarAssignments) => userPillarAssignments ? userPillarAssignments.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  UserPillarAssignments.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((userPillarAssignments) => userPillarAssignments ? userPillarAssignments.remove() : null)
    .then(success(res, 204))
    .catch(next)
