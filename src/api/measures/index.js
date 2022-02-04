import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, retrieveMeasureDetails, retrieveMeasureById, createMeasure, updateMeasureById } from './controller'
import { schema } from './model'
export Measures, { schema } from './model'

const router = new Router()
const { measureName, measureDescription, status } = schema.tree

/**
 * @api {post} /measures 
 * @apiName CreateMeasures
 * @apiGroup Measures
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureName Measures's measureName.
 * @apiParam measureDescription Measures's measureDescription.
 * @apiParam status Measures's status.
 * @apiSuccess {Object} measures Measures's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Measures not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ measureName, measureDescription }),
  createMeasure)

/**
 * @api {get} /measures Retrieve all measures 
 * @apiName RetrieveMeasures
 * @apiGroup Measures
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of measures.
 * @apiSuccess {Object[]} rows List of measures.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  retrieveMeasureDetails)


/**
 * @api {get} /measures/:id Retrieve measures
 * @apiName RetrieveMeasures
 * @apiGroup Measures
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} measures Measures's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Measures not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  retrieveMeasureById)

/**
 * @api {put} /measures/:id retrieve measure details
 * @apiName  retrieve measure details
 * @apiGroup Measures
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam measureName Measures's measureName.
 * @apiParam measureDescription Measures's measureDescription.
 * @apiParam status Measures's status.
 * @apiSuccess {Object} measures Measures's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Measures not found.
 * @apiError 401 user access only.
 */



router.put('/:id',
  token({ required: true }),
  body({ measureName, measureDescription, status }),
  updateMeasureById)

/**
 * @api {delete} /measures/:id Delete measures
 * @apiName DeleteMeasures
 * @apiGroup Measures
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Measures not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)








export default router
