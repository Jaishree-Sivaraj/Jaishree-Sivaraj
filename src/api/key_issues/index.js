import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export KeyIssues, { schema } from './model'

const router = new Router()
const { keyIssueName, keyIssueCode, keyIssueDescription, themeId, status } = schema.tree

/**
 * @api {post} /key_issues Create key issues
 * @apiName CreateKeyIssues
 * @apiGroup KeyIssues
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam keyIssueName Key issues's keyIssueName.
 * @apiParam keyIssueCode Key issues's keyIssueCode.
 * @apiParam keyIssueDescription Key issues's keyIssueDescription.
 * @apiParam themeId Key issues's themeId.
 * @apiSuccess {Object} keyIssues Key issues's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Key issues not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ keyIssueName, keyIssueCode, keyIssueDescription, themeId }),
  create)

/**
 * @api {get} /key_issues Retrieve key issues
 * @apiName RetrieveKeyIssues
 * @apiGroup KeyIssues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of key issues.
 * @apiSuccess {Object[]} rows List of key issues.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /key_issues/:id Retrieve key issues
 * @apiName RetrieveKeyIssues
 * @apiGroup KeyIssues
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} keyIssues Key issues's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Key issues not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /key_issues/:id Update key issues
 * @apiName UpdateKeyIssues
 * @apiGroup KeyIssues
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam keyIssueName Key issues's keyIssueName.
 * @apiParam keyIssueCode Key issues's keyIssueCode.
 * @apiParam keyIssueDescription Key issues's keyIssueDescription.
 * @apiParam themeId Key issues's themeId.
 * @apiParam status Key issues's status.
 * @apiSuccess {Object} keyIssues Key issues's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Key issues not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ keyIssueName, keyIssueCode, keyIssueDescription, themeId, status }),
  update)

/**
 * @api {delete} /key_issues/:id Delete key issues
 * @apiName DeleteKeyIssues
 * @apiGroup KeyIssues
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Key issues not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
