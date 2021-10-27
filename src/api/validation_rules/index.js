import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, test } from './controller'
import { schema } from './model'
export ValidationRules, { schema } from './model'

const router = new Router()
const { ruleName, condition, criteria, minimumValue, maximumValue, dependantDPCodes, datapointId, status } = schema.tree

/**
 * @api {post} /validation_rules Create validation rules
 * @apiName CreateValidationRules
 * @apiGroup ValidationRules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam ruleName Validation rules's ruleName.
 * @apiParam condition Validation rules's condition.
 * @apiParam criteria Validation rules's criteria.
 * @apiParam minimumValue Validation rules's minimumValue.
 * @apiParam maximumValue Validation rules's maximumValue.
 * @apiParam dependantDPCodes Validation rules's dependantDPCodes.
 * @apiParam datapointId Validation rules's datapointId.
 * @apiParam status Validation rules's status.
 * @apiSuccess {Object} validationRules Validation rules's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation rules not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ ruleName, condition, criteria, minimumValue, maximumValue, dependantDPCodes, datapointId, status }),
  create)

/**
 * @api {get} /validation_rules Retrieve validation rules
 * @apiName RetrieveValidationRules
 * @apiGroup ValidationRules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of validation rules.
 * @apiSuccess {Object[]} rows List of validation rules.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /validation_rules/:id Retrieve validation rules
 * @apiName RetrieveValidationRules
 * @apiGroup ValidationRules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} validationRules Validation rules's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation rules not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /validation_rules/:id Update validation rules
 * @apiName UpdateValidationRules
 * @apiGroup ValidationRules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam ruleName Validation rules's ruleName.
 * @apiParam condition Validation rules's condition.
 * @apiParam criteria Validation rules's criteria.
 * @apiParam minimumValue Validation rules's minimumValue.
 * @apiParam maximumValue Validation rules's maximumValue.
 * @apiParam dependantDPCodes Validation rules's dependantDPCodes.
 * @apiParam datapointId Validation rules's datapointId.
 * @apiParam status Validation rules's status.
 * @apiSuccess {Object} validationRules Validation rules's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Validation rules not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ ruleName, condition, criteria, minimumValue, maximumValue, dependantDPCodes, datapointId, status }),
  update)

/**
 * @api {delete} /validation_rules/:id Delete validation rules
 * @apiName DeleteValidationRules
 * @apiGroup ValidationRules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Validation rules not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

router.get('/test/test',
token({ required: false }),
query(),
test)

export default router
