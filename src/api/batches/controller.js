import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Batches } from '.'
import { Companies } from '../companies'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Batches.create({ ...body, createdBy: user })
    .then((batches) => batches.view(true))
    .then(success(res, 201))
    .catch(next)

export const createBatch = async({ user, bodymen: { body } }, res, next) => {
  let companiesList = [];
  if (body.companies && body.companies.length > 0) {
    for (let index = 0; index < body.companies.length; index++) {
      const company = body.companies[index].value;
      companiesList.push(company);
    }
  }
  let yearsList = [];
  if (body.years && body.years.length > 0) {
    for (let yearIndex = 0; yearIndex < body.years.length; yearIndex++) {
      const year = body.years[yearIndex].value;
      yearsList.push(year);
    }
  }
  let batchObject = {
    batchName: body.batchName ? body.batchName : '',
    clientTaxonomy: body.taxonomy ? body.taxonomy.value : '',
    companiesList: companiesList,
    years: yearsList,
    status: true
  }
  await Batches.create({ ...batchObject, createdBy: user })
  .then(async(batch) => {
    await Companies.updateMany({
      "_id": { $in: companiesList }
    }, { $set: { isAssignedToBatch: true } }, {});
    return res.status(200).json({ message: "New batch created", status: "200", data: batch});
  })
  .catch((err) => {
    /* istanbul ignore else */
    res.status(400).json({
      message: err.message ? err.message : 'Failed to create batch, invalid details'
    })
  })
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>{
  Batches.count(query)
    .then(count => Batches.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy')
      .populate('companiesList')
      .populate('clientTaxonomy')
      .then((batches) => {
        let responseList = [];
        batches.forEach(item => {
          let yearObjects = [];
          item.years.forEach(obj => {
            yearObjects.push({value: obj, label: obj});
          })
          let companyObjects = [];
          if (item.companiesList.length > 0) {
            item.companiesList.forEach(obj => {
              companyObjects.push({value: obj.id, selectedCompany: obj.companyName});
            })            
          }
          let objectToPush = {
            _id: item.id,
            years: yearObjects,
            batchName: item.batchName,
            taxonomy: { value: item.clientTaxonomy.id, label: item.clientTaxonomy.taxonomyName },
            companies: companyObjects,
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
}

export const getAllUnAssignedBatches = ({ querymen: { query, select, cursor } }, res, next) => {
  
  Batches.count({isAssignedToGroup: false, status: true})
    .then(count => Batches.find({isAssignedToGroup: false, status: true})
    .sort({createdAt: -1})
      .populate('createdBy')
      .populate('companiesList')
      .populate('clientTaxonomy')
      .then((batches) => {
        let responseList = [];
        batches.forEach(item => {
          let yearObjects = [];
          item.years.forEach(obj => {
            yearObjects.push({value: obj, label: obj});
          })
          let companyObjects = [];
          if (item.companiesList.length > 0) {
            item.companiesList.forEach(obj => {
              companyObjects.push({value: obj.id, selectedCompany: obj.companyName});
            })            
          }
          let objectToPush = {
            _id: item.id,
            years: yearObjects,
            batchName: item.batchName,
            taxonomy: { value: item.clientTaxonomy.id, label: item.clientTaxonomy.taxonomyName },
            companies: companyObjects,
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
}

export const show = ({ params }, res, next) =>
  Batches.findById(params.id)
    .populate('createdBy')
    .populate('companiesList')
    .populate('clientTaxonomy')
    .then(notFound(res))
    .then((batch) => {
      let yearObjects = [];
      batch.years.forEach(obj => {
        yearObjects.push({value: obj, label: obj});
      })
      let companyObjects = [];
      if (batch.companiesList.length > 0) {
        batch.companiesList.forEach(obj => {
          companyObjects.push({value: obj.id, selectedCompany: obj.companyName});
        })        
      }
     let responseObject = {
       _id: batch.id,
       batchName: batch.batchName,
       years: yearObjects,
       companies: companyObjects,
       taxonomy: { value: batch.clientTaxonomy.id, label: batch.clientTaxonomy.taxonomyName }
     }
     return (responseObject);
    })
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
    Batches.findById(params.id)
        .populate('createdBy')
        .populate('companiesList')
        .then(notFound(res))
        .then(authorOrAdmin(res, user, 'createdBy'))
        .then((batches) => batches ? Object.assign(batches, body).save() : null)
        .then((batches) => batches ? batches.view(true) : null)
        .then(success(res))
        .catch(next)

export const updateBatch = async({ user, bodymen: { body }, params }, res, next) => {
  Batches.findById(params.id)
    .populate('createdBy')
    .populate('companiesList')
    .populate('clientTaxonomy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then(async(batch) => {
      let companiesList = [];
      if (body.companies && body.companies.length > 0) {
        for (let index = 0; index < body.companies.length; index++) {
          const company = body.companies[index].value;
          companiesList.push(company);
        }
      }
      let yearsList = [];
      if (body.years && body.years.length > 0) {
        for (let yearIndex = 0; yearIndex < body.years.length; yearIndex++) {
          const year = body.years[yearIndex].value;
          yearsList.push(year);
        }
      }
      let batchObject = {
        batchName: body.batchName ? body.batchName : '',
        clientTaxonomy: body.taxonomy ? body.taxonomy.value : '',
        companiesList: companiesList,
        years: yearsList,
        status: body.status
      }
      await Batches.update({_id: params.id}, { $set: batchObject })
      .then((err, result) => {
        if (err) {
          console.log('error', err);
          return err;
        } else {
          return ({ message: "Batch updated successfuly!", status: "200", data: batchObject });
        }
      })
    })
    .then(success(res))
    .catch(next)
}

export const destroy = ({ user, params }, res, next) =>
  Batches.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((batches) => batches ? batches.remove() : null)
    .then(success(res, 204))
    .catch(next)
