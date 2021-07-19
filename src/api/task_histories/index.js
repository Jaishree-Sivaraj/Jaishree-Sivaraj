import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export TaskHistories, { schema } from './model'

const router = new Router()
const { taskId, companyId, categoryId, submittedByName, stage, comment, status, createdBy } = schema.tree

/**
 * @api {post} /task_histories Create task histories
 * @apiName CreateTaskHistories
 * @apiGroup TaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam taskId Task histories's taskId.
 * @apiParam companyId Task histories's companyId.
 * @apiParam categoryId Task histories's categoryId.
 * @apiParam submittedByName Task histories's submittedByName.
 * @apiParam stage Task histories's stage.
 * @apiParam comment Task histories's comment.
 * @apiParam status Task histories's status.
 * @apiParam createdBy Task histories's createdBy.
 * @apiSuccess {Object} taskHistories Task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task histories not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true, roles: ['admin'] }),
  body({ taskId, companyId, categoryId, submittedByName, stage, comment, status, createdBy }),
  create)

/**
 * @api {get} /task_histories Retrieve task histories
 * @apiName RetrieveTaskHistories
 * @apiGroup TaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of task histories.
 * @apiSuccess {Object[]} rows List of task histories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true, roles: ['admin'] }),
  query(),
  index)

/**
 * @api {get} /task_histories/:id Retrieve task histories
 * @apiName RetrieveTaskHistories
 * @apiGroup TaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} taskHistories Task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task histories not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true, roles: ['admin'] }),
  show)

/**
 * @api {put} /task_histories/:id Update task histories
 * @apiName UpdateTaskHistories
 * @apiGroup TaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam taskId Task histories's taskId.
 * @apiParam companyId Task histories's companyId.
 * @apiParam categoryId Task histories's categoryId.
 * @apiParam submittedByName Task histories's submittedByName.
 * @apiParam stage Task histories's stage.
 * @apiParam comment Task histories's comment.
 * @apiParam status Task histories's status.
 * @apiParam createdBy Task histories's createdBy.
 * @apiSuccess {Object} taskHistories Task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task histories not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true, roles: ['admin'] }),
  body({ taskId, companyId, categoryId, submittedByName, stage, comment, status, createdBy }),
  update)

/**
 * @api {delete} /task_histories/:id Delete task histories
 * @apiName DeleteTaskHistories
 * @apiGroup TaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Task histories not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true, roles: ['admin'] }),
  destroy)

export default router
