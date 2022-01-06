import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Comments, { schema } from './model'

const router = new Router()
const { userId, name, description } = schema.tree

/**
 * @api {post} /comments Create comments
 * @apiName CreateComments
 * @apiGroup Comments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam userId Comments's userId.
 * @apiParam name Comments's name.
 * @apiParam description Comments's description.
 * @apiSuccess {Object} comments Comments's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Comments not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ userId, name, description }),
  create)

/**
 * @api {get} /comments Retrieve comments
 * @apiName RetrieveComments
 * @apiGroup Comments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of comments.
 * @apiSuccess {Object[]} rows List of comments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /comments/:id Retrieve comments
 * @apiName RetrieveComments
 * @apiGroup Comments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} comments Comments's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Comments not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /comments/:id Update comments
 * @apiName UpdateComments
 * @apiGroup Comments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam userId Comments's userId.
 * @apiParam name Comments's name.
 * @apiParam description Comments's description.
 * @apiSuccess {Object} comments Comments's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Comments not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ userId, name, description }),
  update)

/**
 * @api {delete} /comments/:id Delete comments
 * @apiName DeleteComments
 * @apiGroup Comments
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Comments not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
