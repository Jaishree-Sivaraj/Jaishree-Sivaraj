import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export PlaceValues, { schema } from './model'

const router = new Router()
const { name, status } = schema.tree

/**
 * @api {post} /place_values Create place values
 * @apiName CreatePlaceValues
 * @apiGroup PlaceValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam name Place values's name.
 * @apiSuccess {Object} placeValues Place values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Place values not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ name }),
  create)

/**
 * @api {get} /place_values Retrieve place values
 * @apiName RetrievePlaceValues
 * @apiGroup PlaceValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of place values.
 * @apiSuccess {Object[]} rows List of place values.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /place_values/:id Retrieve place values
 * @apiName RetrievePlaceValues
 * @apiGroup PlaceValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} placeValues Place values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Place values not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /place_values/:id Update place values
 * @apiName UpdatePlaceValues
 * @apiGroup PlaceValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam name Place values's name.
 * @apiParam status Place values's status.
 * @apiSuccess {Object} placeValues Place values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Place values not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ name, status }),
  update)

/**
 * @api {delete} /place_values/:id Delete place values
 * @apiName DeletePlaceValues
 * @apiGroup PlaceValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Place values not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
