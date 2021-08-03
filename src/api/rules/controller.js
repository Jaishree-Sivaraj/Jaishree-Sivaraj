import { success, notFound } from '../../services/response/'
import { Rules } from '.'

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
        await Rules.updateOne({ _id: item.id }, { $set: { categoryId: item.datapointId.categoryId.id, dpCode: item.datapointId.code } });
      }
      return res.status(200).json({ status: "200", message: "Extra-keys added for rules!" });
    } else {
      return res.status(200).json({ status: "200", message: "No rules found!" });
    }
  });
}