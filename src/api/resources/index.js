import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body  } from 'bodymen'
import { token, master } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import {schema } from './model'
export Resources, { schema } from './model'

const router = new Router()
const {name,file,accessibleFor,status}=schema.tree

/**
 * @api {post} /resources Create resources
 * @apiName CreateResources
 * @apiGroup Resources
 * @apiSuccess {Object} resources Resources's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Resources not found.
 */
router.post('/',
body({name,file,accessibleFor}),
  token({required:true}),
  create)

/**
 * @api {get} /resources Retrieve resources
 * @apiName RetrieveResources
 * @apiGroup Resources
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of resources.
 * @apiSuccess {Object[]} rows List of resources.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('/',
  query(),
  token({required:true}),
  index)

/**
 * @api {get} /resources/:id Retrieve resources
 * @apiName RetrieveResources
 * @apiGroup Resources
 * @apiSuccess {Object} resources Resources's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Resources not found.
 */
router.get('/:id',
token({required:true}),
  show)

/**
 * @api {put} /resources/:id Update resources
 * @apiName UpdateResources
 * @apiGroup Resources
 * @apiSuccess {Object} resources Resources's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Resources not found.
 */
router.put('/:id',
token({required:true}),
body({name,file,accessibleFor}),
  update)

/**
 * @api {delete} /resources/:id Delete resources
 * @apiName DeleteResources
 * @apiGroup Resources
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Resources not found.
 */
router.delete('/:id',
token({required:true}),
  destroy)

export default router
