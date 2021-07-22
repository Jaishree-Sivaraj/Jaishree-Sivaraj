import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, uploadControversies, generateJson, fetchDatapointControversy } from './controller'
import { schema } from './model'
export Controversy, { schema } from './model'

const router = new Router()
const { controversyNumber, datapointId, companyId, year, controversyDetails, pageNumber, sourceName, sourceURL, textSnippet, screenShot, sourcePublicationDate, publicationDate, comments, submittedDate, response,status } = schema.tree

/**
 * @api {post} /controversies Create controversy
 * @apiName CreateControversy
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Controversy's datapointId.
 * @apiParam companyId Controversy's companyId.
 * @apiParam year Controversy's year.
 * @apiParam controversyDetails Controversy's controversyDetails.
 * @apiParam comments Controversy's comments.
 * @apiParam submittedDate Controversy's submittedDate.
 * @apiParam response Controversy's response.
 * @apiSuccess {Object} controversy Controversy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ datapointId, companyId, year, controversyDetails, comments, submittedDate, response }),
  create)

/**
 * @api {post} /controversies/upload Upload controversy
 * @apiName UploadControversy
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} controversy Controversy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
 router.post('/upload',
 token({ required: true }),
 query(),
 uploadControversies)

/**
 * @api {get} /controversies Retrieve controversies
 * @apiName RetrieveControversies
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of controversies.
 * @apiSuccess {Object[]} rows List of controversies.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /controversies/:id Retrieve controversy
 * @apiName RetrieveControversy
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} controversy Controversy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /controversies/json/:companyId Generate controversy JSON
 * @apiName GenerateControversyJSON
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} controversy Controversy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
router.get('/json/:companyId',
  token({ required: true }),
  generateJson)

/**
 * @api {get} /controversies/fetch/:companyId/:datapointId Fetch Controversy for a datapoint
 * @apiName FetchDatapointControversies
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} controversy Controversy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
router.get('/fetch/:companyId/:datapointId',
  token({ required: true }),
  fetchDatapointControversy)

/**
 * @api {put} /controversies/:id Update controversy
 * @apiName UpdateControversy
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam datapointId Controversy's datapointId.
 * @apiParam companyId Controversy's companyId.
 * @apiParam year Controversy's year.
 * @apiParam controversyDetails Controversy's controversyDetails.
 * @apiParam comments Controversy's comments.
 * @apiParam submittedDate Controversy's submittedDate.
 * @apiParam response Controversy's response.
 * @apiSuccess {Object} controversy Controversy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ datapointId, companyId, year, controversyDetails, comments, submittedDate, response ,status}),
  update)

/**
 * @api {delete} /controversies/:id Delete controversy
 * @apiName DeleteControversy
 * @apiGroup Controversy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Controversy not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
