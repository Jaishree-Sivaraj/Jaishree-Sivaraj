import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export UomConversions, { schema } from './model'

const router = new Router()
const { measureId, uomId, uomSource, uomTarget, conversionType, conversionParameter, conversionFormula, status } = schema.tree

/**
 * @api {post} /uom_conversions Create uom conversions
 * @apiName CreateUomConversions
 * @apiGroup UomConversions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureId Uom conversions's measureId.
 * @apiParam uomId Uom conversions's uomId.
 * @apiParam uomSource Uom conversions's uomSource.
 * @apiParam uomTarget Uom conversions's uomTarget.
 * @apiParam conversionType Uom conversions's conversionType.
 * @apiParam conversionParameter Uom conversions's conversionParameter.
 * @apiParam conversionFormula Uom conversions's conversionFormula.
 * @apiParam status Uom conversions's status.
 * @apiSuccess {Object} uomConversions Uom conversions's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Uom conversions not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ measureId, uomId, uomSource, uomTarget, conversionType, conversionParameter, conversionFormula, status }),
  create)

/**
 * @api {get} /uom_conversions Retrieve uom conversions
 * @apiName RetrieveUomConversions
 * @apiGroup UomConversions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of uom conversions.
 * @apiSuccess {Object[]} rows List of uom conversions.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /uom_conversions/:id Retrieve uom conversions
 * @apiName RetrieveUomConversions
 * @apiGroup UomConversions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} uomConversions Uom conversions's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Uom conversions not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /uom_conversions/:id Update uom conversions
 * @apiName UpdateUomConversions
 * @apiGroup UomConversions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureId Uom conversions's measureId.
 * @apiParam uomId Uom conversions's uomId.
 * @apiParam uomSource Uom conversions's uomSource.
 * @apiParam uomTarget Uom conversions's uomTarget.
 * @apiParam conversionType Uom conversions's conversionType.
 * @apiParam conversionParameter Uom conversions's conversionParameter.
 * @apiParam conversionFormula Uom conversions's conversionFormula.
 * @apiParam status Uom conversions's status.
 * @apiSuccess {Object} uomConversions Uom conversions's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Uom conversions not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ measureId, uomId, uomSource, uomTarget, conversionType, conversionParameter, conversionFormula, status }),
  update)

/**
 * @api {delete} /uom_conversions/:id Delete uom conversions
 * @apiName DeleteUomConversions
 * @apiGroup UomConversions
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Uom conversions not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
