import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export UserPillarAssignments, { schema } from './model'

const router = new Router()
const { clientTaxonomyId, primaryPillar, secondaryPillar, userId, status } = schema.tree

/**
 * @api {post} /user_pillar_assignments Create user pillar assignments
 * @apiName CreateUserPillarAssignments
 * @apiGroup UserPillarAssignments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomyId User pillar assignments's clientTaxonomyId.
 * @apiParam primaryPillar User pillar assignments's primaryPillar.
 * @apiParam secondaryPillar User pillar assignments's secondaryPillar.
 * @apiParam userId User pillar assignments's userId.
 * @apiSuccess {Object} userPillarAssignments User pillar assignments's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 User pillar assignments not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ clientTaxonomyId, primaryPillar, secondaryPillar, userId }),
  create)

/**
 * @api {get} /user_pillar_assignments Retrieve user pillar assignments
 * @apiName RetrieveUserPillarAssignments
 * @apiGroup UserPillarAssignments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of user pillar assignments.
 * @apiSuccess {Object[]} rows List of user pillar assignments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /user_pillar_assignments/:id Retrieve user pillar assignments
 * @apiName RetrieveUserPillarAssignments
 * @apiGroup UserPillarAssignments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} userPillarAssignments User pillar assignments's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 User pillar assignments not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /user_pillar_assignments/:id Update user pillar assignments
 * @apiName UpdateUserPillarAssignments
 * @apiGroup UserPillarAssignments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomyId User pillar assignments's clientTaxonomyId.
 * @apiParam primaryPillar User pillar assignments's primaryPillar.
 * @apiParam secondaryPillar User pillar assignments's secondaryPillar.
 * @apiParam userId User pillar assignments's userId.
 * @apiParam status User pillar assignments's status.
 * @apiSuccess {Object} userPillarAssignments User pillar assignments's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 User pillar assignments not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ clientTaxonomyId, primaryPillar, secondaryPillar, userId, status }),
  update)

/**
 * @api {delete} /user_pillar_assignments/:id Delete user pillar assignments
 * @apiName DeleteUserPillarAssignments
 * @apiGroup UserPillarAssignments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 User pillar assignments not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
