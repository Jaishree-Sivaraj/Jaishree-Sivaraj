import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, createBatch, updateBatch, getAllUnAssignedBatches } from './controller'
import { schema } from './model'
export Batches, { schema } from './model'

const router = new Router()
const { batchName, years, status, companiesList, clientTaxonomy } = schema.tree
const companies = [], taxonomy = {};

/**
 * @api {post} /batches Create batches
 * @apiName CreateBatches
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomy Batches's clientTaxonomy.
 * @apiParam batchName Batches's batchName.
 * @apiParam years Batches's years.
 * @apiParam companiesList Batches's companiesList.
 * @apiSuccess {Object} batches Batches's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batches not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ batchName, years, companiesList, clientTaxonomy }),
  create)

/**
 * @api {post} /batches/create Create batches from UI
 * @apiName CreateBatchesFromUI
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomy Batches's taxonomy.
 * @apiParam batchName Batches's batchName.
 * @apiParam years Batches's years.
 * @apiParam companies Batches's companies.
 * @apiSuccess {Object} batches Batches's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batches not found.
 * @apiError 401 user access only.
 */
router.post('/create',
  token({ required: true }),
  body({ batchName, years, companies, taxonomy }),
  createBatch)

/**
 * @api {get} /batches Retrieve batches
 * @apiName RetrieveBatches
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of batches.
 * @apiSuccess {Object[]} rows List of batches.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /batches/:id Retrieve batches
 * @apiName RetrieveBatches
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} batches Batches's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batches not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /batches/all/unassigned Retrieve unassigned batches
 * @apiName RetrieveUnAssignedBatches
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of batches.
 * @apiSuccess {Object[]} rows List of batches.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/all/unassigned',
  token({ required: true }),
  query(),
  getAllUnAssignedBatches)

/**
 * @api {put} /batches/:id Update batches
 * @apiName UpdateBatches
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam clientTaxonomy Batches's clientTaxonomy.
 * @apiParam batchName Batches's batchName.
 * @apiParam years Batches's years.
 * @apiParam companiesList Batches's companiesList.
 * @apiParam status Batches's status.
 * @apiSuccess {Object} batches Batches's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batches not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ batchName, years, status, companiesList, clientTaxonomy }),
  update)

/**
 * @api {put} /batches/update/:id Update batch from UI
 * @apiName UpdateBatchesFromUI
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomy Batches's taxonomy.
 * @apiParam batchName Batches's batchName.
 * @apiParam years Batches's years.
 * @apiParam companies Batches's companies.
 * @apiParam status Batches's status.
 * @apiSuccess {Object} batches Batches's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Batches not found.
 * @apiError 401 user access only.
 */
router.put('/update/:id',
  token({ required: true }),
  body({ batchName, years, companies, taxonomy, status }),
  updateBatch)

/**
 * @api {delete} /batches/:id Delete batches
 * @apiName DeleteBatches
 * @apiGroup Batches
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Batches not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
