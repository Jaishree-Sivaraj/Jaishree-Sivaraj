import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, createClientTaxonomy, updateClientTaxonomy, configureChildFields } from './controller'
import { schema } from './model'
export ClientTaxonomy, { schema } from './model'

const router = new Router()
const { taxonomyName, fields, status, hasChildDp, id, childFields } = schema.tree
const headers = [];

/**
 * @api {post} /clientTaxonomies Create client taxonomy
 * @apiName CreateClientTaxonomy
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomyName Client taxonomy's taxonomyName.
 * @apiParam fields Client taxonomy's fields.
 * @apiSuccess {Object} clientTaxonomy Client taxonomy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client taxonomy not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ taxonomyName, fields }),
  create)

/**
 * @api {post} /clientTaxonomies/create Create client taxonomy from UI
 * @apiName CreateClientTaxonomyFromUI
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomyName Client taxonomy's taxonomyName.
 * @apiParam headers Client taxonomy's headers.
 * @apiSuccess {Object} clientTaxonomy Client taxonomy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client taxonomy not found.
 * @apiError 401 user access only.
 */
router.post('/create',
  token({ required: true }),
  body({ taxonomyName, headers, hasChildDp }),
  createClientTaxonomy)

/**
* @api {post} /clientTaxonomies/configure-child-fields Create client taxonomy
* @apiName CreateClientTaxonomy
* @apiGroup ClientTaxonomy
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam taxonomyName Client taxonomy's taxonomyName.
* @apiParam fields Client taxonomy's fields.
* @apiSuccess {Object} clientTaxonomy Client taxonomy's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Client taxonomy not found.
* @apiError 401 user access only.
*/
router.post('/configure-child-fields',
  token({ required: true }),
  body({ id, childFields }),
  configureChildFields);


/**
 * @api {get} /clientTaxonomies Retrieve client taxonomies
 * @apiName RetrieveClientTaxonomies
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of client taxonomies.
 * @apiSuccess {Object[]} rows List of client taxonomies.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /clientTaxonomies/:id Retrieve client taxonomy
 * @apiName RetrieveClientTaxonomy
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} clientTaxonomy Client taxonomy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client taxonomy not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /clientTaxonomies/:id Update client taxonomy
 * @apiName UpdateClientTaxonomy
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomyName Client taxonomy's taxonomyName.
 * @apiParam fields Client taxonomy's fields.
 * @apiParam status Client taxonomy's status.
 * @apiSuccess {Object} clientTaxonomy Client taxonomy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client taxonomy not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ taxonomyName, fields, status }),
  update)

/**
 * @api {put} /clientTaxonomies/update/:id Update client taxonomy from UI
 * @apiName UpdateClientTaxonomyFromUI
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam taxonomyName Client taxonomy's taxonomyName.
 * @apiParam fields Client taxonomy's fields.
 * @apiParam status Client taxonomy's status.
 * @apiSuccess {Object} clientTaxonomy Client taxonomy's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client taxonomy not found.
 * @apiError 401 user access only.
 */
router.put('/update/:id',
  token({ required: true }),
  body({ taxonomyName, headers, status }),
  updateClientTaxonomy)

/**
 * @api {delete} /clientTaxonomies/:id Delete client taxonomy
 * @apiName DeleteClientTaxonomy
 * @apiGroup ClientTaxonomy
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Client taxonomy not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
