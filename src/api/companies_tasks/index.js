import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, allocateTasksFromJson, taskIdMappingCorrection, bulkTaskCreation } from './controller'
import { schema } from './model'
export CompaniesTasks, { schema } from './model'

const router = new Router()
const { taskId, companyId, year, categoryId, status } = schema.tree

/**
 * @api {post} /companies_tasks Create companies tasks
 * @apiName CreateCompaniesTasks
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Companies tasks's taskId.
 * @apiParam companyId Companies tasks's companyId.
 * @apiParam year Companies tasks's year.
 * @apiParam categoryId Companies tasks's categoryId.
 * @apiSuccess {Object} companiesTasks Companies tasks's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Companies tasks not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ taskId, companyId, year, categoryId }),
  create)

/**
 * @api {get} /companies_tasks Retrieve companies tasks
 * @apiName RetrieveCompaniesTasks
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of companies tasks.
 * @apiSuccess {Object[]} rows List of companies tasks.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /companies_tasks/:id Retrieve companies tasks
 * @apiName RetrieveCompaniesTasks
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} companiesTasks Companies tasks's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Companies tasks not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /companies_tasks/import/tasks Import companies tasks
 * @apiName ImportCompaniesTasks
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of companies tasks.
 * @apiSuccess {Object[]} rows List of companies tasks.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/import/tasks',
  token({ required: true }),
  query(),
  taskIdMappingCorrection)

/**
 * @api {get} /companies_tasks/bulk/tasks/create/:taskStatus/:number Bulk Tasks creation for testing
 * @apiName BulkTasksCreationForTesting
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of companies tasks.
 * @apiSuccess {Object[]} rows List of companies tasks.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/bulk/tasks/create/:taskStatus/:number',
  token({ required: true }),
  query(),
  bulkTaskCreation)

/**
 * @api {put} /companies_tasks/:id Update companies tasks
 * @apiName UpdateCompaniesTasks
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Companies tasks's taskId.
 * @apiParam companyId Companies tasks's companyId.
 * @apiParam year Companies tasks's year.
 * @apiParam categoryId Companies tasks's categoryId.
 * @apiParam status Companies tasks's status.
 * @apiSuccess {Object} companiesTasks Companies tasks's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Companies tasks not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ taskId, companyId, year, categoryId, status }),
  update)

/**
 * @api {delete} /companies_tasks/:id Delete companies tasks
 * @apiName DeleteCompaniesTasks
 * @apiGroup CompaniesTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Companies tasks not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
