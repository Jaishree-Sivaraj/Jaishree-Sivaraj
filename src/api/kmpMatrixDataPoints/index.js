import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export KmpMatrixDataPoints, { schema } from './model'

const router = new Router()
const { companyId, memberName, datapointId, response, year, fiscalYearEndDate, memberStatus, additionalDetails, status } = schema.tree

/**
 * @api {post} /kmpMatrixDataPoints Create kmp matrix data points
 * @apiName CreateKmpMatrixDataPoints
 * @apiGroup KmpMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Kmp matrix data points's companyId.
 * @apiParam memberName Kmp matrix data points's memberName.
 * @apiParam datapointId Kmp matrix data points's datapointId.
 * @apiParam response Kmp matrix data points's response.
 * @apiParam year Kmp matrix data points's year.
 * @apiParam fiscalYearEndDate Kmp matrix data points's fiscalYearEndDate.
 * @apiParam memberStatus Kmp matrix data points's memberStatus.
 * @apiSuccess {Object} kmpMatrixDataPoints Kmp matrix data points's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp matrix data points not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyId, memberName, datapointId, response, year, fiscalYearEndDate, memberStatus}),
  create)

/**
 * @api {get} /kmpMatrixDataPoints Retrieve kmp matrix data points
 * @apiName RetrieveKmpMatrixDataPoints
 * @apiGroup KmpMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of kmp matrix data points.
 * @apiSuccess {Object[]} rows List of kmp matrix data points.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /kmpMatrixDataPoints/:id Retrieve kmp matrix data points
 * @apiName RetrieveKmpMatrixDataPoints
 * @apiGroup KmpMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} kmpMatrixDataPoints Kmp matrix data points's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp matrix data points not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /kmpMatrixDataPoints/:id Update kmp matrix data points
 * @apiName UpdateKmpMatrixDataPoints
 * @apiGroup KmpMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Kmp matrix data points's companyId.
 * @apiParam memberName Kmp matrix data points's memberName.
 * @apiParam datapointId Kmp matrix data points's datapointId.
 * @apiParam response Kmp matrix data points's response.
 * @apiParam year Kmp matrix data points's year.
 * @apiParam fiscalYearEndDate Kmp matrix data points's fiscalYearEndDate.
 * @apiParam memberStatus Kmp matrix data points's memberStatus.
 * @apiParam status Kmp matrix data points's status.
 * @apiSuccess {Object} kmpMatrixDataPoints Kmp matrix data points's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp matrix data points not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ companyId, memberName, datapointId, response, year, fiscalYearEndDate, memberStatus, status }),
  update)

/**
 * @api {delete} /kmpMatrixDataPoints/:id Delete kmp matrix data points
 * @apiName DeleteKmpMatrixDataPoints
 * @apiGroup KmpMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Kmp matrix data points not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
