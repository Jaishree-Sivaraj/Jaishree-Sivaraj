import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy,updateEndDate, activeMemberlist, boardMemberNamingCorrections, kmpMemberNamingCorrections } from './controller'
import { schema } from './model'
export Kmp, { schema } from './model'

const router = new Router()
const { companyId, MASP003, startDate, endDate, endDateTimeStamp, dob,MASR008, memberStatus,clientTaxonomyId, status } = schema.tree
let memberName = "", gender = "",kmpMembersToTerminate = [];
/**
 * @api {post} /kmp Create kmp
 * @apiName CreateKmp
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Kmp's companyId.
 * @apiParam MASP003 Kmp's kmpMemberName.
 * @apiParam startDate Kmp's startDate.
 * @apiParam endDate Kmp's endDate.
 * @apiParam endDateTimeStamp Kmp's endDateTimeStamp.
 * @apiParam dob Kmp's dob.
 * @apiParam MASR008 Kmp's gender.
 * @apiSuccess {Object} kmp Kmp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyId,  memberName, startDate, endDate, endDateTimeStamp, dob,gender, memberStatus,clientTaxonomyId}),
  create)
  
/**
 * @api {post} /kmp Create kmp
 * @apiName CreateKmp
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Kmp's companyId.
 * @apiParam MASP003 Kmp's kmpMemberName.
 * @apiParam startDate Kmp's startDate.
 * @apiParam endDate Kmp's endDate.
 * @apiParam endDateTimeStamp Kmp's endDateTimeStamp.
 * @apiParam dob Kmp's dob.
 * @apiParam MASR008 Kmp's gender.
 * @apiSuccess {Object} kmp Kmp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp not found.
 * @apiError 401 user access only.
 */
router.post('/deleteKmpMembers',
token({ required: true }),
body({ companyId, kmpMembersToTerminate , endDate}),
updateEndDate)

/**
 * @api {get} /kmp/activeKmpMembers/:companyId Retrieve kmps
 * @apiName RetrieveKmps
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of kmps.
 * @apiSuccess {Object[]} rows List of kmps.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
 router.get('/activeKmpMembers/:companyId',
 token({ required: true }),
 query(),
 activeMemberlist)

/**
* @api {get} /kmp/correct-naming/board Correct kmps namings
* @apiName CorrectKmpsNamings
* @apiGroup Kmp
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of kmps.
* @apiSuccess {Object[]} rows List of kmps.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/correct-naming/board',
token({ required: true }),
query(),
boardMemberNamingCorrections)

/**
* @api {get} /kmp/correct-naming/kmp Correct kmps namings
* @apiName CorrectKmpsNamings
* @apiGroup Kmp
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of kmps.
* @apiSuccess {Object[]} rows List of kmps.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/correct-naming/kmp',
token({ required: true }),
query(),
kmpMemberNamingCorrections)

/**
 * @api {get} /kmp Retrieve kmps
 * @apiName RetrieveKmps
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of kmps.
 * @apiSuccess {Object[]} rows List of kmps.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /kmp/:id Retrieve kmp
 * @apiName RetrieveKmp
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} kmp Kmp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /kmp/:id Update kmp
 * @apiName UpdateKmp
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Kmp's companyId.
 * @apiParam MASP003 Kmp's kmpMemberName.
 * @apiParam startDate Kmp's startDate.
 * @apiParam endDate Kmp's endDate.
 * @apiParam endDateTimeStamp Kmp's endDateTimeStamp.
 * @apiParam dob Kmp's dob.
 * @apiParam MASR008 Kmp's gender.
 * @apiParam status Kmp's status.
 * @apiSuccess {Object} kmp Kmp's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Kmp not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ companyId,  MASP003, startDate, endDate, endDateTimeStamp, dob,MASR008, memberStatus, status }),
  update)

/**
 * @api {delete} /kmp/:id Delete kmp
 * @apiName DeleteKmp
 * @apiGroup Kmp
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Kmp not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
