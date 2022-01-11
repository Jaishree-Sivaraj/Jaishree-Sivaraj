import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Conversiontypes, { schema } from './model'

const router = new Router()
const { typeName, status } = schema.tree

/**
 * @api {post} /conversiontypes Create conversiontypes
 * @apiName CreateConversiontypes
 * @apiGroup Conversiontypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam typeName Conversiontypes's typeName.
 * @apiSuccess {Object} conversiontypes Conversiontypes's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Conversiontypes not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ typeName }),
  create)

/**
 * @api {get} /conversiontypes Retrieve conversiontypes
 * @apiName RetrieveConversiontypes
 * @apiGroup Conversiontypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of conversiontypes.
 * @apiSuccess {Object[]} rows List of conversiontypes.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /conversiontypes/:id Retrieve conversiontypes
 * @apiName RetrieveConversiontypes
 * @apiGroup Conversiontypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} conversiontypes Conversiontypes's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Conversiontypes not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /conversiontypes/:id Update conversiontypes
 * @apiName UpdateConversiontypes
 * @apiGroup Conversiontypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam typeName Conversiontypes's typeName.
 * @apiParam status Conversiontypes's status.
 * @apiSuccess {Object} conversiontypes Conversiontypes's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Conversiontypes not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ typeName, status }),
  update)

/**
 * @api {delete} /conversiontypes/:id Delete conversiontypes
 * @apiName DeleteConversiontypes
 * @apiGroup Conversiontypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Conversiontypes not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
