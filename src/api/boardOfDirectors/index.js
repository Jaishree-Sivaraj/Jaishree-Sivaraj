import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { index, createDirector, updateDirector, searchDirector, getDirector  } from './controller'
import { schema } from './model'
export BoardOfDirectors, { schema } from './model'

const router = new Router()
const { din, name, gender, companies } = schema.tree

/**
 * @api {post} /boardOfDirector Create board of director
 * @apiName CreateBoardOfDirector
 * @apiGroup BoardOfDirector
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam din Board Of Director BoardOfDirectorDin.
 * @apiParam name Board Of Director BoardOfDirectorName.
 * @apiParam gender Board Of Director BoardOfDirectorGender.
 * @apiParam companies Board Of Director BoardOfDirectorCompanies.
 * @apiSuccess {Object} boardofdirector Board Of Director data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board Of Director not found.
 * @apiError 401 user access only.
 */
router.post('/create/director',
  token({ required: true }),
  body({ din, name, gender, companies}),
  createDirector)

  /**
 * @api {get} /boardOfDirector Retrieve directors
 * @apiName RetrieveBoardOfDirectors
 * @apiGroup BoardOfDirectors
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board directors.
 * @apiSuccess {Object[]} rows List of board directors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
token({ required: true }),
query(),
index)


/**
 * @api {get} /boardOfDirector/:id Retrieve board directors
 * @apiName RetrieveBoardOfDirector
 * @apiGroup BoardOfDirector
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} BoardOfDirector Board Director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
 router.get('/:id',
  token({ required: true }),
  getDirector)

export default router
