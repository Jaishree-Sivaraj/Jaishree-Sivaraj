import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export BoardMembersMatrixDataPoints, { schema } from './model'

const router = new Router()
const { datapointId, companyId, memberName, year, response, fiscalYearEndDate, memberStatus, additionalDetails, status } = schema.tree

/**
 * @api {post} /boardMembersMatrixDataPoints Create board members matrix data points
 * @apiName CreateBoardMembersMatrixDataPoints
 * @apiGroup BoardMembersMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Board members matrix data points's datapointId.
 * @apiParam companyId Board members matrix data points's companyId.
 * @apiParam memberName Board members matrix data points's memberName.
 * @apiParam year Board members matrix data points's year.
 * @apiParam response Board members matrix data points's response.
 * @apiParam fiscalYearEndDate Board members matrix data points's fiscalYearEndDate.
 * @apiParam memberStatus Board members matrix data points's memberStatus.
 * @apiSuccess {Object} boardMembersMatrixDataPoints Board members matrix data points's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members matrix data points not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ datapointId, companyId, memberName, year, response, fiscalYearEndDate, memberStatus}),
  create)

/**
 * @api {get} /boardMembersMatrixDataPoints Retrieve board members matrix data points
 * @apiName RetrieveBoardMembersMatrixDataPoints
 * @apiGroup BoardMembersMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board members matrix data points.
 * @apiSuccess {Object[]} rows List of board members matrix data points.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /boardMembersMatrixDataPoints/:id Retrieve board members matrix data points
 * @apiName RetrieveBoardMembersMatrixDataPoints
 * @apiGroup BoardMembersMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} boardMembersMatrixDataPoints Board members matrix data points's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members matrix data points not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /boardMembersMatrixDataPoints/:id Update board members matrix data points
 * @apiName UpdateBoardMembersMatrixDataPoints
 * @apiGroup BoardMembersMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Board members matrix data points's datapointId.
 * @apiParam companyId Board members matrix data points's companyId.
 * @apiParam memberName Board members matrix data points's memberName.
 * @apiParam year Board members matrix data points's year.
 * @apiParam response Board members matrix data points's response.
 * @apiParam fiscalYearEndDate Board members matrix data points's fiscalYearEndDate.
 * @apiParam memberStatus Board members matrix data points's memberStatus.
 * @apiParam status Board members matrix data points's status.
 * @apiSuccess {Object} boardMembersMatrixDataPoints Board members matrix data points's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members matrix data points not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ datapointId, companyId, memberName, year, response, fiscalYearEndDate, memberStatus, status }),
  update)

/**
 * @api {delete} /boardMembersMatrixDataPoints/:id Delete board members matrix data points
 * @apiName DeleteBoardMembersMatrixDataPoints
 * @apiGroup BoardMembersMatrixDataPoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Board members matrix data points not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
