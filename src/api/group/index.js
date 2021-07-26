import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, createGroup, updateGroup, getGroupsOfAnAdmin } from './controller'
import { schema } from './model'
export Group, { schema } from './model'

const router = new Router()
const { groupName, groupAdmin, batchList, assignedMembers, status } = schema.tree
const admin = {}, assignMembers = [], assignBatch = [];
const groupId = '', grpName = '',grpAdmin = {}, grpMembers = [], assignedBatches = [];

/**
 * @api {post} /groups Create group
 * @apiName CreateGroup
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam groupName Group's groupName.
 * @apiParam groupAdmin Group's groupAdmin.
 * @apiParam batchList Group's batchList.
 * @apiParam assignedMembers Group's assignedMembers.
 * @apiSuccess {Object} group Group's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Group not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ groupName, groupAdmin, batchList, assignMembers}),
  create)

/**
 * @api {post} /groups/create Create group from UI
 * @apiName CreateGroupFromUI
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam groupId Group's groupId.
 * @apiParam grpName Group's grpName.
 * @apiParam grpAdmin Group's grpAdmin.
 * @apiParam grpMembers Group's grpMembers.
 * @apiParam assignedBatches Group's assignedBatches.
 * @apiSuccess {Object} group Group's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Group not found.
 * @apiError 401 user access only.
 */
router.post('/create',
  token({ required: true }),
  body({ groupId, grpName,grpAdmin, grpMembers, assignedBatches }),
  createGroup)

/**
 * @api {get} /groups Retrieve groups
 * @apiName RetrieveGroups
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of groups.
 * @apiSuccess {Object[]} rows List of groups.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /groups Retrieve groups
 * @apiName RetrieveGroups
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of groups.
 * @apiSuccess {Object[]} rows List of groups.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/my-groups/:groupAdmin',
  token({ required: true }),
  query(),
  getGroupsOfAnAdmin)

/**
 * @api {get} /groups/:id Retrieve group by id
 * @apiName RetrieveGroupById
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} group Group's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Group not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /groups/:id Update group
 * @apiName UpdateGroup
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam groupName Group's groupName.
 * @apiParam groupAdmin Group's groupAdmin.
 * @apiParam assignedMembers Group's assignedMembers.
 * @apiParam batchList Group's batchList.
 * @apiParam status Group's status.
 * @apiSuccess {Object} group Group's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Group not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ groupName, groupAdmin, batchList, assignedMembers, status }),
  update)

/**
 * @api {put} /groups/update/:id Update group from UI
 * @apiName UpdateGroupFromUI
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam grpName Group's grpName.
 * @apiParam grpAdmin Group's grpAdmin.
 * @apiParam assignedBatches Group's assignedBatches.
 * @apiParam grpMembers Group's grpMembers.
 * @apiParam status Group's status.
 * @apiSuccess {Object} group Group's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Group not found.
 * @apiError 401 user access only.
 */
router.put('/update/:id',
  token({ required: true }),
  body({ grpName, grpAdmin, grpMembers, assignedBatches }),
  updateGroup)

/**
 * @api {delete} /groups/:id Delete group
 * @apiName DeleteGroup
 * @apiGroup Group
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Group not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
