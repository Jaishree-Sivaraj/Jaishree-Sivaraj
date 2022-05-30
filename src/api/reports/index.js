import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, reportsFilter, exportReport, companySearch, exportQATasks,exportAdminTask, exportAnalystTask } from './controller'

const { role, clientTaxonomyId, searchQuery, page, limit, companyName } = '';
const { selectedTasks, selectedCompanies, nicList, yearsList, pillarList, batchList, filteredCompanies } = [];
const { isSelectedAll } = false;


const router = new Router()

/**
 * @api {post} /reports/filter Filter reports
 * @apiName FilterReports
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
  body({ clientTaxonomyId, nicList, yearsList, pillarList, batchList, filteredCompanies, page, limit }),
  reportsFilter)

/**
 * @api {post} /reports/export Create reports.
 * @apiName CreateReports
 * @apiGroup Reports
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} reports Reports's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Reports not found.
 * @apiError 401 user access only.
 */
router.post('/export',
  token({ required: true }),
  body({ clientTaxonomyId, selectedCompanies, yearsList, pillarList, batchList, filteredCompanies, isSelectedAll }),
  exportReport)

/**
 * @api {post} /reports/company-search Company Search
 * @apiName CompanySearch
 * @apiGroup Reports
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} reports Reports's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Reports not found.
 * @apiError 401 user access only.
 */
router.post('/company-search',
  token({ required: true }),
  body({ clientTaxonomyId, companyName, batchList, nicList }),
  companySearch)

/**
 * @api {post} /reports/qa-tasks/export Export QA Tasks
 * @apiName ExportQATasks
 * @apiGroup Reports
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} reports Reports's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Reports not found.
 * @apiError 401 user access only.
 */
router.post('/qa-tasks/export',
  token({ required: true }),
  body({ selectedTasks, isSelectedAll, role }),
  exportQATasks)

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

/**
  * @api {get} /reports/admin-report/:taskType Retrieve reports
  * @apiName RetrieveReports
  * @apiGroup Reports
  * @apiPermission user
  * @apiParam {String} access_token user access token.
  * @apiUse listParams
  * @apiSuccess {Object[]} reports List of reports.
  * @apiError {Object} 400 Some parameters may contain invalid values.
  * @apiError 401 user access only.
  */
router.get('/admin-report/:role/:taskType',
  token({ required: true }),
  query(),
  exportAdminTask)

  /**
  * @api {get} /reports/analyst-report/:taskType Retrieve reports
  * @apiName RetrieveReports
  * @apiGroup Reports
  * @apiPermission user
  * @apiParam {String} access_token user access token.
  * @apiUse listParams
  * @apiSuccess {Object[]} reports List of reports.
  * @apiError {Object} 400 Some parameters may contain invalid values.
  * @apiError 401 user access only.
  */
router.get('/:role/:taskType',
token({ required: true }),
query(),
exportAnalystTask)

export default router
