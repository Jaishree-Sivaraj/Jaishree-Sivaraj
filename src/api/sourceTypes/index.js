import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export SourceTypes, { schema } from './model'

const router = new Router()
const { typeName, duration, status } = schema.tree

/**
 * @api {post} /sourceTypes Create source types
 * @apiName CreateSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam typeName Source types's typeName.
 * @apiParam duration Source types's duration.
 * @apiParam status Source types's status.
 * @apiSuccess {Object} sourceTypes Source types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source types not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true, roles: ['admin'] }),
  body({ typeName, duration, status }),
  create)

/**
 * @api {get} /sourceTypes Retrieve source types
 * @apiName RetrieveSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of source types.
 * @apiSuccess {Object[]} rows List of source types.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true, roles: ['admin'] }),
  query(),
  index)

/**
 * @api {get} /sourceTypes/:id Retrieve source types
 * @apiName RetrieveSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} sourceTypes Source types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source types not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true, roles: ['admin'] }),
  show)

/**
 * @api {put} /sourceTypes/:id Update source types
 * @apiName UpdateSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam typeName Source types's typeName.
 * @apiParam duration Source types's duration.
 * @apiParam status Source types's status.
 * @apiSuccess {Object} sourceTypes Source types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source types not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true, roles: ['admin'] }),
  body({ typeName, duration, status }),
  update)

/**
 * @api {delete} /sourceTypes/:id Delete source types
 * @apiName DeleteSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Source types not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true, roles: ['admin'] }),
  destroy)

export default router
