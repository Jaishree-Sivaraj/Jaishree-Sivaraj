import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, retrieveValidationResults } from './controller'
import { schema } from './model'
export ValidationResults, { schema } from './model'

const router = new Router()
const { taskId, dpCode, dpCodeId, companyId, companyName, keyIssueId, keyIssue, pillarId, pillar, dataType, fiscalYear, memberName, memberId, memberType, isValidResponse, description, status } = schema.tree
const { dpType, categoryId, page, limit } = '';

/**
 * @api {post} /validation_results Create validation results
 * @apiName CreateValidationResults
 * @apiGroup ValidationResults
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Validation results's taskId.
 * @apiParam dpCode Validation results's dpCode.
 * @apiParam dpCodeId Validation results's dpCodeId.
 * @apiParam companyId Validation results's companyId.
 * @apiParam companyName Validation results's companyName.
 * @apiParam keyIssueId Validation results's keyIssueId.
 * @apiParam keyIssue Validation results's keyIssue.
 * @apiParam pillarId Validation results's pillarId.
 * @apiParam pillar Validation results's pillar.
 * @apiParam dataType Validation results's dataType.
 * @apiParam fiscalYear Validation results's fiscalYear.
 * @apiParam memberName Validation results's memberName.
 * @apiParam memberId Validation results's memberId.
 * @apiParam memberType Validation results's memberType.
 * @apiParam isValidResponse Validation results's isValidResponse.
 * @apiParam description Validation results's description.
 * @apiSuccess {Object} validationResults Validation results's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation results not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ taskId, dpCode, dpCodeId, companyId, companyName, keyIssueId, keyIssue, pillarId, pillar, dataType, fiscalYear, memberName, memberId, memberType, isValidResponse, description }),
  create)

/**
 * @api {post} /validation_results/retrieve Retrieve validation results
 * @apiName RetrieveValidationResults
 * @apiGroup ValidationResults
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Validation results's taskId.
 * @apiParam dpType Validation results's dpType.
 * @apiParam keyIssueId Validation results's keyIssueId.
 * @apiParam memberId Validation results's memberId.
 * @apiParam memberName Validation results's memberName.
 * @apiParam categoryId Validation results's categoryId.
 * @apiParam page Validation results's page.
 * @apiParam limit Validation results's limit.
 * @apiSuccess {Object} validationResults Validation results's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation results not found.
 * @apiError 401 user access only.
 */
router.post('/retrieve',
  token({ required: true }),
  body({ taskId, dpType, keyIssueId, memberId, memberName, categoryId, page, limit }),
  retrieveValidationResults)

/**
 * @api {get} /validation_results Retrieve validation results
 * @apiName RetrieveValidationResults
 * @apiGroup ValidationResults
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of validation results.
 * @apiSuccess {Object[]} rows List of validation results.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /validation_results/:id Retrieve validation results
 * @apiName RetrieveValidationResults
 * @apiGroup ValidationResults
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} validationResults Validation results's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation results not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /validation_results/:id Update validation results
 * @apiName UpdateValidationResults
 * @apiGroup ValidationResults
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Validation results's taskId.
 * @apiParam dpCode Validation results's dpCode.
 * @apiParam dpCodeId Validation results's dpCodeId.
 * @apiParam companyId Validation results's companyId.
 * @apiParam companyName Validation results's companyName.
 * @apiParam keyIssueId Validation results's keyIssueId.
 * @apiParam keyIssue Validation results's keyIssue.
 * @apiParam pillarId Validation results's pillarId.
 * @apiParam pillar Validation results's pillar.
 * @apiParam dataType Validation results's dataType.
 * @apiParam fiscalYear Validation results's fiscalYear.
 * @apiParam memberName Validation results's memberName.
 * @apiParam memberId Validation results's memberId.
 * @apiParam memberType Validation results's memberType.
 * @apiParam isValidResponse Validation results's isValidResponse.
 * @apiParam description Validation results's description.
 * @apiParam status Validation results's status.
 * @apiSuccess {Object} validationResults Validation results's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation results not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ taskId, dpCode, dpCodeId, companyId, companyName, keyIssueId, keyIssue, pillarId, pillar, dataType, fiscalYear, memberName, memberId, memberType, isValidResponse, description, status }),
  update)

/**
 * @api {delete} /validation_results/:id Delete validation results
 * @apiName DeleteValidationResults
 * @apiGroup ValidationResults
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Validation results not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
