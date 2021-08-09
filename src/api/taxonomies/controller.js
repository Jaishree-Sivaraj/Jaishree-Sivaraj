import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Taxonomies } from '.'

export const create = ({ user, bodymen: { body } }, res, next) => {
  try {
    Taxonomies.create({ ...body, createdBy: user })
      .then((taxonomy) => {
        if (taxonomy) {
          return res.status(200).json({ status: "200", message: 'New header created successfully!', data: taxonomy ? taxonomy.view(true) : [] });
        } else {
          return res.status(500).json({ status: "500", message: 'Failed to create new header!' });
        }
      })
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new header!' });
      })  
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new header!' });
  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Taxonomies.count(query)
    .then(count => Taxonomies.find(query)
      .populate('createdBy')
      .then((taxonomies) => ({
        count,
        rows: taxonomies.map((taxonomies) => taxonomies.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Taxonomies.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((taxonomies) => taxonomies ? taxonomies.view() : null)
    .then(success(res))
    .catch(next)

export const update = async({ user, bodymen: { body }, params }, res, next) => {
  try {
    await Taxonomies.findById(params.id)
      .then(async(taxonomy) => {
        if (taxonomy) {
          await Taxonomies.updateOne({ _id: taxonomy.id }, { $set: body })
          .catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to update header!" }) })
          return res.status(200).json({ status: "200", message: 'Header updated successfully!', data: taxonomy ? taxonomy.view(true) : [] });
        } else {
          return res.status(500).json({ status: "500", message: 'Failed to update header!' });
        }
      })
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message : 'Header not found!' });
      })  
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : 'Header not found!' });
  }
}

export const destroy = ({ user, params }, res, next) =>
  Taxonomies.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taxonomies) => taxonomies ? taxonomies.remove() : null)
    .then(success(res, 204))
    .catch(next)
