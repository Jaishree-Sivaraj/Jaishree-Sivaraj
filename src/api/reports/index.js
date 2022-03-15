import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, reportsFilter, exportReport, companySearch } from './controller'

const { clientTaxonomyId, searchQuery, page, limit, companyName } = '';
const { selectedCompanies, nicList, yearsList, pillarList, batchList } = [];


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
  body({ clientTaxonomyId, nicList, yearsList, pillarList, batchList, page, limit }),
  reportsFilter)
  
/**
 * @api {post} /reports/export Create reports
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
body({ clientTaxonomyId, selectedCompanies, yearsList, pillarList }),
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
body({ companyName }),
companySearch)

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
