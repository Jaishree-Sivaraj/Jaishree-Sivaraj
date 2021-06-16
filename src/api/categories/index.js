import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Categories, { schema } from './model'

const router = new Router()
const { categoryName, categoryCode, categoryDescription, status } = schema.tree

/**
 * @api {post} /categories Create categories
 * @apiName CreateCategories
 * @apiGroup Categories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam categoryName Categories's categoryName.
 * @apiParam categoryCode Categories's categoryCode.
 * @apiParam categoryDescription Categories's categoryDescription.
 * @apiSuccess {Object} categories Categories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Categories not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ categoryName, categoryCode, categoryDescription }),
  create)

/**
 * @api {get} /categories Retrieve categories
 * @apiName RetrieveCategories
 * @apiGroup Categories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of categories.
 * @apiSuccess {Object[]} rows List of categories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /categories/:id Retrieve categories
 * @apiName RetrieveCategories
 * @apiGroup Categories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} categories Categories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Categories not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /categories/:id Update categories
 * @apiName UpdateCategories
 * @apiGroup Categories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam categoryName Categories's categoryName.
 * @apiParam categoryCode Categories's categoryCode.
 * @apiParam categoryDescription Categories's categoryDescription.
 * @apiParam status Categories's status.
 * @apiSuccess {Object} categories Categories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Categories not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ categoryName, categoryCode, categoryDescription, status }),
  update)

/**
 * @api {delete} /categories/:id Delete categories
 * @apiName DeleteCategories
 * @apiGroup Categories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Categories not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
