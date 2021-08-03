import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, addExtraKeys } from './controller'
import { schema } from './model'
export Rules, { schema } from './model'

const router = new Router()
const { methodName, methodType, criteria, parameter, dpCode, datapointId, categoryId, aidDPLogic, status } = schema.tree

/**
 * @api {post} /rules Create rules
 * @apiName CreateRules
 * @apiGroup Rules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam methodName Rules's methodName.
 * @apiParam methodType Rules's methodType.
 * @apiParam criteria Rules's criteria.
 * @apiParam parameter Rules's parameter.
 * @apiParam dpCode Rules's dpCode.
 * @apiParam datapointId Rules's datapointId.
 * @apiParam categoryId Rules's categoryId.
 * @apiParam aidDPLogic Rules's aidDPLogic.
 * @apiSuccess {Object} rules Rules's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Rules not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ methodName, methodType, criteria, parameter, dpCode, datapointId, categoryId, aidDPLogic }),
  create)

/**
 * @api {get} /rules Retrieve rules
 * @apiName RetrieveRules
 * @apiGroup Rules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of rules.
 * @apiSuccess {Object[]} rows List of rules.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /rules/:id Retrieve rules
 * @apiName RetrieveRules
 * @apiGroup Rules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} rules Rules's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Rules not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /rules/add/extra-keys Add extra-keys for rules
 * @apiName AddExtraKeysForRules
 * @apiGroup Rules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of rules.
 * @apiSuccess {Object[]} rows List of rules.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/add/extra-keys',
  token({ required: true }),
  query(),
  addExtraKeys)

/**
 * @api {put} /rules/:id Update rules
 * @apiName UpdateRules
 * @apiGroup Rules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam methodName Rules's methodName.
 * @apiParam methodType Rules's methodType.
 * @apiParam criteria Rules's criteria.
 * @apiParam parameter Rules's parameter.
 * @apiParam dpCode Rules's dpCode.
 * @apiParam datapointId Rules's datapointId.
 * @apiParam categoryId Rules's categoryId.
 * @apiParam aidDPLogic Rules's aidDPLogic.
 * @apiParam status Rules's status.
 * @apiSuccess {Object} rules Rules's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Rules not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ methodName, methodType, criteria, parameter, dpCode, datapointId, categoryId, aidDPLogic, status }),
  update)

/**
 * @api {delete} /rules/:id Delete rules
 * @apiName DeleteRules
 * @apiGroup Rules
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Rules not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
