import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export ClientRepresentatives, { schema } from './model'

const router = new Router()
const { userId, name, companiesList, authenticationLetterForClientUrl, companyIdForClient, status } = schema.tree

/**
 * @api {post} /client-representatives Create client representatives
 * @apiName CreateClientRepresentatives
 * @apiGroup ClientRepresentatives
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam userId Client representatives's userId.
 * @apiParam name Client representatives's name.
 * @apiParam companiesList Client representatives's companiesList.
 * @apiParam authenticationLetterForClientUrl Client representatives's authenticationLetterForClientUrl.
 * @apiParam companyIdForClient Client representatives's companyIdForClient.
 * @apiParam status Client representatives's status.
 * @apiSuccess {Object} clientRepresentatives Client representatives's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client representatives not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ userId, name, companiesList, authenticationLetterForClientUrl, companyIdForClient, status }),
  create)

/**
 * @api {get} /client-representatives Retrieve client representatives
 * @apiName RetrieveClientRepresentatives
 * @apiGroup ClientRepresentatives
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of client representatives.
 * @apiSuccess {Object[]} rows List of client representatives.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /client-representatives/:id Retrieve client representatives
 * @apiName RetrieveClientRepresentatives
 * @apiGroup ClientRepresentatives
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} clientRepresentatives Client representatives's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client representatives not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /client-representatives/:id Update client representatives
 * @apiName UpdateClientRepresentatives
 * @apiGroup ClientRepresentatives
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam userId Client representatives's userId.
 * @apiParam name Client representatives's name.
 * @apiParam companiesList Client representatives's companiesList.
 * @apiParam authenticationLetterForClientUrl Client representatives's authenticationLetterForClientUrl.
 * @apiParam companyIdForClient Client representatives's companyIdForClient.
 * @apiParam status Client representatives's status.
 * @apiSuccess {Object} clientRepresentatives Client representatives's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Client representatives not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ userId, name, companiesList, authenticationLetterForClientUrl, companyIdForClient, status }),
  update)

/**
 * @api {delete} /client-representatives/:id Delete client representatives
 * @apiName DeleteClientRepresentatives
 * @apiGroup ClientRepresentatives
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Client representatives not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
