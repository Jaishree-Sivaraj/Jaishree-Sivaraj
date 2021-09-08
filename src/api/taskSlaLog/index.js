import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, slaDateExtensionRequest, rejectRequest, getAllRequestsOfaTask } from './controller'
import { schema } from './model'
export TaskSlaLog, { schema } from './model'

const router = new Router()
const { taskId, requestedBy, days, isAccepted, isRejected, isReviewed, status } = schema.tree

/**
 * @api {post} /taskSlaLogs Create task sla log
 * @apiName CreateTaskSlaLog
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Task sla log's taskId.
 * @apiParam days Task sla log's days.
 * @apiParam requestedBy Task sla log's requestedBy.
 * @apiParam isAccepted Task sla log's isAccepted.
 * @apiSuccess {Object} taskSlaLog Task sla log's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ taskId,days, requestedBy, isAccepted }),
  create)

/**
 * @api {post} /taskSlaLogs/slaExtensionRequest Request for extension of task sla date
 * @apiName RequestForTaskSlaDateExtension
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Task sla log's taskId.
 * @apiParam days Task sla log's days.
 * @apiParam requestedBy Task sla log's requestedBy.
 * @apiParam isAccepted Task sla log's isAccepted.
 * @apiSuccess {Object} taskSlaLog Task sla log's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
 router.post('/slaExtensionRequest',
 token({ required: true }),
 body({ taskId, days, requestedBy }),
 slaDateExtensionRequest)

/**
 * @api {get} /taskSlaLogs Retrieve task sla logs
 * @apiName RetrieveTaskSlaLogs
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of task sla logs.
 * @apiSuccess {Object[]} rows List of task sla logs.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /taskSlaLogs/:id Retrieve task sla log
 * @apiName RetrieveTaskSlaLog
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} taskSlaLog Task sla log's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /taskSlaLogs/task-requests/:taskId Retrieve task sla log of a taskId
 * @apiName RetrieveAllTaskSlaLogOfaTask
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} taskSlaLog Task sla log's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
router.get('/task-requests/:taskId',
  token({ required: true }),
  query(),
  getAllRequestsOfaTask)

/**
 * @api {put} /taskSlaLogs/:id Update task sla log
 * @apiName UpdateTaskSlaLog
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Task sla log's taskId.
 * @apiParam days Task sla log's days.
 * @apiParam requestedBy Task sla log's requestedBy.
 * @apiParam isAccepted Task sla log's isAccepted.
 * @apiParam status Task sla log's status.
 * @apiSuccess {Object} taskSlaLog Task sla log's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ taskId,days, requestedBy, isAccepted, status }),
  update)

/**
 * @api {put} /taskSlaLogs/reject/:id Reject Sla request
 * @apiName RejectTaskSlaLog
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiSuccess {Object} taskSlaLog Task sla log's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
router.put('/reject/:id',
  token({ required: true }),
  body({}),
  rejectRequest)

/**
 * @api {delete} /taskSlaLogs/:id Delete task sla log
 * @apiName DeleteTaskSlaLog
 * @apiGroup TaskSlaLog
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Task sla log not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
