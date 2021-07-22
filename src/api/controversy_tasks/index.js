import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, newControversyTask } from './controller'
import { schema } from './model'
export ControversyTasks, { schema } from './model'

const router = new Router()
const { taskNumber, companyId, analystId, taskStatus, completedDate, status } = schema.tree
const companiesList = [];

/**
 * @api {post} /controversy_tasks Create controversy tasks
 * @apiName CreateControversyTasks
 * @apiGroup ControversyTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskNumber Controversy tasks's taskNumber.
 * @apiParam companyId Controversy tasks's companyId.
 * @apiParam analystId Controversy tasks's analystId.
 * @apiParam taskStatus Controversy tasks's taskStatus.
 * @apiParam completedDate Controversy tasks's completedDate.
 * @apiParam status Controversy tasks's status.
 * @apiSuccess {Object} controversyTasks Controversy tasks's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy tasks not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ taskNumber, companyId, analystId, taskStatus, completedDate, status }),
  create)

  /** @api {post} /controversy_tasks/new-task Create controversy tasks
  * @apiName CreateControversyTasks
  * @apiGroup ControversyTasks
  * @apiPermission user
  * @apiParam {String} access_token user access token.
  * @apiSuccess {Object} controversyTasks Controversy tasks's data.
  * @apiError {Object} 400 Some parameters may contain invalid values.
  * @apiError 404 Controversy tasks not found.
  * @apiError 401 user access only.
  */
 router.post('/new-task',
   token({ required: true }),
   body({ companiesList, analystId }),
   newControversyTask)

/**
 * @api {get} /controversy_tasks Retrieve controversy tasks
 * @apiName RetrieveControversyTasks
 * @apiGroup ControversyTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of controversy tasks.
 * @apiSuccess {Object[]} rows List of controversy tasks.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /controversy_tasks/:id Retrieve controversy tasks
 * @apiName RetrieveControversyTasks
 * @apiGroup ControversyTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} controversyTasks Controversy tasks's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy tasks not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /controversy_tasks/:id Update controversy tasks
 * @apiName UpdateControversyTasks
 * @apiGroup ControversyTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskNumber Controversy tasks's taskNumber.
 * @apiParam companyId Controversy tasks's companyId.
 * @apiParam analystId Controversy tasks's analystId.
 * @apiParam taskStatus Controversy tasks's taskStatus.
 * @apiParam completedDate Controversy tasks's completedDate.
 * @apiParam status Controversy tasks's status.
 * @apiSuccess {Object} controversyTasks Controversy tasks's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy tasks not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ taskNumber, companyId, analystId, taskStatus, completedDate, status }),
  update)

/**
 * @api {delete} /controversy_tasks/:id Delete controversy tasks
 * @apiName DeleteControversyTasks
 * @apiGroup ControversyTasks
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Controversy tasks not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
