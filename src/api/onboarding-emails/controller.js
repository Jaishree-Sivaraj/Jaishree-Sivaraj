import { success, notFound, authorOrAdmin } from '../../services/response/'
import { OnboardingEmails } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  OnboardingEmails.create({ ...body, user })
    .then((onboardingEmails) => onboardingEmails.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  OnboardingEmails.count(query)
    .then(count => OnboardingEmails.find(query, select, cursor)
      .populate('user')
      .then((onboardingEmails) => ({
        count,
        rows: onboardingEmails.map((onboardingEmails) => onboardingEmails.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  OnboardingEmails.findById(params.id)
    .populate('user')
    .then(notFound(res))
    .then((onboardingEmails) => onboardingEmails ? onboardingEmails.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  OnboardingEmails.findById(params.id)
    .populate('user')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'user'))
    .then((onboardingEmails) => onboardingEmails ? Object.assign(onboardingEmails, body).save() : null)
    .then((onboardingEmails) => onboardingEmails ? onboardingEmails.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  OnboardingEmails.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'user'))
    .then((onboardingEmails) => onboardingEmails ? onboardingEmails.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const emailValidation = async ({ body }, res, next) => {
  console.log("body details", body.emailId);
  try {
    let emailDetails = await OnboardingEmails.find({ emailId: body.emailId })
    if (emailDetails && emailDetails.length > 0) {
      return res.status(200).json({ status: "200", message: `Valid email for onboarding, emailId: ${body.emailId} ` })
    }
    return res.status(200).json({ status: "400", message: `Invalid email for the onboarding, emailId: ${body.emailId} ` })
  } catch (error) {
    return res.status(200).json({ status: "400", message: `Invalid email for the onboarding, emailId: ${body.emailId} ` })
  }
}
