import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, activeMemberlist, updateEndDate, getDistinctBoardMembersCompanywise, getDistinctKmpMembersCompanywise } from './controller'
import { schema } from './model'
export BoardMembers, { schema } from './model'

const router = new Router()
const { companyId, clientTaxonomyId, BOSP004, startDate, endDate, endDateTimeStamp, dob, BODR005, BODP001, BOSP005, BOSP006, memberStatus, status } = schema.tree
let memberName = "", nationality = "", gender = "", industrialExp = "", financialExp = "", boardMembersToTerminate =[];
/**
 * @api {post} /boardMembers Create board members
 * @apiName CreateBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Board members's companyId.
 * @apiParam memberName Board members's name.
 * @apiParam startDate Board members's startDate.
 * @apiParam dob Board members's dob.
 * @apiParam gender Board members's Gender.
 * @apiParam nationality Board members's Nationality.
 * @apiParam industrialExp Board members's IndustryExperience.
 * @apiParam financialExp Board members's FinanicialExpertise.
 * @apiParam endDateTimeStamp EndDate TimeStamp
 * @apiSuccess {Object} boardMembers Board members's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyId, memberName, startDate, endDate, endDateTimeStamp, dob, gender, nationality, financialExp, industrialExp, clientTaxonomyId }),
  create)

/**
 * @api {get} /boardMembers Retrieve board members
 * @apiName RetrieveBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board members.
 * @apiSuccess {Object[]} rows List of board members.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {post} /boardMembers/deleteBoardMember Retrieve board members
 * @apiName RetrieveBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board members.
 * @apiSuccess {Object[]} rows List of board members.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.post('/deleteBoardMember',
token({ required: true }),
body({ companyId, boardMembersToTerminate, endDate}),
updateEndDate)

/**
 * @api {get} /boardMembers/activeBoardMembers/:companyId Retrieve board members
 * @apiName RetrieveBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} boardMembers Board members's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
 router.get('/activeBoardMembers/:companyId',
 token({ required: true }),
 activeMemberlist)

/**
 * @api {get} /boardMembers/:id Retrieve board members
 * @apiName RetrieveBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} boardMembers Board members's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {get} /boardMembers/all/board-members/allyears Retrieve All board members
 * @apiName RetrieveAllBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} boardMembers Board members's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
  router.get('/all/board-members/allyears',
  token({ required: true }),
  getDistinctBoardMembersCompanywise)

/**
 * @api {get} /boardMembers/all/kmp-members/allyears Retrieve All kmp members
 * @apiName RetrieveAllKmpMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} boardMembers Board members's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
  router.get('/all/kmp-members/allyears',
  token({ required: true }),
  getDistinctKmpMembersCompanywise)

/**
 * @api {put} /boardMembers/:id Update board members
 * @apiName UpdateBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Board members's companyId.
 * @apiParam BOSP004 Board members's name.
 * @apiParam startDate Board members's startDate.
 * @apiParam dob Board members's dob.
 * @apiParam BODR005 Board members's Gender.
 * @apiParam BODP001 Board members's Nationality.
 * @apiParam BOSP005 Board members's IndustryExperience.
 * @apiParam BOSP006 Board members's FinanicialExpertise.
 * @apiParam endDateTimeStamp EndDate TimeStamp
 * @apiSuccess {Object} boardMembers Board members's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ companyId, BOSP004, startDate, endDate, endDateTimeStamp, dob, BODR005, BODP001, BOSP005, BOSP006, memberStatus, status }),
  update)

/**
 * @api {delete} /boardMembers/:id Delete board members
 * @apiName DeleteBoardMembers
 * @apiGroup BoardMembers
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Board members not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
