import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export SourceTypes, { schema } from './model'

const router = new Router()
const { typeName, isMultiYear, isMultiSource } = schema.tree

/**
 * @api {post} /sourceTypes Create source types
 * @apiName CreateSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam typeName Source types's typeName.
 * @apiParam typeName Source types's sourceSubTypeId.
 * @apiParam isMultiYear Source types's isMultiYear.
 * @apiParam isMultiSource Source types's isMultiSource.
 * @apiSuccess {Object} sourceTypes Source types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source types not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ typeName, isMultiYear, isMultiSource }),
  create)

/**
 * @api {get} /sourceTypes Retrieve source types
 * @apiName RetrieveSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of source types.
 * @apiSuccess {Object[]} rows List of source types.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /sourceTypes/:id Retrieve source types
 * @apiName RetrieveSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} sourceTypes Source types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source types not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /sourceTypes/:id Update source types
 * @apiName UpdateSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam typeName Source types's typeName.
 * @apiParam typeName Source types's sourceSubTypeId.
 * @apiParam isMultiYear Source types's isMultiYear.
 * @apiParam isMultiSource Source types's isMultiSource.
 * @apiSuccess {Object} sourceTypes Source types's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Source types not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ typeName, isMultiYear, isMultiSource }),
  update)

/**
 * @api {delete} /sourceTypes/:id Delete source types
 * @apiName DeleteSourceTypes
 * @apiGroup SourceTypes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Source types not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
