import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, getAverageByNic, copyActualValuesAsProjected, getPercentileByPillar, saveProjectedValue } from './controller'
import { schema } from './model'
export ProjectedValues, { schema } from './model'

const router = new Router()
const { clientTaxonomyId, taxonomy, nic, categoryId, year, datapointId, projectedStdDeviation, projectedAverage, actualStdDeviation, actualAverage, pillar, years, currentYear, status } = schema.tree

/**
 * @api {post} /projected_values Create projected values
 * @apiName CreateProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomyId Projected values's clientTaxonomyId.
 * @apiParam nic Projected values's nic.
 * @apiParam categoryId Projected values's categoryId.
 * @apiParam year Projected values's year.
 * @apiParam datapointId Projected values's datapointId.
 * @apiParam projectedStdDeviation Projected values's projectedStdDeviation.
 * @apiParam projectedAverage Projected values's projectedAverage.
 * @apiParam actualStdDeviation Projected values's actualStdDeviation.
 * @apiParam actualAverage Projected values's actualAverage.
 * @apiParam status Projected values's status.
 * @apiSuccess {Object} projectedValues Projected values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ clientTaxonomyId, nic, categoryId, year, datapointId, projectedStdDeviation, projectedAverage, actualStdDeviation, actualAverage, currentYear, status }),
  create)

/**
 * @api {post} /projected_values/calculate_actuals Create projected values
 * @apiName CreateProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomyId Projected values's clientTaxonomyId.
 * @apiParam nic Projected values's nic.
 * @apiParam year Projected values's year.
 * @apiParam status Projected values's status.
 * @apiSuccess {Object} projectedValues Projected values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
 router.post('/calculate_actuals',
 token({ required: true }),
 body({ clientTaxonomyId, nic, year}),
 getAverageByNic)

/**
* @api {post} /projected_values/copy_actuals_as_projected Copy actuals as projected values
* @apiName CopyActualsAsProjectedValues
* @apiGroup ProjectedValues
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam clientTaxonomyId Projected values's clientTaxonomyId.
* @apiParam nic Projected values's nic.
* @apiParam year Projected values's year.
* @apiSuccess {Object} projectedValues Projected values's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Projected values not found.
* @apiError 401 user access only.
*/
router.post('/copy_actuals_as_projected',
token({ required: true }),
body({ clientTaxonomyId, nic, year}),
copyActualValuesAsProjected)

/**
 * @api {post} /projected_values/pillar_wise_percentile Create projected values
 * @apiName CreateProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomy Projected values's taxonomy.
 * @apiParam nic Projected values's nic.
 * @apiParam years Projected values's years.
 * @apiParam currentYear Projected values's currentYears.
 * @apiParam pillar Projected values's pillar.
 * @apiParam status Projected values's status.
 * @apiSuccess {Object} projectedValues Projected values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
 router.post('/pillar_wise_percentile',
 token({ required: true }),
 body({ taxonomy, nic, pillar, years, currentYear}),
 getPercentileByPillar) 

 /**
 * @api {post} /projected_values/save_projected_value Create projected values
 * @apiName CreateProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomy Projected values's taxonomy.
 * @apiParam nic Projected values's nic.
 * @apiParam currentYear Projected values's currentYears.
 * @apiParam pillar Projected values's pillar.
 * @apiParam status Projected values's status.
 * @apiSuccess {Object} projectedValues Projected values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
  router.post('/save_projected_value',
  token({ required: true }),
  body({ taxonomy, nic, pillar, currentYear}),
  saveProjectedValue) 
/**
 * @api {get} /projected_values Retrieve projected values
 * @apiName RetrieveProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of projected values.
 * @apiSuccess {Object[]} rows List of projected values.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /projected_values/:id Retrieve projected values
 * @apiName RetrieveProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} projectedValues Projected values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /projected_values/:id Update projected values
 * @apiName UpdateProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomyId Projected values's clientTaxonomyId.
 * @apiParam nic Projected values's nic.
 * @apiParam categoryId Projected values's categoryId.
 * @apiParam year Projected values's year.
 * @apiParam datapointId Projected values's datapointId.
 * @apiParam projectedStdDeviation Projected values's projectedStdDeviation.
 * @apiParam projectedAverage Projected values's projectedAverage.
 * @apiParam actualStdDeviation Projected values's actualStdDeviation.
 * @apiParam actualAverage Projected values's actualAverage.
 * @apiParam status Projected values's status.
 * @apiSuccess {Object} projectedValues Projected values's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ clientTaxonomyId, nic, categoryId, year, datapointId, projectedStdDeviation, projectedAverage, actualStdDeviation, actualAverage, status }),
  update)

/**
 * @api {delete} /projected_values/:id Delete projected values
 * @apiName DeleteProjectedValues
 * @apiGroup ProjectedValues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Projected values not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
