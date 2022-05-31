import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export MasterCompanies, { schema } from './model'

const router = new Router()
const { createdBy, companyName, cin, nicCode, nic, nicIndustry, isinCode, cmieProwessCode, socialAnalystName, socialQAName, companyMemberDetails, fiscalYearEndDate, fiscalYearEndMonth, isAssignedToBatch, status } = schema.tree
const companyId = '', name = '', years = [], memberType = '';

/**
 * @api {post} /mastercompanies Create master companies
 * @apiName CreateMasterCompanies
 * @apiGroup MasterCompanies
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam createdBy Master companies's createdBy.
 * @apiParam companyName Master companies's companyName.
 * @apiParam cin Master companies's cin.
 * @apiParam nicCode Master companies's nicCode.
 * @apiParam nic Master companies's nic.
 * @apiParam nicIndustry Master companies's nicIndustry.
 * @apiParam isinCode Master companies's isinCode.
 * @apiParam cmieProwessCode Master companies's cmieProwessCode.
 * @apiParam socialAnalystName Master companies's socialAnalystName.
 * @apiParam socialQAName Master companies's socialQAName.
 * @apiParam companyMemberDetails Master companies's companyMemberDetails.
 * @apiParam fiscalYearEndDate Master companies's fiscalYearEndDate.
 * @apiParam fiscalYearEndMonth Master companies's fiscalYearEndMonth.
 * @apiParam isAssignedToBatch Master companies's isAssignedToBatch.
 * @apiParam status Master companies's status.
 * @apiSuccess {Object} masterCompanies Master companies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Master companies not found.
 * @apiError 401 admin access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyName, cin, nicCode, nic, nicIndustry, isinCode, cmieProwessCode }),
  create)

/**
 * @api {get} /mastercompanies Retrieve master companies
 * @apiName RetrieveMasterCompanies
 * @apiGroup MasterCompanies
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of master companies.
 * @apiSuccess {Object[]} rows List of master companies.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 admin access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /mastercompanies/:id Retrieve master companies
 * @apiName RetrieveMasterCompanies
 * @apiGroup MasterCompanies
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess {Object} masterCompanies Master companies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Master companies not found.
 * @apiError 401 admin access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

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
  // router.get('/all_nic',
  // token({ required: true }),
  // query(),
  // getAllNic) 

/**
 * @api {put} /mastercompanies/:id Update master companies
 * @apiName UpdateMasterCompanies
 * @apiGroup MasterCompanies
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiParam createdBy Master companies's createdBy.
 * @apiParam companyName Master companies's companyName.
 * @apiParam cin Master companies's cin.
 * @apiParam nicCode Master companies's nicCode.
 * @apiParam nic Master companies's nic.
 * @apiParam nicIndustry Master companies's nicIndustry.
 * @apiParam isinCode Master companies's isinCode.
 * @apiParam cmieProwessCode Master companies's cmieProwessCode.
 * @apiParam socialAnalystName Master companies's socialAnalystName.
 * @apiParam socialQAName Master companies's socialQAName.
 * @apiParam companyMemberDetails Master companies's companyMemberDetails.
 * @apiParam fiscalYearEndDate Master companies's fiscalYearEndDate.
 * @apiParam fiscalYearEndMonth Master companies's fiscalYearEndMonth.
 * @apiParam isAssignedToBatch Master companies's isAssignedToBatch.
 * @apiParam status Master companies's status.
 * @apiSuccess {Object} masterCompanies Master companies's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Master companies not found.
 * @apiError 401 admin access only.
 */
router.put('/:id',
  token({ required: true }),
  body({companyName, cin, nicCode, nic, nicIndustry, isinCode, cmieProwessCode, companyMemberDetails, fiscalYearEndDate, fiscalYearEndMonth, isAssignedToBatch, status }),
  update)


/**
 * @api {delete} /mastercompanies/:id Delete master companies
 * @apiName DeleteMasterCompanies
 * @apiGroup MasterCompanies
 * @apiPermission admin
 * @apiParam {String} access_token admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Master companies not found.
 * @apiError 401 admin access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
