import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Errors, { schema } from './model'

const router = new Router()
const { errorType, errorBucket, errorDefenition, status } = schema.tree

/**
 * @api {post} /errors Create error
 * @apiName CreateError
 * @apiGroup Errors
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam errorType Error's errorType.
 * @apiParam errorBucket Error's errorBucket.
 * @apiParam errorDefenition Error's errorDefenition.
 * @apiParam status Error's status.
 * @apiSuccess {Object} error Error's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Error not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ errorType, errorBucket, errorDefenition}),
  create)

/**
 * @api {get} /errors Retrieve errors
 * @apiName RetrieveErrors
 * @apiGroup Errors
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of errors.
 * @apiSuccess {Object[]} rows List of errors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /errors/:id Retrieve error
 * @apiName RetrieveError
 * @apiGroup Errors
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} error Error's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Error not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /errors/:id Update error
 * @apiName UpdateError
 * @apiGroup Errors
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam errorType Error's errorType.
 * @apiParam errorBucket Error's errorBucket.
 * @apiParam errorDefenition Error's errorDefenition.
 * @apiParam status Error's status.
 * @apiSuccess {Object} error Error's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Error not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ errorType, errorBucket, errorDefenition, status }),
  update)

/**
 * @api {delete} /errors/:id Delete error
 * @apiName DeleteError
 * @apiGroup Errors
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Error not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
