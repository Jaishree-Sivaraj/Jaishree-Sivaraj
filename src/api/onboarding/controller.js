import { success, notFound } from '../../services/response/'
import { Onboarding } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  Onboarding.create(body)
    .then((onboarding) => onboarding.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Onboarding.find(query, select, cursor)
    .then((onboardings) => onboardings.map((onboarding) => onboarding.view()))
    .then(success(res))
    .catch(next)

  export const show = ({ params }, res, next) =>
  Onboarding.findById(params.id)
    .then(notFound(res))
    .then((onboarding) => onboarding ? onboarding.view() : null)
    .then(success(res))
    .catch(next)
    
export const update = ({ bodymen: { body }, params }, res, next) =>
  Onboarding.findById(params.id)
    .then(notFound(res))
    .then((onboarding) => onboarding ? Object.assign(onboarding, body).save() : null)
    .then((onboarding) => onboarding ? onboarding.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Onboarding.findById(params.id)
    .then(notFound(res))
    .then((onboarding) => onboarding ? onboarding.remove() : null)
    .then(success(res, 204))
    .catch(next)
