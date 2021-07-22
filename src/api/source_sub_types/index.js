import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export SourceSubTypes, { schema } from './model'

const router = new Router()
const { subTypeName, description, status } = schema.tree

/**
 * @api {post} /source_sub_types Create source sub types
 * @apiName CreateSourceSubTypes
 * @apiGroup SourceSubTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam subTypeName Source sub types's subTypeName.
 * @apiParam description Source sub types's description.
 * @apiParam status Source sub types's status.
 * @apiSuccess {Object} sourceSubTypes Source sub types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source sub types not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ subTypeName, description, status }),
  create)

/**
 * @api {get} /source_sub_types Retrieve source sub types
 * @apiName RetrieveSourceSubTypes
 * @apiGroup SourceSubTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of source sub types.
 * @apiSuccess {Object[]} rows List of source sub types.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /source_sub_types/:id Retrieve source sub types
 * @apiName RetrieveSourceSubTypes
 * @apiGroup SourceSubTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} sourceSubTypes Source sub types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source sub types not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /source_sub_types/:id Update source sub types
 * @apiName UpdateSourceSubTypes
 * @apiGroup SourceSubTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam subTypeName Source sub types's subTypeName.
 * @apiParam description Source sub types's description.
 * @apiParam status Source sub types's status.
 * @apiSuccess {Object} sourceSubTypes Source sub types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source sub types not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ subTypeName, description, status }),
  update)

/**
 * @api {delete} /source_sub_types/:id Delete source sub types
 * @apiName DeleteSourceSubTypes
 * @apiGroup SourceSubTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Source sub types not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
