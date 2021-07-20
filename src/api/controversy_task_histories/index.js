import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export ControversyTaskHistories, { schema } from './model'

const router = new Router()
const { taskId, companyId, analystId, stage, status, createdBy } = schema.tree

/**
 * @api {post} /controversy_task_histories Create controversy task histories
 * @apiName CreateControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Controversy task histories's taskId.
 * @apiParam companyId Cotories's companyId.
 * @apiParam analystId Controversy task hid.
 * @apiParam stage Controversy task histories's stage.
 * @apiParam status Controversy task histories's status.
 * @apiParam createdBy Controversy task histories's createdBy.
 * @apiSuccess {Object} controversyTaskHistories Controversy task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ taskId, companyId, analystId, stage, status, createdBy }),
  create)

/**
 * @api {get} /controversy_task_histories Retrieve controversy task histories
 * @apiName RetrieveControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of controversy task histories.
 * @apiSuccess {Object[]} rows List of controversy task histories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /controversy_task_histories/:id Retrieve controversy task histories
 * @apiName RetrieveControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} controversyTaskHistories Controversy task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /controversy_task_histories/:id Update controversy task histories
 * @apiName UpdateControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taskId Controversy task histories's taskId.
 * @apiParam companyId Controversy task histories's companyId.
 * @apiParam analystId Controversy task histories's analystId.
 * @apiParam stage Controversy task histories's stage.
 * @apiParam status Controversy task histories's status.
 * @apiParam createdBy Controversy task histories's createdBy.
 * @apiSuccess {Object} controversyTaskHistories Controversy task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ taskId, companyId, analystId, stage, status, createdBy }),
  update)

/**
 * @api {delete} /controversy_task_histories/:id Delete controversy task histories
 * @apiName DeleteControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
