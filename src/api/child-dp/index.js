import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy} from './controller'
import { schema } from './model'
export ChildDp, { schema } from './model'

const router = new Router()
const { companyDataElementLabel, clientTaxonomyId, id, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue, parentDpHeaders } = schema.tree

/**
 * @api {post} /child-dps Create child dp
 * @apiName CreateChildDp
 * @apiGroup ChildDp
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue Child dp's companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue.
 * @apiSuccess {Object} childDp Child dp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Child dp not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue }),
  create);

/**
 * @api {get} /child-dps Retrieve child dps
 * @apiName RetrieveChildDps
 * @apiGroup ChildDp
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of child dps.
 * @apiSuccess {Object[]} rows List of child dps.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /child-dps/:id Retrieve child dp
 * @apiName RetrieveChildDp
 * @apiGroup ChildDp
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} childDp Child dp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Child dp not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /child-dps/:id Update child dp
 * @apiName UpdateChildDp
 * @apiGroup ChildDp
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue Child dp's companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue.
 * @apiSuccess {Object} childDp Child dp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Child dp not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue }),
  update)

/**
 * @api {delete} /child-dps/:id Delete child dp
 * @apiName DeleteChildDp
 * @apiGroup ChildDp
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Child dp not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
