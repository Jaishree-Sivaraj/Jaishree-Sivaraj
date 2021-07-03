import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token, master } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Role, { schema } from './model'

const router = new Router()
const { roleName, roleCode, status } = schema.tree

/**
 * @api {post} /role Create role
 * @apiName CreateRole
 * @apiGroup Role
 * @apiParam roleName Role's roleName.
 * @apiParam roleCode Role's roleCode.
 * @apiSuccess {Object} role Role's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Role not found.
 * @apiError 401 master access only.
 */
router.post('/',
  body({ roleName, roleCode }),
  create)

/**
 * @api {get} /role Retrieve roles
 * @apiName RetrieveRoles
 * @apiGroup Role
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of roles.
 * @apiSuccess {Object[]} rows List of roles.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: false }),
  query(),
  index)

/**
 * @api {get} /role/:id Retrieve role
 * @apiName RetrieveRole
 * @apiGroup Role
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} role Role's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Role not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /role/:id Update role
 * @apiName UpdateRole
 * @apiGroup Role
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam roleName Role's roleName.
 * @apiParam roleCode Role's roleCode.
 * @apiParam status Role's status.
 * @apiSuccess {Object} role Role's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Role not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ roleName, roleCode, status }),
  update)

/**
 * @api {delete} /role/:id Delete role
 * @apiName DeleteRole
 * @apiGroup Role
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Role not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
