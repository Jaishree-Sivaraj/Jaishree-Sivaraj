import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, getTexonomy, show, update, destroy } from './controller'
import { schema } from './model'
export ClientMaster, { schema } from './model'

const router = new Router()
const { clientId, clientName, taxonomy, companyList, country } = schema.tree

/**
 * @api {post} /client-masters Create client master
 * @apiName CreateClientMaster
 * @apiGroup ClientMaster
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam clientId Client master's clientId.
 * @apiParam clientName Client master's clientName.
 * @apiParam taxonomy Client master's taxonomy.
 * @apiParam companyList Client master's companyList.
 * @apiParam country Client master's country.
 * @apiSuccess {Object} clientMaster Client master's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client master not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true, roles: ['admin'] }),
  body({ clientId, clientName, taxonomy, companyList, country }),
  create)

/**
 * @api {get} /client-masters Retrieve client masters
 * @apiName RetrieveClientMasters
 * @apiGroup ClientMaster
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of client masters.
 * @apiSuccess {Object[]} rows List of client masters.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/company-list/:taxonomyId',
  token({ required: true, roles: ['admin'] }),
  query(),
  index)

  /**
 * @api {get} /client-masters Retrieve client masters
 * @apiName RetrieveClientMasters
 * @apiGroup ClientMaster
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of client masters.
 * @apiSuccess {Object[]} rows List of client masters.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/taxonomy-list',
token({ required: true, roles: ['admin'] }),
query(),
getTexonomy)


/**
 * @api {get} /client-masters/:id Retrieve client master
 * @apiName RetrieveClientMaster
 * @apiGroup ClientMaster
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} clientMaster Client master's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client master not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true, roles: ['admin'] }),
  show)

/**
 * @api {put} /client-masters/:id Update client master
 * @apiName UpdateClientMaster
 * @apiGroup ClientMaster
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam clientId Client master's clientId.
 * @apiParam clientName Client master's clientName.
 * @apiParam taxonomy Client master's taxonomy.
 * @apiParam companyList Client master's companyList.
 * @apiParam country Client master's country.
 * @apiSuccess {Object} clientMaster Client master's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client master not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true, roles: ['admin'] }),
  body({ clientId, clientName, taxonomy, companyList, country }),
  update)

/**
 * @api {delete} /client-masters/:id Delete client master
 * @apiName DeleteClientMaster
 * @apiGroup ClientMaster
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Client master not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true, roles: ['admin'] }),
  destroy)

export default router
