import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, getAllNic, getAllUnAssignedCompanies } from './controller'
import { schema } from './model'
export Companies, { schema } from './model'

const router = new Router()
const { companyName, cin, nicCode, nic, nicIndustry, isinCode, cmieProwessCode, socialAnalystName, socialQAName, isAssignedToBatch, status } = schema.tree

/**
 * @api {post} /companies Create companies
 * @apiName CreateCompanies
 * @apiGroup Companies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyName Companies's companyName.
 * @apiParam cin Companies's cin.
 * @apiParam nicCode Companies's nicCode.
 * @apiParam nic Companies's nic.
 * @apiParam nicIndustry Companies's nicIndustry.
 * @apiParam isinCode Companies's isinCode.
 * @apiParam cmieProwessCode Companies's cmieProwessCode.
 * @apiParam socialAnalystName Companies's socialAnalystName.
 * @apiParam socialQAName Companies's socialQAName.
 * @apiSuccess {Object} companies Companies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Companies not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyName, cin, nicCode, nic, nicIndustry, isinCode, cmieProwessCode, socialAnalystName, socialQAName }),
  create)

/**
 * @api {get} /companies Retrieve companies
 * @apiName RetrieveCompanies
 * @apiGroup Companies
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of companies.
 * @apiSuccess {Object[]} rows List of companies.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: false }),
  query(),
  index)

  /**
 * @api {get} /companies/all_nic Retrieve NIC 
 * @apiName Retrieve NIC
 * @apiGroup Companies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of companies.
 * @apiSuccess {Object[]} rows List of companies.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/all_nic',
token({ required: true }),
query(),
getAllNic)

/**
* @api {get} /companies/all/unassigned Retrieve All unassingned companies 
* @apiName Retrieve All Unassigned Companies
* @apiGroup Companies
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of companies.
* @apiSuccess {Object[]} rows List of companies.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/all/unassigned',
token({ required: true }),
query(),
getAllUnAssignedCompanies)

/**
 * @api {get} /companies/:id Retrieve companies
 * @apiName RetrieveCompanies
 * @apiGroup Companies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} companies Companies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Companies not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /companies/:id Update companies
 * @apiName UpdateCompanies
 * @apiGroup Companies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyName Companies's companyName.
 * @apiParam cin Companies's cin.
 * @apiParam nicCode Companies's nicCode.
 * @apiParam nic Companies's nic.
 * @apiParam nicIndustry Companies's nicIndustry.
 * @apiParam isinCode Companies's isinCode.
 * @apiParam cmieProwessCode Companies's cmieProwessCode.
 * @apiParam socialAnalystName Companies's socialAnalystName.
 * @apiParam socialQAName Companies's socialQAName.
 * @apiParam isAssignedToBatch Companies's isAssignedToBatch.
 * @apiParam status Companies's status.
 * @apiSuccess {Object} companies Companies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Companies not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ companyName, cin, nicCode, nic, nicIndustry, isinCode, cmieProwessCode, socialAnalystName, socialQAName, isAssignedToBatch, status }),
  update)

/**
 * @api {delete} /companies/:id Delete companies
 * @apiName DeleteCompanies
 * @apiGroup Companies
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Companies not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
