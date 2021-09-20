import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, emailValidation } from './controller'
import { schema } from './model'
export OnboardingEmails, { schema } from './model'

const router = new Router()
const { emailId, isOnboarded } = schema.tree

/**
 * @api {post} /onboarding-emails Create onboarding emails
 * @apiName CreateOnboardingEmails
 * @apiGroup OnboardingEmails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam emailId Onboarding emails's emailId.
 * @apiParam isOnboarded Onboarding emails's isOnboarded.
 * @apiSuccess {Object} onboardingEmails Onboarding emails's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding emails not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ emailId, isOnboarded }),
  create)

/**
 * @api {post} /onboarding-emails/validate-email Create onboarding emails
 * @apiName CreateOnboardingEmails
 * @apiGroup OnboardingEmails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam emailId Onboarding emails's emailId.
 * @apiParam isOnboarded Onboarding emails's isOnboarded.
 * @apiSuccess {Object} onboardingEmails Onboarding emails's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding emails not found.
 * @apiError 401 user access only.
 */
 router.post('/validate-email',
 token({ required: true }),
 body({ emailId }),
 emailValidation)

/**
 * @api {get} /onboarding-emails Retrieve onboarding emails
 * @apiName RetrieveOnboardingEmails
 * @apiGroup OnboardingEmails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of onboarding emails.
 * @apiSuccess {Object[]} rows List of onboarding emails.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /onboarding-emails/:id Retrieve onboarding emails
 * @apiName RetrieveOnboardingEmails
 * @apiGroup OnboardingEmails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} onboardingEmails Onboarding emails's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding emails not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /onboarding-emails/:id Update onboarding emails
 * @apiName UpdateOnboardingEmails
 * @apiGroup OnboardingEmails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam emailId Onboarding emails's emailId.
 * @apiParam isOnboarded Onboarding emails's isOnboarded.
 * @apiSuccess {Object} onboardingEmails Onboarding emails's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding emails not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ emailId, isOnboarded }),
  update)

/**
 * @api {delete} /onboarding-emails/:id Delete onboarding emails
 * @apiName DeleteOnboardingEmails
 * @apiGroup OnboardingEmails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Onboarding emails not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
