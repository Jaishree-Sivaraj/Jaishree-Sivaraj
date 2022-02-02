import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, reportsFilter } from './controller'

const { clientTaxonomyId, searchQuery, page, limit } = '';
const { nicList, yearsList, pillarList } = [];


const router = new Router()

/**
 * @api {post} /reports/filter Create reports
 * @apiName CreateReports
 * @apiGroup Reports
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} reports Reports's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Reports not found.
 * @apiError 401 user access only.
 */
router.post('/filter',
  token({ required: true }),
  body({ clientTaxonomyId, nicList, yearsList, pillarList, searchQuery, page, limit }),
  reportsFilter)

/**
 * @api {get} /reports Retrieve reports
 * @apiName RetrieveReports
 * @apiGroup Reports
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Object[]} reports List of reports.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

export default router
