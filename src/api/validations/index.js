import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, type8Validation,type3Validation,extraAddKeys, getAllValidation, includeExtraKeysFromJson } from './controller'
import { schema } from './model'
export Validations, { schema } from './model'

const router = new Router()
const { datapointId, dpCode, validationRule, dataType, hasDependentCode, dependentCodes, validationType, percentileThreasholdValue, parameters, 
  methodName, checkCondition, criteria, checkResponse, errorMessage, status } = schema.tree
const companyId = '', clientTaxonomyId = '', currentYear = '', previousYear = '', response = '';
/**
 * @api {post} /validations Create validations
 * @apiName CreateValidations
 * @apiGroup Validations
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Validations's datapointId.
 * @apiParam dpCode Validations's dpCode.
 * @apiParam clientTaxonomyId Validations's clientTaxonomyId.
 * @apiParam validationRule Validations's validationRule.
 * @apiParam dataType Validations's dataType.
 * @apiParam hasDependentCode Validations's hasDependentCode.
 * @apiParam dependentCodes Validations's dependentCodes.
 * @apiParam validationType Validations's validationType.
 * @apiParam percentileThreasholdValue Validations's percentileThreasholdValue.
 * @apiParam parameters Validations's parameters.
 * @apiParam methodName Validations's methodName.
 * @apiParam checkCondition Validations's checkCondition.
 * @apiParam criteria Validations's criteria.
 * @apiParam checkResponse Validations's checkResponse.
 * @apiParam errorMessage Validations's errorMessage.
 * @apiSuccess {Object} validations Validations's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ datapointId, dpCode, clientTaxonomyId, validationRule, dataType, hasDependentCode, dependentCodes, validationType, percentileThreasholdValue, parameters, 
    methodName, checkCondition, criteria, checkResponse, errorMessage }),
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
   * @api {get} /validations/validateDpDetails/:taskId 
   * @apiName RetrieveValidations
   * @apiGroup Validations
   * @apiPermission user
   * @apiParam {String} access_token user access token.
   * @apiSuccess {Object} validations Validations's data.
   * @apiError {Object} 400 Some parameters may contain invalid values.
   * @apiError 404 Validations not found.
   * @apiError 401 user access only.
   */
  router.get('/validateDpDetails/:taskId/:previousYear',
    token({ required: true }),
    getAllValidation)
  
    /**
   * @api {get} /validations/addValidations
   * @apiName CreateValidations
   * @apiGroup Validations
   * @apiPermission user
   * @apiParam {String} access_token user access token.
   * @apiSuccess {Object} validations Validations's data.
   * @apiError {Object} 400 Some parameters may contain invalid values.
   * @apiError 404 Validations not found.
   * @apiError 401 user access only.
   */
    router.get('/addValidations',
    token({ required: true }),
    includeExtraKeysFromJson)

  /**
   * @api {get} /validations/addCategory add CategoryId
   * @apiName RetrieveValidations
   * @apiGroup Validations
   * @apiPermission user
   * @apiParam {String} access_token user access token.
   * @apiSuccess {Object} validations Validations's data.
   * @apiError {Object} 400 Some parameters may contain invalid values.
   * @apiError 404 Validations not found.
   * @apiError 401 user access only.
   */
  router.get('/addCategory',
    token({ required: true }),
    extraAddKeys)
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
 * @apiParam dependentCodes Validations's dependentCodes.
 * @apiParam criteria Validations's criteria.
 * @apiParam status Validations's status.
 * @apiSuccess {Object} validations Validations's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validations not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ datapointId, validationRule, dependentCodes, criteria, status }),
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
