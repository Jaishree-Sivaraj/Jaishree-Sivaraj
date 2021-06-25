import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { password as passwordAuth, master, token } from '../../services/passport'
import { index, showMe, show, create, update, updatePassword, destroy, onBoardNewUser, getUsersApprovals, updateUserStatus, updateUserRoles, assignRole, uploadEmailsFile, getAllUsersToAssignRoles, sendMultipleOnBoardingLinks, genericFilterUser } from './controller'
import { schema } from './model'
export User, { schema } from './model'

const router = new Router()
const { email, password, name, picture, role, roleId, otp, phoneNumber, comments, isUserApproved, status, userType } = schema.tree
const onBoardingDetails = '', userId = '', companyId = '', companiesList = '', firstName = '', middleName = '', lastName = '', panNumber = '', aadhaarNumber = '', bankAccountNumber = '', bankIFSCCode = '', accountHolderName = '', pancardUrl = '', aadhaarUrl = '', cancelledChequeUrl = '', authenticationLetterForClientUrl = '', companyIdForClient = '', authenticationLetterForCompanyUrl = '', companyIdForCompany = '', roleDetails = [], userDetails = {}, emailList = [], filterWith = '', value = '', filters = [];
/**
 * @api {get} /users Retrieve users
 * @apiName RetrieveUsers
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiUse listParams
 * @apiSuccess {Object[]} users List of users.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /users/getRoleUser Retrieve User by roles
 * @apiName Retrieve UserByRoles
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiSuccess {Object} user User's data.
 */

// router.get('/getRoleUser',
//   token({ required: true }),
//   getRoleUser)
/**
* @api {get} /users/assign-role to get
* @apiName assign-role
* @apiGroup User
* @apiPermission user
* @apiParam {String} access_token User access_token.
* @apiParam {String} [_id] User's userId.
* @apiParam {Boolean} [isUserApproved] User's isUserApproved.
* @apiParam {String} [comments] User's comments.
* @apiSuccess {Object} user User's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 Current user or admin access only.
* @apiError 404 User not found.
*/
router.get('/assign-role',
  token({ required: true }),
  query(),
  getAllUsersToAssignRoles)

/**
 * @api {get} /users/approvals/:isUserApproved Retrieve users approvals
 * @apiName RetrieveUsersApprovals
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiUse listParams
 * @apiSuccess {Object[]} users List of users.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/approvals/:isUserApproved',
  token({ required: true }),
  query(),
  getUsersApprovals)

/**
 * @api {get} /users/me Retrieve current user
 * @apiName RetrieveCurrentUser
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiSuccess {Object} user User's data.
 */
router.get('/me',
  token({ required: true }),
  showMe)

/**
 * @api {get} /users/:id Retrieve user
 * @apiName RetrieveUser
 * @apiGroup User
 * @apiPermission public
 * @apiSuccess {Object} user User's data.
 * @apiError 404 User not found.
 */
router.get('/:id',
  show)

/**
 * @api {post} /users Create user
 * @apiName CreateUser
 * @apiGroup User
 * @apiParam {String} email User's email.
 * @apiParam {String{6..}} password User's password.
 * @apiParam {String} [name] User's name.
 * @apiParam {String} [picture] User Type.
 * @apiSuccess (Sucess 201) {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Master access only.
 * @apiError 409 Email already registered.
 */
router.post('/',
  body({ email, password, name, userType, phoneNumber }),
  create)

/**
 * @api {post} /users/new-onboard Onboard new user
 * @apiName OnboardNewUser
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiParam {String} email User's email.
 * @apiParam {String{6..}} password User's password.
 * @apiParam {String} [name] User's name.
 * @apiParam {String} [picture] User's picture.
 * @apiParam {String} [roleId] User's roleId.
 * @apiParam {String=user,admin} [role=user] User's role.
 * @apiSuccess (Sucess 201) {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 User access only.
 * @apiError 409 Email already registered.
 */
router.post('/new-onboard',
  token({ required: true }),
  body({ onBoardingDetails }),
  onBoardNewUser)

/**
* @api {post} /users/new-onboard/send-mails send onboarding links
* @apiName SendOnBoardingLinks
* @apiGroup User
* @apiParam {Array} emailList User's emailList.
* @apiSuccess (Sucess 201) {Object} user User's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 User access only.
* @apiError 409 Email already registered.
*/
router.post('/new-onboard/send-mails',
  token({ required: true }),
  body({ emailList }),
  sendMultipleOnBoardingLinks)


/**
* @api {post} /users/filter-user user filter
* @apiName filterUser
* @apiGroup User
* @apiParam {Array} filters User's emailList.
* @apiSuccess (Sucess 201) {Object} user User's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 User access only.
* @apiError 409 Email already registered.
*/
router.post('/filter-user',
  token({ required: true }),
  body({ filters }),
  genericFilterUser
)

/**
 * @api {put} /users/update-status Update user status
 * @apiName UpdateUserStatus
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiParam {String} [_id] User's userId.
 * @apiParam {Boolean} [isUserApproved] User's isUserApproved.
 * @apiParam {String} [comments] User's comments.
 * @apiSuccess {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user or admin access only.
 * @apiError 404 User not found.
 */
router.put('/update-status',
  token({ required: true }),
  body({ userId, isUserApproved, comments }),
  updateUserStatus)

/**
* @api {put} /users/assign-role to update role for user
* @apiName assign-role
* @apiGroup User
* @apiPermission user
* @apiParam {String} access_token User access_token.
* @apiParam {String} [_id] User's userId.
* @apiParam {Boolean} [isUserApproved] User's isUserApproved.
* @apiParam {String} [comments] User's comments.
* @apiSuccess {Object} user User's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 Current user or admin access only.
* @apiError 404 User not found.
*/
router.put('/assign-role',
  token({ required: true }),
  body({ userDetails, roleDetails }),
  assignRole)

/**
 * @api {put} /users/update/roles Update user roles
 * @apiName UpdateUserRoles
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiParam {String} [_id] User's userId.
 * @apiParam {Boolean} roleDetails User's roleDetails.
 * @apiSuccess {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user or admin access only.
 * @apiError 404 User not found.
 */
router.put('/update/roles',
  token({ required: true }),
  body({ userId, roleDetails }),
  updateUserRoles)

/**
 * @api {put} /users/:id Update user
 * @apiName UpdateUser
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} access_token User access_token.
 * @apiParam {String} [name] User's name.
 * @apiParam {String} [picture] User's picture.
 * @apiParam {String} [roleId] User's roleId.
 * @apiSuccess {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user or admin access only.
 * @apiError 404 User not found.
 */
router.put('/:id',
  token({ required: true }),
  body({ name, roleId, picture }),
  update)

/**
 * @api {put} /users/:id/password Update password
 * @apiName UpdatePassword
 * @apiGroup User
 * @apiHeader {String} Authorization Basic authorization with email and password.
 * @apiParam {String{6..}} password User's new password.
 * @apiSuccess (Success 201) {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user access only.
 * @apiError 404 User not found.
 */
router.put('/:id/password',
  passwordAuth(),
  body({ password }),
  updatePassword)

/**
 * @api {delete} /users/:id Delete user
 * @apiName DeleteUser
 * @apiGroup User
 * @apiPermission admin
 * @apiParam {String} access_token User access_token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 401 Admin access only.
 * @apiError 404 User not found.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

/**
* @api {post} /user/uploadEmailsFile Upload EmailsFile
* @apiName EmailsFile
* @apiGroup User
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiSuccess {Object} Emails data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Emails not found.
* @apiError 401 user access only.
*/
router.post('/new-onboard/upload-emails-file',
  token({ required: true }),
  query(),
  uploadEmailsFile)



export default router
