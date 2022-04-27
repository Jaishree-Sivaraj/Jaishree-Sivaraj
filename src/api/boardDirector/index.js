import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export BoardDirector, { schema } from './model'

const router = new Router()
const { din, name, gender, companies } = schema.tree

/**
 * @api {post} /boardDirector Create board director
 * @apiName CreateBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam din Board director's din.
 * @apiParam name Board director's name.
 * @apiParam gender Board director's gender.
 * @apiParam companies Board director's companies.
 * @apiSuccess {Object} boardDirector Board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.post('/',
  token({ required: true }),
  body({ din, name, gender, companies }),
  create)

/**
 * @api {get} /boardDirector Retrieve board directors
 * @apiName RetrieveBoardDirectors
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board directors.
 * @apiSuccess {Object[]} rows List of board directors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 master access only.
 */
router.get('/',
  token({ required: true }), 
  query(),
  index)

/**
 * @api {get} /boardDirector/:id Retrieve board director
 * @apiName RetrieveBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiSuccess {Object} boardDirector Board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /boardDirector/:id Update board director
 * @apiName UpdateBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam din Board director's din.
 * @apiParam name Board director's name.
 * @apiParam gender Board director's gender.
 * @apiParam companies Board director's companies.
 * @apiSuccess {Object} boardDirector Board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ din, name, gender, companies }),
  update)

/**
 * @api {delete} /boardDirector/:id Delete board director
 * @apiName DeleteBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
