import { success, notFound } from '../../services/response/'
import { ClientMaster } from '.';
import { Companies } from '../companies';
import mongoose, { Schema } from 'mongoose';
import { ClientTaxonomy } from '../clientTaxonomy'


export const create = ({ bodymen: { body } }, res, next) =>
  ClientMaster.create(body)
    .then((clientMaster) => clientMaster.view(true))
    .then(success(res, 201))
    .catch(next)


export const index = ({ params }, res, next) =>{
Companies.find({clientTaxonomyId: mongoose.Types.ObjectId(params.taxonomyId)} )
.then(notFound(res))
.then(success(res))
.catch(next)
}

export const getTexonomy = (req,res, next) =>{
  ClientTaxonomy.find()
  .then(notFound(res))
  .then(result => {
    let texonomyObjects = [];
    if (result.length > 0) {
      result.forEach(obj => {
        texonomyObjects.push({
          _id: obj._id,
          taxonomyName: obj.taxonomyName
        });
      });
    }
    return res.status(200).json({
      message: 'Texonomy List Retrieved successfully',
      status: '200',
      data: texonomyObjects,
    });
  })
  .catch(next)
  }

export const show = ({ params }, res, next) =>{
  ClientMaster.find(params.id)
    .then(notFound(res))
    .then((clientMaster) => clientMaster ? clientMaster.view() : null)
    .then(success(res))
    .catch(next)
}

export const update = ({ bodymen: { body }, params }, res, next) =>
  ClientMaster.findById(params.id)
    .then(notFound(res))
    .then((clientMaster) => clientMaster ? Object.assign(clientMaster, body).save() : null)
    .then((clientMaster) => clientMaster ? clientMaster.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  ClientMaster.findById(params.id)
    .then(notFound(res))
    .then((clientMaster) => clientMaster ? clientMaster.remove() : null)
    .then(success(res, 204))
    .catch(next)
