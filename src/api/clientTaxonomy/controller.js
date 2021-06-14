import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ClientTaxonomy } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  ClientTaxonomy.create({ ...body, createdBy: user })
    .then((clientTaxonomy) => clientTaxonomy.view(true))
    .then(success(res, 201))
    .catch(next)

export const createClientTaxonomy = async({ user, bodymen: { body } }, res, next) => {
  let fields = [];
  if (body.headers && body.headers.length > 0) {
    for (let index = 0; index < body.headers.length; index++) {
      const masterTaxonomy = body.headers[index].value;
      fields.push(masterTaxonomy);
    }
  }
  let clientTaxonomyObject = {
    taxonomyName: body.taxonomyName ? body.taxonomyName : '',
    fields: fields,
    status: true
  }
  await ClientTaxonomy.create({ ...clientTaxonomyObject, createdBy: user })
  .then((clientTaxonomy) => {
    return res.status(200).json(clientTaxonomy);
  })
  .catch((err) => {
    res.status(400).json({
      message: err.message ? err.message : 'Failed to create Client Taxonomy, invalid details'
    })
  })
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>{
  query.status = true;
  ClientTaxonomy.count(query)
    .then(count => ClientTaxonomy.find(query)
      .populate('createdBy').populate('fields')
      .then((clientTaxonomies) => {
        let responseList = [];
        clientTaxonomies.forEach(item => {
          let headersList = [];
          item.fields.forEach(obj => {
            headersList.push({value: obj.id, label: obj.name});
          })
          let objectToPush = {
            _id: item.id,
            taxonomyName: item.taxonomyName,
            headers: headersList,
            status: item.status
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
}

export const show = ({ params }, res, next) =>
  ClientTaxonomy.findById(params.id)
    .populate('createdBy').populate('fields')
    .then(notFound(res))
    .then((clientTaxonomy) => {
      let headersList = [];
      item.fields.forEach(obj => {
        headersList.push({value: obj.id, label: obj.name});
      })
      let responseObject = {
        _id: clientTaxonomy.id,
        taxonomyName: clientTaxonomy.taxonomyName,
        headers: headersList,
        status: item.status
      }
      return responseObject;
    })
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  ClientTaxonomy.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((clientTaxonomy) => clientTaxonomy ? Object.assign(clientTaxonomy, body).save() : null)
    .then((clientTaxonomy) => clientTaxonomy ? clientTaxonomy.view(true) : null)
    .then(success(res))
    .catch(next)

export const updateClientTaxonomy = async({ user, bodymen: { body }, params }, res, next) => {
  ClientTaxonomy.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then(async(clientTaxonomy) => {
      let fields = [];
      if (body.headers && body.headers.length > 0) {
        for (let index = 0; index < body.headers.length; index++) {
          const masterTaxonomy = body.headers[index].value;
          fields.push(masterTaxonomy);
        }
      }
      let clientTaxonomyObject = {
        taxonomyName: body.taxonomyName ? body.taxonomyName : '',
        fields: fields,
        status: true
      }
      await ClientTaxonomy.update({_id: params.id}, { $set: clientTaxonomyObject })
      .then((err, result) => {
        if (err) {
          console.log('error', err);
          return err;
        } else {
          return ({ message: "Client Taxonomy updated successfuly!", data: clientTaxonomyObject });
        }
      })
    })
    .then(success(res))
    .catch(next)
}

export const destroy = ({ user, params }, res, next) =>
  ClientTaxonomy.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((clientTaxonomy) => clientTaxonomy ? clientTaxonomy.remove() : null)
    .then(success(res, 204))
    .catch(next)
