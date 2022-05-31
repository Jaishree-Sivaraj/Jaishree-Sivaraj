import {success, notFound} from '../../services/response/';
import {MasterCompanies} from '.';

export const create = async ({user, bodymen: {body}}, res, next) => {
  let checkCin = await MasterCompanies.find ({cin: body.cin});
  try {
    if (checkCin.length > 0) {
      return res.status (402).json ({
        message: 'CIN already exists',
      });
    } else {
      MasterCompanies.create ({...body, createdBy: user})
        .then (masterCompanies => {
          return res.status (200).json ({
            message: 'company Master created successfully',
            status: '200',
            data: masterCompanies.view (true),
          });
        })
        .catch (next);
    }
  } catch (error) {
    return res.status (500).json ({
      message: error.message,
      status: 500,
    });
  }
};

export const index = ({querymen: {query, select, cursor}}, res, next) =>
  MasterCompanies.count (query)
    .then (count =>
      MasterCompanies.find (query, select, cursor).then (masterCompanies => {
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
    .then (success (res))
    .catch (next);

export const show = ({params}, res, next) =>
  MasterCompanies.findById (params.id)
    .then (notFound (res))
    .then (
      masterCompanies => (masterCompanies ? masterCompanies.view () : null)
    )
    .then (success (res))
    .catch (next);

export const update = ({bodymen: {body}, params}, res, next) =>
  MasterCompanies.findById (params.id)
    .then (notFound (res))
    .then (
      masterCompanies =>
        masterCompanies ? Object.assign (masterCompanies, body).save () : null
    )
    .then (masterCompanies => {
      return res.status (200).json ({
        message: 'Company Master Updated successfully',
        status: '200',
        data: masterCompanies ? masterCompanies.view (true) : null,
      });
    })
    .catch (next);

export const destroy = ({params}, res, next) =>
  MasterCompanies.findById (params.id)
    .then (notFound (res))
    .then (
      masterCompanies => (masterCompanies ? masterCompanies.remove () : null)
    )
    .then (success (res, 204))
    .catch (next);
