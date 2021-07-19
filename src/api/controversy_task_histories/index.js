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
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam taskId Controversy task histories's taskId.
 * @apiParam companyId Controversy task histories's companyId.
 * @apiParam analystId Controversy task histories's analystId.
 * @apiParam stage Controversy task histories's stage.
 * @apiParam status Controversy task histories's status.
 * @apiParam createdBy Controversy task histories's createdBy.
 * @apiSuccess {Object} controversyTaskHistories Controversy task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true, roles: ['admin'] }),
  body({ taskId, companyId, analystId, stage, status, createdBy }),
  create)

/**
 * @api {get} /controversy_task_histories Retrieve controversy task histories
 * @apiName RetrieveControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of controversy task histories.
 * @apiSuccess {Object[]} rows List of controversy task histories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true, roles: ['admin'] }),
  query(),
  index)

/**
 * @api {get} /controversy_task_histories/:id Retrieve controversy task histories
 * @apiName RetrieveControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} controversyTaskHistories Controversy task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true, roles: ['admin'] }),
  show)

/**
 * @api {put} /controversy_task_histories/:id Update controversy task histories
 * @apiName UpdateControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam taskId Controversy task histories's taskId.
 * @apiParam companyId Controversy task histories's companyId.
 * @apiParam analystId Controversy task histories's analystId.
 * @apiParam stage Controversy task histories's stage.
 * @apiParam status Controversy task histories's status.
 * @apiParam createdBy Controversy task histories's createdBy.
 * @apiSuccess {Object} controversyTaskHistories Controversy task histories's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true, roles: ['admin'] }),
  body({ taskId, companyId, analystId, stage, status, createdBy }),
  update)

/**
 * @api {delete} /controversy_task_histories/:id Delete controversy task histories
 * @apiName DeleteControversyTaskHistories
 * @apiGroup ControversyTaskHistories
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Controversy task histories not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true, roles: ['admin'] }),
  destroy)

export default router
