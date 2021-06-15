import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Onboarding, { schema } from './model'

const router = new Router()
const { email, onboardingType, content, mailStatus, status } = schema.tree

/**
 * @api {post} /onboardings Create onboarding
 * @apiName CreateOnboarding
 * @apiGroup Onboarding
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam email Onboarding's email.
 * @apiParam onboardingType Onboarding's onboardingType.
 * @apiParam content Onboarding's content.
 * @apiParam mailStatus Onboarding's mailStatus.
 * @apiParam status Onboarding's status.
 * @apiSuccess {Object} onboarding Onboarding's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ email, onboardingType, content, mailStatus, status }),
  create)

/**
 * @api {get} /onboardings Retrieve onboardings
 * @apiName RetrieveOnboardings
 * @apiGroup Onboarding
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Object[]} onboardings List of onboardings.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /onboardings/:id Retrieve onboarding
 * @apiName RetrieveOnboarding
 * @apiGroup Onboarding
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} onboarding Onboarding's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true }),
  show)
  
/**
 * @api {put} /onboardings/:id Update onboarding
 * @apiName UpdateOnboarding
 * @apiGroup Onboarding
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam email Onboarding's email.
 * @apiParam onboardingType Onboarding's onboardingType.
 * @apiParam content Onboarding's content.
 * @apiParam mailStatus Onboarding's mailStatus.
 * @apiParam status Onboarding's status.
 * @apiSuccess {Object} onboarding Onboarding's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Onboarding not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ email, onboardingType, content, mailStatus, status }),
  update)

/**
 * @api {delete} /onboardings/:id Delete onboarding
 * @apiName DeleteOnboarding
 * @apiGroup Onboarding
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Onboarding not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
