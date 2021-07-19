import {
  Router
} from 'express'
import {
  middleware as query
} from 'querymen'
import {
  middleware as body
} from 'bodymen'
import {
  token
} from '../../services/passport'
import {
  create,
  index,
  show,
  update,
  destroy,
  uploadCompanyESGFiles,
  dataCollection
} from './controller'
import {
  schema
} from './model'
export StandaloneDatapoints, {
  schema
}
from './model'

const router = new Router()
const {
  companyId,
  datapointId,
  performanceResult,
  response,
  year,
  fiscalYearEndDate,
  standaloneStatus,
  taskId,
  submittedBy,
  submittedDate,
  activeStatus,
  lastModifiedDate,
  modifiedBy,
  isSubmitted,
  status
} = schema.tree
const currentData = [],historicalData=[];
const dpCodeId = '';

/**
 * @api {post} /standalone_datapoints Create standalone datapoints
 * @apiName CreateStandaloneDatapoints
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Standalone datapoints's companyId.
 * @apiParam datapointId Standalone datapoints's datapointId.
 * @apiParam performanceResult Standalone datapoints's performanceResult.
 * @apiParam response Standalone datapoints's response.
 * @apiParam year Standalone datapoints's year.
 * @apiParam fiscalYearEndDate Standalone datapoints's fiscalYearEndDate.
 * @apiParam standaloneStatus Standalone datapoints's standaloneStatus.
 * @apiParam taskId Standalone datapoints's taskId.
 * @apiParam submittedBy Standalone datapoints's submittedBy.
 * @apiParam submittedDate Standalone datapoints's submittedDate.
 * @apiParam activeStatus Standalone datapoints's activeStatus.
 * @apiParam lastModifiedDate Standalone datapoints's lastModifiedDate.
 * @apiParam modifiedBy Standalone datapoints's modifiedBy.
 * @apiParam isSubmitted Standalone datapoints's isSubmitted.
 * @apiSuccess {Object} standaloneDatapoints Standalone datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Standalone datapoints not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({
    required: true
  }),
  body({
    companyId,
    datapointId,
    performanceResult,
    response,
    year,
    fiscalYearEndDate,
    standaloneStatus,
    taskId,
    submittedBy,
    submittedDate,
    activeStatus,
    lastModifiedDate,
    modifiedBy,
    isSubmitted
  }),
  create)

/**
 * @api {post} /standalone_datapoints/upload-company-esg Upload Company ESG files
 * @apiName UploadCompanyESGFiles
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} upload company esg files StandaloneDatapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 StandaloneDatapoints not found.
 * @apiError 401 user access only.
 */
router.post('/upload-company-esg',
  token({
    required: false
  }),
  query(),
  uploadCompanyESGFiles)

/**
 * @api {post} /standalone_datapoints/saveDatapointDetails Save DataPoint Details
 * @apiName UploadCompanyESGFiles
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} upload company esg files StandaloneDatapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 StandaloneDatapoints not found.
 * @apiError 401 user access only.
 */
router.post('/saveDatapointDetails',
  token({
    required: true
  }),
  body({companyId,currentData,dpCodeId}),
  dataCollection)

/**
 * @api {get} /standalone_datapoints Retrieve standalone datapoints
 * @apiName RetrieveStandaloneDatapoints
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of standalone datapoints.
 * @apiSuccess {Object[]} rows List of standalone datapoints.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({
    required: true
  }),
  query(),
  index)

/**
 * @api {get} /standalone_datapoints/:id Retrieve standalone datapoints
 * @apiName RetrieveStandaloneDatapoints
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} standaloneDatapoints Standalone datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Standalone datapoints not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({
    required: true
  }),
  show)

/**
 * @api {put} /standalone_datapoints/:id Update standalone datapoints
 * @apiName UpdateStandaloneDatapoints
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Standalone datapoints's companyId.
 * @apiParam datapointId Standalone datapoints's datapointId.
 * @apiParam performanceResult Standalone datapoints's performanceResult.
 * @apiParam response Standalone datapoints's response.
 * @apiParam year Standalone datapoints's year.
 * @apiParam fiscalYearEndDate Standalone datapoints's fiscalYearEndDate.
 * @apiParam standaloneStatus Standalone datapoints's standaloneStatus.
 * @apiParam taskId Standalone datapoints's taskId.
 * @apiParam submittedBy Standalone datapoints's submittedBy.
 * @apiParam submittedDate Standalone datapoints's submittedDate.
 * @apiParam activeStatus Standalone datapoints's activeStatus.
 * @apiParam lastModifiedDate Standalone datapoints's lastModifiedDate.
 * @apiParam modifiedBy Standalone datapoints's modifiedBy.
 * @apiParam isSubmitted Standalone datapoints's isSubmitted.
 * @apiParam status Standalone datapoints's status.
 * @apiSuccess {Object} standaloneDatapoints Standalone datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Standalone datapoints not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({
    required: true
  }),
  body({
    companyId,
    datapointId,
    performanceResult,
    response,
    year,
    fiscalYearEndDate,
    standaloneStatus,
    taskId,
    submittedBy,
    submittedDate,
    activeStatus,
    lastModifiedDate,
    modifiedBy,
    isSubmitted,
    status
  }),
  update)

/**
 * @api {delete} /standalone_datapoints/:id Delete standalone datapoints
 * @apiName DeleteStandaloneDatapoints
 * @apiGroup StandaloneDatapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Standalone datapoints not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({
    required: true
  }),
  destroy)

export default router
