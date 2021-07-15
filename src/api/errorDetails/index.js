import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export ErrorDetails, { schema } from './model'

const router = new Router()
const { errorTypeId, taskId, categoryId, companyId, year, raisedBy, comments, isErrorAccepted, isErrorRejected, rejectComment, errorCaughtByRep, errorLoggedDate, errorStatus, datapointId, status } = schema.tree

/**
 * @api {post} /errorDetails Create error details
 * @apiName CreateErrorDetails
 * @apiGroup ErrorDetails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam errorTypeId Error details's errorTypeId.
 * @apiParam taskId Error details's taskId.
 * @apiParam loggedBy Error details's loggedBy.
 * @apiParam comments Error details's comments.
 * @apiParam errorLoggedDate Error details's errorLoggedDate.
 * @apiParam errorStatus Error details's errorStatus.
 * @apiParam standaloneId Error details's standaloneId.
 * @apiSuccess {Object} errorDetails Error details's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Error details not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ errorTypeId, categoryId, companyId, year, raisedBy, rejectComment, datapointId }),
  create)

/**
 * @api {get} /errorDetails Retrieve error details
 * @apiName RetrieveErrorDetails
 * @apiGroup ErrorDetails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of error details.
 * @apiSuccess {Object[]} rows List of error details.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /errorDetails/:id Retrieve error details
 * @apiName RetrieveErrorDetails
 * @apiGroup ErrorDetails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} errorDetails Error details's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Error details not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /errorDetails/:id Update error details
 * @apiName UpdateErrorDetails
 * @apiGroup ErrorDetails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam errorTypeId Error details's errorTypeId.
 * @apiParam taskId Error details's taskId.
 * @apiParam loggedBy Error details's loggedBy.
 * @apiParam comments Error details's comments.
 * @apiParam errorLoggedDate Error details's errorLoggedDate.
 * @apiParam errorStatus Error details's errorStatus.
 * @apiParam standaloneId Error details's standaloneId.
 * @apiParam status Error details's status.
 * @apiSuccess {Object} errorDetails Error details's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Error details not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ errorTypeId, taskId, categoryId, companyId, year, raisedBy, comments, isErrorAccepted, isErrorRejected, rejectComment, errorCaughtByRep, errorLoggedDate, errorStatus, datapointId, status }),
  update)

/**
 * @api {delete} /errorDetails/:id Delete error details
 * @apiName DeleteErrorDetails
 * @apiGroup ErrorDetails
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Error details not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
