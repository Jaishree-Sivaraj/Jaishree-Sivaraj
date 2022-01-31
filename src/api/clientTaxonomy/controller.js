import _ from 'lodash'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ClientTaxonomy } from '.'
import { Categories } from '../categories'
import { Companies } from '../companies'
import { CompaniesTasks } from '../companies_tasks'
// import { TaskAssignment } from '../taskAssignment'

export const create = async({ user, bodymen: { body } }, res, next) =>{
    ClientTaxonomy.create({ ...body, createdBy: user })
    .then((clientTaxonomy) => clientTaxonomy.view(true))
    .then(success(res, 201))
    .catch(next)
}
 

export const createClientTaxonomy = async({ user, bodymen: { body } }, res, next) => {
  // let fields = [];
  // if (body.headers && body.headers.length > 0) {
  //   for (let index = 0; index < body.headers.length; index++) {
  //   }
  // }
  let clientTaxonomyObject = {
    taxonomyName: body.taxonomyName ? body.taxonomyName : '',
    fields: body.headers ? body.headers : [],
    status: true
  }
  let taxonomyDetails = await ClientTaxonomy.find({taxonomyName: body.taxonomyName});
  if(taxonomyDetails.length > 0){
    res.status(409).json({
      message: 'TaxonomyName Already Exists'
    });
  } else{
    await ClientTaxonomy.create({ ...clientTaxonomyObject, createdBy: user })
    .then((clientTaxonomy) => {
      return res.status(200).json({ message: "Taxonomy created successfully!", data: clientTaxonomy});
    })
    .catch((err) => {
      res.status(400).json({
        message: err.message ? err.message : 'Failed to create Client Taxonomy, invalid details'
      })
    })
    
  }
}

export const index = async({ querymen: { query, select, cursor } }, res, next) =>{
  query.status = true;
  await ClientTaxonomy.countDocuments(query)
    .then(count => ClientTaxonomy.find(query)
      .populate('createdBy')
      .then(async(clientTaxonomies) => {
        let responseList = [];
        for (let index = 0; index < clientTaxonomies.length; index++) {
          const item = clientTaxonomies[index];
          let pillarList = [];
          const [ categoriesList, companiesList ] = await Promise.all([
            Categories.find({ clientTaxonomyId: item.id, status: true }),
            Companies.find({ clientTaxonomyId: item.id, status: true })
          ]);
          // let categoriesList = await Categories.find({ clientTaxonomyId: item.id, status: true });
          if (categoriesList.length > 0) {
            for (let cIndex = 0; cIndex < categoriesList.length; cIndex++) {
              const cItem = categoriesList[cIndex];
              pillarList.push({ value: cItem.id, label: cItem.categoryName });
            }
          }

          let nicCodeList = [];
          // let companiesList = await Companies.find({ clientTaxonomyId: item.id, status: true });
          if (companiesList.length > 0) {
            for (let cmpIndex = 0; cmpIndex < companiesList.length; cmpIndex++) {
              const cmpItem = companiesList[cmpIndex];
              nicCodeList.push({ value: cmpItem.nic, label: cmpItem.nic });
            }
          }

          let years = [];
          // let yearsList = await TaskAssignment.find({ companyId: { $in: companiesList }, taskStatus: {$in: [ "Verification Completed", "Completed" ] }, status: true }).distinct('year');
          // let yearsList = await CompaniesTasks.find({ companyId: { $in: companiesList }, overAllCompanyTaskStatus: true, status: true }).distinct('year');
          let yearsList = await CompaniesTasks.find({ companyId: { $in: companiesList }, overAllCompanyTaskStatus: true, status: true }).distinct('year');
          for (let yListIndex = 0; yListIndex < yearsList.length; yListIndex++) {
            years.push({ value: yearsList[yListIndex], label: yearsList[yListIndex] });
          }
          
          let nicList = _.uniqBy(nicCodeList, 'value');
          let objectToPush = {
            _id: item.id,
            taxonomyName: item.taxonomyName,
            headers: item.fields ? item.fields : [],
            nicList: nicList ? nicList : [],
            pillarList: pillarList ? pillarList : [],
            yearsList: yearsList ? yearsList : [],
            status: item.status
          }
          responseList.push(objectToPush);          
        }
        return res.status(200).json({
          status: "200",
          message: "Client taxonomy retrieved successfully",
          count,
          rows: responseList
        })
      })
    )
    // .then(success(res))
    .catch(next)
}

export const show = ({ params }, res, next) =>
  ClientTaxonomy.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((clientTaxonomy) => {
      // let headersList = [];
      // item.fields.forEach(obj => {
      //   headersList.push({value: obj.id, label: obj.name});
      // })
      let responseObject = {
        _id: clientTaxonomy.id,
        taxonomyName: clientTaxonomy.taxonomyName,
        headers: item.fields ? item.fields : [],
        status: item.status
      }
      return { status: "200", message: "Client taxonomy retrieved successfully", data: responseObject };
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
      // let fields = [];
      // if (body.headers && body.headers.length > 0) {
      //   for (let index = 0; index < body.headers.length; index++) {
      //   }
      // }
      let clientTaxonomyObject = {
        taxonomyName: body.taxonomyName ? body.taxonomyName : '',
        fields: body.headers ? body.headers : [],
        status: true
      }
      await ClientTaxonomy.update({_id: params.id}, { $set: clientTaxonomyObject })
      .then((err, result) => {
        if (err) {
          console.log('error', err);
          return res.status(200).json({ status: "200", message: "Client Taxonomy updated successfuly!", data: clientTaxonomyObject });
        } else {
          // 
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
