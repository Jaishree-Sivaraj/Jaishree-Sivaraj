import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, retrieveJsonFiles, payLoadGenerationDetails, generateJson, downloadJson } from './controller'
import { schema } from './model'
export JsonFiles, { schema } from './model'

const router = new Router()
const { companyId, year, type, fileName, url, status } = schema.tree
/**
 * @api {post} /json_files Create json files
 * @apiName CreateJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Json files's companyId.
 * @apiParam year Json files's year.
 * @apiParam type Json files's type.
 * @apiParam fileName Json files's fileName.
 * @apiParam url Json files's url.
 * @apiParam status Json files's status.
 * @apiSuccess {Object} jsonFiles Json files's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyId, year, type, fileName, url, status }),
  create)


/**
 * @api {post} /json_files/generate-json Create json files
 * @apiName CreateJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Json files's companyId.
 * @apiParam year Json files's year.
 * @apiParam type Json files's type.
 * @apiSuccess {Object} jsonFiles Json files's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.post('/generate-json',
  token({ required: true }),
  body({ companyId, type, year }),
  generateJson)

/**
* @api {post} /json_files/generate-json Create json files
* @apiName CreateJsonFiles
* @apiGroup JsonFiles
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam companyId Json files's companyId.
* @apiParam year Json files's year.
* @apiParam type Json files's type.
* @apiSuccess {Object} jsonFiles Json files's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Json files not found.
* @apiError 401 user access only.
*/
router.post('/download-json',
  token({ required: true }),
  body({ fileName }),
  downloadJson)

/**
 * @api {get} /json_files Retrieve json files
 * @apiName RetrieveJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of json files.
 * @apiSuccess {Object[]} rows List of json files.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /json_files/:id Retrieve json files
 * @apiName RetrieveJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} jsonFiles Json files's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /json_files/:id Update json files
 * @apiName UpdateJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Json files's companyId.
 * @apiParam year Json files's year.
 * @apiParam type Json files's type.
 * @apiParam fileName Json files's fileName.
 * @apiParam url Json files's url.
 * @apiParam status Json files's status.
 * @apiSuccess {Object} jsonFiles Json files's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ companyId, year, type, fileName, url, status }),
  update)

/**
 * @api {delete} /json_files/:id Delete json files
 * @apiName DeleteJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

/**
 * @api {get} /json_files/retrieve/:type Retrieve json files
 * @apiName RetrieveJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} jsonFiles Json files's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.get('/retrieve/:type',
  token({ required: true }),
  retrieveJsonFiles)


/**
 * @api {get} /json_files/retrieve/:type Retrieve json files
 * @apiName RetrieveJsonFiles
 * @apiGroup JsonFiles
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} jsonFiles Json files's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Json files not found.
 * @apiError 401 user access only.
 */
router.get('/payLoadGenerationDetails/:type',
  token({ required: true }),
  payLoadGenerationDetails)

export default router
