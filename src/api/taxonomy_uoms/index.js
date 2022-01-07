import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export TaxonomyUoms, { schema } from './model'

const router = new Router()
const { measureId, measureUomId, uomConversionId, clientTaxonomyId, status } = schema.tree

/**
 * @api {post} /taxonomy_uoms Create taxonomy uoms
 * @apiName CreateTaxonomyUoms
 * @apiGroup TaxonomyUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureId Taxonomy uoms's measureId.
 * @apiParam measureUomId Taxonomy uoms's measureUomId.
 * @apiParam uomConversionId Taxonomy uoms's uomConversionId.
 * @apiParam clientTaxonomyId Taxonomy uoms's clientTaxonomyId.
 * @apiSuccess {Object} taxonomyUoms Taxonomy uoms's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Taxonomy uoms not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ measureId, measureUomId, uomConversionId, clientTaxonomyId }),
  create)

/**
 * @api {get} /taxonomy_uoms Retrieve taxonomy uoms
 * @apiName RetrieveTaxonomyUoms
 * @apiGroup TaxonomyUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of taxonomy uoms.
 * @apiSuccess {Object[]} rows List of taxonomy uoms.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /taxonomy_uoms/:id Retrieve taxonomy uoms
 * @apiName RetrieveTaxonomyUoms
 * @apiGroup TaxonomyUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} taxonomyUoms Taxonomy uoms's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Taxonomy uoms not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /taxonomy_uoms/:id Update taxonomy uoms
 * @apiName UpdateTaxonomyUoms
 * @apiGroup TaxonomyUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureId Taxonomy uoms's measureId.
 * @apiParam measureUomId Taxonomy uoms's measureUomId.
 * @apiParam uomConversionId Taxonomy uoms's uomConversionId.
 * @apiParam clientTaxonomyId Taxonomy uoms's clientTaxonomyId.
 * @apiParam status Taxonomy uoms's status.
 * @apiSuccess {Object} taxonomyUoms Taxonomy uoms's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Taxonomy uoms not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ measureId, measureUomId, uomConversionId, clientTaxonomyId, status }),
  update)

/**
 * @api {delete} /taxonomy_uoms/:id Delete taxonomy uoms
 * @apiName DeleteTaxonomyUoms
 * @apiGroup TaxonomyUoms
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Taxonomy uoms not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
