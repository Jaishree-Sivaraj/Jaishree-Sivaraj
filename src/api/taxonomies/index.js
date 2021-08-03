import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Taxonomies, { schema } from './model'

const router = new Router()
const { name, fieldName, description, isRequired, applicableFor, inputType, inputValues, toDisplay, status } = schema.tree

/**
 * @api {post} /taxonomies Create taxonomies
 * @apiName CreateTaxonomies
 * @apiGroup Taxonomies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam name Taxonomies's name.
 * @apiParam fieldName Taxonomies's fieldName.
 * @apiParam description Taxonomies's description.
 * @apiParam isRequired Taxonomies's isRequired.
 * @apiParam applicableFor Taxonomies's applicableFor.
 * @apiParam inputType Taxonomies's inputType.
 * @apiParam inputValues Taxonomies's inputValues.
 * @apiParam toDisplay Taxonomies's toDisplay.
 * @apiSuccess {Object} taxonomies Taxonomies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Taxonomies not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ name, fieldName, description, isRequired, applicableFor, inputType, inputValues, toDisplay }),
  create)

/**
 * @api {get} /taxonomies Retrieve taxonomies
 * @apiName RetrieveTaxonomies
 * @apiGroup Taxonomies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of taxonomies.
 * @apiSuccess {Object[]} rows List of taxonomies.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /taxonomies/:id Retrieve taxonomies
 * @apiName RetrieveTaxonomies
 * @apiGroup Taxonomies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} taxonomies Taxonomies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Taxonomies not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /taxonomies/:id Update taxonomies
 * @apiName UpdateTaxonomies
 * @apiGroup Taxonomies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam name Taxonomies's name.
 * @apiParam fieldName Taxonomies's fieldName.
 * @apiParam description Taxonomies's description.
 * @apiParam isRequired Taxonomies's isRequired.
 * @apiParam applicableFor Taxonomies's applicableFor.
 * @apiParam inputType Taxonomies's inputType.
 * @apiParam inputValues Taxonomies's inputValues.
 * @apiParam toDisplay Taxonomies's toDisplay.
 * @apiParam status Taxonomies's status.
 * @apiSuccess {Object} taxonomies Taxonomies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Taxonomies not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ name, fieldName, description, isRequired, applicableFor, inputType, inputValues, toDisplay, status }),
  update)

/**
 * @api {delete} /taxonomies/:id Delete taxonomies
 * @apiName DeleteTaxonomies
 * @apiGroup Taxonomies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Taxonomies not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
