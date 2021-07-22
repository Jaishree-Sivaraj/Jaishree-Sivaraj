import multer from 'multer'
import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, includePolarityFromJson, includeCategoryIdsFromJson, includeExtraKeysFromJson, getCategorywiseDatapoints, uploadTaxonomyDatapoints, datapointDetails } from './controller'
import { schema } from './model'
export Datapoints, { schema } from './model'

const router = new Router()
const { clientTaxonomyId, categoryId, name, code, description, polarity, dataCollection, dataCollectionGuide, normalizedBy, weighted, relevantForIndia, standaloneOrMatrix, reference, industryRelevant, unit, signal, percentile, finalUnit, keyIssueId, functionId, dpType, dpStatus, status } = schema.tree
const taskId = '',year = '', datapointId = '', memberType = '', memberName = '';
/**
 * @api {post} /datapoints Create datapoints
 * @apiName CreateDatapoints
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam categoryId Datapoints's categoryId.
 * @apiParam name Datapoints's name.
 * @apiParam code Datapoints's code.
 * @apiParam description Datapoints's description.
 * @apiParam polarity Datapoints's polarity.
 * @apiParam dataCollection Datapoints's dataCollection.
 * @apiParam dataCollectionGuide Datapoints's dataCollectionGuide.
 * @apiParam normalizedBy Datapoints's normalizedBy.
 * @apiParam weighted Datapoints's weighted.
 * @apiParam relevantForIndia Datapoints's relevantForIndia.
 * @apiParam standaloneOrMatrix Datapoints's standaloneOrMatrix.
 * @apiParam reference Datapoints's reference.
 * @apiParam industryRelevant Datapoints's industryRelevant.
 * @apiParam unit Datapoints's unit.
 * @apiParam signal Datapoints's signal.
 * @apiParam percentile Datapoints's percentile.
 * @apiParam finalUnit Datapoints's finalUnit.
 * @apiParam keyIssueId Datapoints's keyIssueId.
 * @apiParam functionId Datapoints's functionId.
 * @apiParam dpType Datapoints's dpType.
 * @apiSuccess {Object} datapoints Datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Datapoints not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ categoryId, name, code, description, polarity, dataCollection, dataCollectionGuide, normalizedBy, weighted, relevantForIndia, standaloneOrMatrix, reference, industryRelevant, unit, signal, percentile, finalUnit, keyIssueId, functionId, dpType, dpStatus }),
  create)

var storage = multer.diskStorage({ //multers disk storage settings
  destination: function(req, file, cb) {
      cb(null, __dirname.replace('routes', '') + '/uploads');
  },
  filename: function(req, file, cb) {
      var datetimestamp = Date.now();
      cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
  }
});
var uploadDatapoints = multer({ //multer settings
  storage: storage,
  fileFilter: function(req, file, callback) { //file filter
    if (['xls', 'xlsx', 'xlsm'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
      return callback(new Error('Wrong extension type'));
    }
    callback(null, true);
  }
});

/**
 * @api {post} /datapoints/upload Upload datapoints for a taxonomy
 * @apiName UploadDatapointsOfATaxonomy
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} datapoints Datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Datapoints not found.
 * @apiError 401 user access only.
 */
router.post('/upload',
  token({ required: true }),
  uploadDatapoints.single('file'),
  uploadTaxonomyDatapoints)

/**
 * @api {get} /datapoints Retrieve datapoints
 * @apiName RetrieveDatapoints
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of datapoints.
 * @apiSuccess {Object[]} rows List of datapoints.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
* @api {get} /datapoints/addExtraKeys/:clientTaxonomyId Add extraKeys for datapoints
* @apiName AddExtraKeysForAllDatapoints
* @apiGroup Datapoints
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiSuccess {Object} datapoints Datapoints's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Datapoints not found.
* @apiError 401 user access only.
*/

router.get('/addExtraKeys/:clientTaxonomyId',
  token({ required: true }),
  includeExtraKeysFromJson)

/**
 * @api {get} /datapoints/:id Retrieve datapoints
 * @apiName RetrieveDatapoints
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} datapoints Datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Datapoints not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /datapoints/import-from-json/polarity Add polarity for datapoints
 * @apiName AddPolarityForAllDatapoints
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} datapoints Datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Datapoints not found.
 * @apiError 401 user access only.
 */
router.get('/import-from-json/polarity',
  token({ required: true }),
  includePolarityFromJson)

/**
* @api {get} /datapoints/import-from-json/categoryId Add categoryId for datapoints
* @apiName AddCategoryIdForAllDatapoints
* @apiGroup Datapoints
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiSuccess {Object} datapoints Datapoints's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Datapoints not found.
* @apiError 401 user access only.
*/
router.get('/import-from-json/categoryId',
  token({ required: true }),
  includeCategoryIdsFromJson)

/**
* @api {get} /datapoints/list/:taskId Get categorywise datapoints
* @apiName GetCategorywiseDatapoints
* @apiGroup Datapoints
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiSuccess {Object} datapoints Datapoints's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Datapoints not found.
* @apiError 401 user access only.
*/
router.get('/list/:taskId',
  token({ required: true }),
  getCategorywiseDatapoints)

  /**
  * @api {post} /datapoints/dpDetails Get datapoints details
  * @apiName datapointDetails
  * @apiGroup Datapoints
  * @apiPermission user
  * @apiParam {String} access_token user access token.
  * @apiSuccess {Object} datapoints Datapoints's data.
  * @apiError {Object} 400 Some parameters may contain invalid values.
  * @apiError 404 Datapoints not found.
  * @apiError 401 user access only.
  */
  router.post('/dpDetails',
    token({ required: true }),
    body({ taskId, datapointId, memberType, memberName }),
    datapointDetails)


/**
 * @api {put} /datapoints/:id Update datapoints
 * @apiName UpdateDatapoints
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam categoryId Datapoints's categoryId.
 * @apiParam name Datapoints's name.
 * @apiParam code Datapoints's code.
 * @apiParam description Datapoints's description.
 * @apiParam dataCollection Datapoints's dataCollection.
 * @apiParam polarity Datapoints's polarity.
 * @apiParam dataCollectionGuide Datapoints's dataCollectionGuide.
 * @apiParam normalizedBy Datapoints's normalizedBy.
 * @apiParam weighted Datapoints's weighted.
 * @apiParam relevantForIndia Datapoints's relevantForIndia.
 * @apiParam standaloneOrMatrix Datapoints's standaloneOrMatrix.
 * @apiParam reference Datapoints's reference.
 * @apiParam industryRelevant Datapoints's industryRelevant.
 * @apiParam unit Datapoints's unit.
 * @apiParam signal Datapoints's signal.
 * @apiParam percentile Datapoints's percentile.
 * @apiParam finalUnit Datapoints's finalUnit.
 * @apiParam keyIssueId Datapoints's keyIssueId.
 * @apiParam functionId Datapoints's functionId.
 * @apiParam dpType Datapoints's dpType.
 * @apiParam dpStatus Datapoints's dpStatus.
 * @apiParam status Datapoints's status.
 * @apiSuccess {Object} datapoints Datapoints's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Datapoints not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ categoryId, name, code, description, polarity, dataCollection, dataCollectionGuide, normalizedBy, weighted, relevantForIndia, standaloneOrMatrix, reference, industryRelevant, unit, signal, percentile, finalUnit, keyIssueId, functionId, dpType, dpStatus, status }),
  update)

/**
 * @api {delete} /datapoints/:id Delete datapoints
 * @apiName DeleteDatapoints
 * @apiGroup Datapoints
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Datapoints not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)


export default router
