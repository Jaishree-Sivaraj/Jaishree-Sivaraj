import { Router } from 'express'
import { middleware as query } from 'querymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, updateCorrectionPending, updateName, updateTaskStatusToVerificationCompletedForCompletedTask } from './controller';


const router = new Router();
const { taskStatus } = '';

/**
* @api {put} /temp/updateTaskStatus Update temp
* @apiName UpdateTemp
* @apiGroup Temp
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiSuccess {Object} temp Temp's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Temp not found.
* @apiError 401 user access only.
*/
router.put('/updateTaskStatus',
  token({ required: true }),
  updateTaskStatusToVerificationCompletedForCompletedTask)


/**
 * @api {post} /temp Create temp
 * @apiName CreateTemp
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} temp Temp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Temp not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  create)

/**
 * @api {get} /temp Retrieve temps
 * @apiName RetrieveTemps
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Object[]} temps List of temps.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /temp/:id Retrieve temp
 * @apiName RetrieveTemp
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} temp Temp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Temp not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /temp/update/:clientTaxonomyId/:taskStatus Retrieve temp
 * @apiName RetrieveTemp
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} temp Temp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Temp not found.
 * @apiError 401 user access only.
 */
router.get('/update/:clientTaxonomyId/:taskStatus',
  token({ required: true }),
  updateCorrectionPending)

/**
 * @api {put} /temp/:id Update temp
 * @apiName UpdateTemp
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} temp Temp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Temp not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  update)

/**
 * @api {delete} /temp/:id Delete temp
 * @apiName DeleteTemp
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Temp not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

/**
 * @api {PUT} /temp Update temp
 * @apiName update Name
 * @apiGroup Temp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Temp not found.
 * @apiError 401 user access only.
 */
router.put('/',
  token({ required: true }),
  updateName)





export default router
