import { success, notFound } from '../../services/response/'
import { Rules } from '.'
import { Datapoints } from '../datapoints'

export const create = ({ bodymen: { body } }, res, next) =>
  Rules.create(body)
    .then((rules) => rules.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Rules.count(query)
    .then(count => Rules.find(query, select, cursor)
    .populate('datapointId')
      .then((rules) => ({
        count,
        rows: rules.map((rules) => rules.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Rules.findById(params.id)
  .populate('datapointId')
    .then(notFound(res))
    .then((rules) => rules ? rules.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  Rules.findById(params.id)
  .populate('datapointId')
    .then(notFound(res))
    .then((rules) => rules ? Object.assign(rules, body).save() : null)
    .then((rules) => rules ? rules.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Rules.findById(params.id)
    .then(notFound(res))
    .then((rules) => rules ? rules.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const addExtraKeys = async({ params }, res, next) => {
  await Rules.find({})
  .populate({
    path: "datapointId",
    populate: {
      path: "categoryId"
    }
 })
  .then(async(allRules) => {
    if (allRules && allRules.length > 0) {
      for (let index = 0; index < allRules.length; index++) {
        const item = allRules[index];
        await Rules.updateOne({ _id: item.id }, { $set: { categoryId: item.datapointId.categoryId.id, dpCode: item.datapointId.code } }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to update categoryId for ' + item.code + ' of id ' + item.id }) });;
      }
      await Datapoints.find({})
      .populate({
        path: "keyIssueId",
        populate: {
          path: "themeId"
        }
      })
      .then(async(allDatapoints) => {
        if (allDatapoints &&  allDatapoints.length > 0) {
          for (let dIndex = 0; dIndex < allDatapoints.length; dIndex++) {
            const dItem = allDatapoints[dIndex];
            await Datapoints.updateOne({ _id: dItem.id }, { $set: { themeId: dItem.keyIssueId.themeId.id } }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to update themeId for ' + dItem.code + ' of id ' + dItem.id }) });
          }
        }
      })
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message : 'No datapoint found!' });
      })
      return res.status(200).json({ status: "200", message: "Extra-keys added for rules and themeId for datapoints!" });
    } else {
      return res.status(200).json({ status: "200", message: "No rules found!" });
    }
  })
  .catch((error) => {
    return res.status(500).json({ status: "500", message: error.message ? error.message : 'No datapoint found!' });
  });
}