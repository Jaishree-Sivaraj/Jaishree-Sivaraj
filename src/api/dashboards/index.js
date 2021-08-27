import { Router } from 'express'
import { middleware as query } from 'querymen'
import { token } from '../../services/passport'
import { dashboardStats } from './controller'

const router = new Router()

/**
 * @api {get} /dashboards Retrieve dashboards
 * @apiName RetrieveDashboards
 * @apiGroup Dashboards
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Object[]} dashboards List of dashboards.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  dashboardStats)

export default router
