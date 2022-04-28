import { success, notFound } from '../../services/response/'
import { MasterCompanies } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  MasterCompanies.create({ ...body, createdBy: user })
    .then((masterCompanies => {
      return res.status (200).json ({
        message: 'company Master created successfully',
        status: '200',
        data: masterCompanies.view(true)
      });
    }))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  MasterCompanies.count(query)
    .then(count => MasterCompanies.find(query, select, cursor)
      .then((masterCompanies) =>{
        let companiesObjects = [];
        if (masterCompanies.length > 0) {
          masterCompanies.forEach (obj => {
            companiesObjects.push ({
              _id: obj._id,
              cin: obj.cin,
            });
          });
        }
        return companiesObjects;
      })
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  MasterCompanies.findById(params.id)
    .then(notFound(res))
    .then((masterCompanies) => masterCompanies ? masterCompanies.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  MasterCompanies.findById(params.id)
    .then(notFound(res))
    .then((masterCompanies) => masterCompanies ? Object.assign(masterCompanies, body).save() : null)
    .then((masterCompanies) => {
      return res.status (200).json ({
        message: 'Company Master Updated successfully',
        status: '200',
        data: masterCompanies ? masterCompanies.view(true) : null,
      });
    })
    .catch(next)

export const destroy = ({ params }, res, next) =>
  MasterCompanies.findById(params.id)
    .then(notFound(res))
    .then((masterCompanies) => masterCompanies ? masterCompanies.remove() : null)
    .then(success(res, 204))
    .catch(next)
