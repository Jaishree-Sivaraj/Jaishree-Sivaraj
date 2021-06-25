import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, type8Validation,type3Validation } from './controller'
import { schema } from './model'
export Validations, { schema } from './model'

const router = new Router()
const { datapointId, validationRule, rule, dependantCode, condition, criteria, validationAlert, status } = schema.tree
const companyId = '', clientTaxonomyId = '', currentYear = '', previousYear = '', response = '';
/**
 * @api {post} /validations Create validations
 * @apiName CreateValidations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Validations's datapointId.
 * @apiParam validationRule Validations's validationRule.
 * @apiParam rule Validations's rule.
 * @apiParam dependantCode Validations's dependantCode.
 * @apiParam condition Validations's condition.
 * @apiParam criteria Validations's criteria.
 * @apiParam validationAlert Validations's validationAlert.
 * @apiSuccess {Object} validations Validations's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ datapointId, validationRule, rule, dependantCode, condition, criteria, validationAlert }),
  create)
/**
 * @api {post} /validations/type8 Type8 Validations
 * @apiName Type8Validations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Validations's datapointId.
 * @apiParam companyId Validations's companyId.
 * @apiParam clientTaxonomyId Validations's clientTaxonomyId.
 * @apiParam currentYear Validations's currentYear.
 * @apiParam previousYear Validations's previousYear.
 * @apiParam response Validations's response.
 * @apiSuccess {Object} validations Validations's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
 router.post('/type8',
 token({ required: true }),
 body({ datapointId, companyId, clientTaxonomyId, currentYear, previousYear, response}),
 type8Validation)
 
 /**
  * @api {post} /validations/type3 Type3 Validations
  * @apiName Type3Validations
  * @apiGroup Validations
  * @apiPermission user
  * @apiParam {String} access_token user access token.
  * @apiParam datapointId Validations's datapointId.
  * @apiParam companyId Validations's companyId.
  * @apiParam clientTaxonomyId Validations's clientTaxonomyId.
  * @apiParam currentYear Validations's currentYear.
  * @apiParam previousYear Validations's previousYear.
  * @apiParam response Validations's response.
  * @apiSuccess {Object} validations Validations's data.
  * @apiError {Object} 400 Some parameters may contain invalid values.
  * @apiError 404 Validations not found.
  * @apiError 401 user access only.
  */
  router.post('/type3',
  token({ required: true }),
  body({ datapointId, companyId, clientTaxonomyId, previousYear, response}),
  type3Validation)
/**
 * @api {get} /validations Retrieve validations
 * @apiName RetrieveValidations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of validations.
 * @apiSuccess {Object[]} rows List of validations.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /validations/:id Retrieve validations
 * @apiName RetrieveValidations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} validations Validations's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /validations/:id Update validations
 * @apiName UpdateValidations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Validations's datapointId.
 * @apiParam validationRule Validations's validationRule.
 * @apiParam rule Validations's rule.
 * @apiParam dependantCode Validations's dependantCode.
 * @apiParam condition Validations's condition.
 * @apiParam criteria Validations's criteria.
 * @apiParam validationAlert Validations's validationAlert.
 * @apiParam status Validations's status.
 * @apiSuccess {Object} validations Validations's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ datapointId, validationRule, rule, dependantCode, condition, criteria, validationAlert, status }),
  update)

/**
 * @api {delete} /validations/:id Delete validations
 * @apiName DeleteValidations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
