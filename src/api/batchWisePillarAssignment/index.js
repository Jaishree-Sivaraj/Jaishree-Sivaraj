import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export BatchWisePillarAssignment, { schema } from './model'

const router = new Router()
const { userId, batchId, pillars } = schema.tree

/**
 * @api {post} /batchWisePillarAssignments Create batch wise pillar assignment
 * @apiName CreateBatchWisePillarAssignment
 * @apiGroup BatchWisePillarAssignment
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam userId Batch wise pillar assignment's userId.
 * @apiParam batchId Batch wise pillar assignment's batchId.
 * @apiParam pillars Batch wise pillar assignment's pillars.
 * @apiSuccess {Object} batchWisePillarAssignment Batch wise pillar assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batch wise pillar assignment not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ userId, batchId, pillars }),
  create)

/**
 * @api {get} /batchWisePillarAssignments Retrieve batch wise pillar assignments
 * @apiName RetrieveBatchWisePillarAssignments
 * @apiGroup BatchWisePillarAssignment
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of batch wise pillar assignments.
 * @apiSuccess {Object[]} rows List of batch wise pillar assignments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true, roles: ['admin'] }),
  query(),
  index)

/**
 * @api {get} /batchWisePillarAssignments/:id Retrieve batch wise pillar assignment
 * @apiName RetrieveBatchWisePillarAssignment
 * @apiGroup BatchWisePillarAssignment
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} batchWisePillarAssignment Batch wise pillar assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batch wise pillar assignment not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true}),
  show)

/**
 * @api {put} /batchWisePillarAssignments/:id Update batch wise pillar assignment
 * @apiName UpdateBatchWisePillarAssignment
 * @apiGroup BatchWisePillarAssignment
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam userId Batch wise pillar assignment's userId.
 * @apiParam batchId Batch wise pillar assignment's batchId.
 * @apiParam pillars Batch wise pillar assignment's pillars.
 * @apiSuccess {Object} batchWisePillarAssignment Batch wise pillar assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batch wise pillar assignment not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ userId, batchId, pillars }),
  update)

/**
 * @api {delete} /batchWisePillarAssignments/:id Delete batch wise pillar assignment
 * @apiName DeleteBatchWisePillarAssignment
 * @apiGroup BatchWisePillarAssignment
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Batch wise pillar assignment not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
