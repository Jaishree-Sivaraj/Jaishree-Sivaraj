import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Themes, { schema } from './model'

const router = new Router()
const { themeName, themeCode, themeDescription, categoryId, status } = schema.tree

/**
 * @api {post} /themes Create themes
 * @apiName CreateThemes
 * @apiGroup Themes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam themeName Themes's themeName.
 * @apiParam themeCode Themes's themeCode.
 * @apiParam themeDescription Themes's themeDescription.
 * @apiParam categoryId Themes's categoryId.
 * @apiSuccess {Object} themes Themes's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Themes not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ themeName, themeCode, themeDescription, categoryId }),
  create)

/**
 * @api {get} /themes Retrieve themes
 * @apiName RetrieveThemes
 * @apiGroup Themes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of themes.
 * @apiSuccess {Object[]} rows List of themes.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /themes/:id Retrieve themes
 * @apiName RetrieveThemes
 * @apiGroup Themes
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} themes Themes's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Themes not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /themes/:id Update themes
 * @apiName UpdateThemes
 * @apiGroup Themes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam themeName Themes's themeName.
 * @apiParam themeCode Themes's themeCode.
 * @apiParam themeDescription Themes's themeDescription.
 * @apiParam categoryId Themes's categoryId.
 * @apiParam status Themes's status.
 * @apiSuccess {Object} themes Themes's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Themes not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ themeName, themeCode, themeDescription, categoryId, status }),
  update)

/**
 * @api {delete} /themes/:id Delete themes
 * @apiName DeleteThemes
 * @apiGroup Themes
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Themes not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
