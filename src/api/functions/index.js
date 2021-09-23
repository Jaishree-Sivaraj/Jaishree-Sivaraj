import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, updateSourceUrls, updateControversySourceUrls } from './controller'
import { schema } from './model'
export Functions, { schema } from './model'

const router = new Router()
const { functionType, status } = schema.tree

/**
 * @api {post} /functions Create functions
 * @apiName CreateFunctions
 * @apiGroup Functions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam functionType Functions's functionType.
 * @apiSuccess {Object} functions Functions's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Functions not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ functionType }),
  create)

/**
 * @api {get} /functions Retrieve functions
 * @apiName RetrieveFunctions
 * @apiGroup Functions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of functions.
 * @apiSuccess {Object[]} rows List of functions.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)
  
/**
* @api {get} /functions/test Retrieve functions
* @apiName RetrieveFunctions
* @apiGroup Functions
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of functions.
* @apiSuccess {Object[]} rows List of functions.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/test',
  query(),
  updateSourceUrls)
  
/**
* @api {get} /functions/test-controversy Retrieve functions
* @apiName RetrieveFunctions
* @apiGroup Functions
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of functions.
* @apiSuccess {Object[]} rows List of functions.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/test-controversy',
  query(),
  updateControversySourceUrls)

/**
 * @api {get} /functions/:id Retrieve functions
 * @apiName RetrieveFunctions
 * @apiGroup Functions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} functions Functions's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Functions not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /functions/:id Update functions
 * @apiName UpdateFunctions
 * @apiGroup Functions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam functionType Functions's functionType.
 * @apiParam status Functions's status.
 * @apiSuccess {Object} functions Functions's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Functions not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ functionType, status }),
  update)

/**
 * @api {delete} /functions/:id Delete functions
 * @apiName DeleteFunctions
 * @apiGroup Functions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Functions not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
