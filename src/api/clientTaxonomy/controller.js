import _ from 'lodash'
import mongoose, { Schema } from 'mongoose'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ClientTaxonomy } from '.'
import { Categories } from '../categories'
import { Companies } from '../companies'
import { CompaniesTasks } from '../companies_tasks';
import { Datapoints } from '../datapoints';
// import { TaskAssignment } from '../taskAssignment'

export const create = async ({ user, bodymen: { body } }, res, next) => {
  ClientTaxonomy.create({ ...body, createdBy: user })
    .then((clientTaxonomy) => clientTaxonomy.view(true))
    .then(success(res, 201))
    .catch(next)
}


export const createClientTaxonomy = async ({ user, bodymen: { body } }, res, next) => {
  // let fields = [];
  // if (body.headers && body.headers.length > 0) {
  //   for (let index = 0; index < body.headers.length; index++) {
  //   }
  // }
  const { taxonomyName, headers, hasChildDp } = body;
  let clientTaxonomyObject = {
    taxonomyName: taxonomyName ? taxonomyName : '',
    fields: headers ? headers : [],
    hasChildDp: hasChildDp,
    status: true
  }
  let taxonomyDetails = await ClientTaxonomy.find({ taxonomyName: body.taxonomyName });
  if (taxonomyDetails.length > 0) {
    res.status(409).json({
      message: 'TaxonomyName Already Exists'
    });
  } else {
    await ClientTaxonomy.create({ ...clientTaxonomyObject, createdBy: user })
      .then((clientTaxonomy) => {
        return res.status(200).json({ message: "Taxonomy created successfully!", data: clientTaxonomy });
      })
      .catch((err) => {
        res.status(400).json({
          message: err.message ? err.message : 'Failed to create Client Taxonomy, invalid details'
        })
      })

  }
}

export const index = async ({ querymen: { query, select, cursor } }, res, next) => {
  query.status = true;
  await ClientTaxonomy.countDocuments(query)
    .then(count => ClientTaxonomy.find(query)
      .populate('createdBy')
      .then(async (clientTaxonomies) => {
        let responseList = [];
        const [ categoriesList, companiesList ] = await Promise.all([
          Categories.find({ status: true }).populate('clientTaxonomyId'),
          Companies.find({ status: true }).populate('clientTaxonomyId')
        ]);
        for (let index = 0; index < clientTaxonomies.length; index++) {
          const item = clientTaxonomies[index];
          let pillarList = [];
          const [categoriesList, companiesList] = await Promise.all([
            Categories.find({ clientTaxonomyId: item.id, status: true }),
            Companies.find({ clientTaxonomyId: item.id, status: true })
          ]);
          // let categoriesList = await Categories.find({ clientTaxonomyId: item.id, status: true });
          if (categoriesList.length > 0) {
            for (let cIndex = 0; cIndex < categoriesList.length; cIndex++) {
              const cItem = categoriesList[cIndex];
              if (cItem.clientTaxonomyId.id == item.id) {
                pillarList.push({ value: cItem.id, label: cItem.categoryName });
              }
            }
          }

          let nicCodeList = [];
          if (companiesList.length > 0) {
            for (let cmpIndex = 0; cmpIndex < companiesList.length; cmpIndex++) {
              const cmpItem = companiesList[cmpIndex];
              if (cmpItem.clientTaxonomyId.id == item.id) {
                nicCodeList.push({ value: cmpItem.nic, label: cmpItem.nic });
              }
            }
          }
          
          let nicList = _.uniqBy(nicCodeList, 'value');
          let objectToPush = {
            _id: item.id,
            taxonomyName: item.taxonomyName,
            headers: item.fields ? item.fields : [],
            nicList: nicList ? nicList : [],
            pillarList: pillarList ? pillarList : [],
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

export const retrieveAll = (req, res, next) => {
  ClientTaxonomy.countDocuments({status: true})
  .then((count => ClientTaxonomy.aggregate([{$match: {status: true} }, {
    $project: {
      "value": "$_id",
      "_id": 0,
      "label": "$taxonomyName"
    }
  }])
    .then((clientTaxonomies) => {
      return res.status(200).json({ status: "200", message: "Retrieved all Client Taxonomies successfully!", count: count ? count : 0, data: clientTaxonomies ? clientTaxonomies : [] });
    })
    .catch((error) => {
      return res.status(500).json({status: "500", message: error.message ? error.message : "Failed to retrieve all client taxonomies!", count: 0});
    })
  ))
}

export const retrieveDistinctDetails = async(req, res, next) => {
  const [ clientTaxonomyDetail, companyIds, categoriesList, companiesNicList ] = await Promise.all([
    ClientTaxonomy.findById(req.params.id ? req.params.id : null),
    Companies.find({ clientTaxonomyId: req.params.id ? req.params.id : null, status: true }).distinct('_id'),
    Categories.aggregate([{$match: { clientTaxonomyId: req.params.id ? mongoose.mongo.ObjectId(req.params.id) : null, status: true} }, {
      $project: {
        "value": "$_id",
        "_id": 0,
        "label": "$categoryName"
      }
    }]),
    Companies.aggregate([
      {$match: { clientTaxonomyId: req.params.id ? mongoose.mongo.ObjectId(req.params.id) : null, status: true} }, 
      { $group : { "_id" : "$nic" } }, 
      {$project: { "_id": 0, "value": "$_id", "label": "$_id" } 
    }])
  ]);
  const distinctYears = await CompaniesTasks.find({ companyId: { $in: companyIds }, status: true}).distinct('year');
  let pillarList = [];
  if (categoriesList.length > 0) {
    pillarList = categoriesList;
  }

  let nicCodeList = [];
  if (companiesNicList.length > 0) {
    nicCodeList = companiesNicList
  }
  let yearList = [];
  if (distinctYears.length > 0) {
    for (let cmpIndex = 0; cmpIndex < distinctYears.length; cmpIndex++) {
      yearList.push({ value: distinctYears[cmpIndex], label: distinctYears[cmpIndex] });
    }
  }
  
  let nicList = _.uniqBy(nicCodeList, 'value');
  let objectToReturn = {
    _id: req.params.id,
    taxonomyName: clientTaxonomyDetail.taxonomyName ? clientTaxonomyDetail.taxonomyName : 'NA',
    headers: clientTaxonomyDetail.fields ? clientTaxonomyDetail.fields : [],
    nicList: nicList ? nicList : [],
    yearList: yearList,
    pillarList: pillarList ? pillarList : [],
    status: clientTaxonomyDetail.status
  }
  return res.status(200).json({ status: "200", message: "Client taxonomy detail retrieved successfully!", data: objectToReturn });
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

export const updateClientTaxonomy = async ({ user, bodymen: { body }, params }, res, next) => {
  ClientTaxonomy.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then(async (clientTaxonomy) => {
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
      await ClientTaxonomy.update({ _id: params.id }, { $set: clientTaxonomyObject })
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


export const configureChildFields = async (req, res, next) => {
  try {
    const { id, childFields } = req.body;
    const updateClientTaxonomy = await ClientTaxonomy.findOneAndUpdate({
      _id: id,
    },
      {
        $push:
          { 'childFields.additionalFields': childFields }

      }, {
      new: true
    });

    if (!updateClientTaxonomy) {
      return res.status(409).json({
        status: 409,
        message: 'Client Taxonomy id does not exists'
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Configured child Dp'
    });
  } catch (error) {
    return res.status(500).json(
      {
        status: 500,
        message: error?.message ? error?.message : 'failed to configure child data fields'
      });
  }
}

export const getChildFields = async (req, res, next) => {
  try {
    const { clientTaxonomyId, datapointId } = req.query;

    const [getChildField, datapointDetails] = await Promise.all([
      ClientTaxonomy.findOne({ _id: clientTaxonomyId }).lean(),
      Datapoints.findOne({ _id: datapointId }).lean()
    ])
    let childFields = [];
    if (datapointDetails?.dataType !== 'Number') {
      for (const key in getChildField?.childFields) {
        if (key !== 'additionalFields' && getChildField?.childFields?.additionalFields.length !== 0) {
          childFields.push(getChildField?.childFields[key]);
        }
        if (getChildField?.childFields?.additionalFields.length === 0) {
          return res.status(409).json({
            status: 409,
            message: 'The parent headers are not configured'
          })
        }
      }
    }
    res.status(200).json({
      status: 200,
      response: childFields
    })

  } catch (error) {

  }
}