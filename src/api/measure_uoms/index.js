import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export MeasureUoms, { schema } from './model'

const router = new Router()
const { measureId, uomName, description, status } = schema.tree

/**
 * @api {post} /measure_uoms Create measure uoms
 * @apiName CreateMeasureUoms
 * @apiGroup MeasureUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureId Measure uoms's measureId.
 * @apiParam uomName Measure uoms's uomName.
 * @apiParam description Measure uoms's description.
 * @apiParam status Measure uoms's status.
 * @apiSuccess {Object} measureUoms Measure uoms's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Measure uoms not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ measureId, uomName, description }),
  create)

/**
 * @api {get} /measure_uoms Retrieve measure uoms
 * @apiName RetrieveMeasureUoms
 * @apiGroup MeasureUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of measure uoms.
 * @apiSuccess {Object[]} rows List of measure uoms.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /measure_uoms/:id Retrieve measure uoms
 * @apiName RetrieveMeasureUoms
 * @apiGroup MeasureUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} measureUoms Measure uoms's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Measure uoms not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /measure_uoms/:id Update measure uoms
 * @apiName UpdateMeasureUoms
 * @apiGroup MeasureUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureId Measure uoms's measureId.
 * @apiParam uomName Measure uoms's uomName.
 * @apiParam description Measure uoms's description.
 * @apiParam status Measure uoms's status.
 * @apiSuccess {Object} measureUoms Measure uoms's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Measure uoms not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ measureId, uomName, description, status }),
  update)

/**
 * @api {delete} /measure_uoms/:id Delete measure uoms
 * @apiName DeleteMeasureUoms
 * @apiGroup MeasureUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Measure uoms not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
