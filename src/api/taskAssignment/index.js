import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, getMyTasks, getMyTasksPageData, getTaskListPageData, getGroupAndBatches, getUsers, updateCompanyStatus, createTask, getQaAndAnalystFromGrp, updateSlaDates, reports, getTaskList, controversyReports, getTaskListForControversy, retrieveFilteredDataTasks, retrieveFilteredControversyTasks, taskReports } from './controller'
import { schema } from './model'
export TaskAssignment, { schema } from './model'

const router = new Router()
const { companyId, taskNumber, categoryId, groupId, batchId, analystSLA, qaSLA, taskStatus, analystId, qaId, status } = schema.tree;
const batchid = '', role = '', company = [], analyst = {}, qa = {}, analystSla = '', qaSla = '', pillar = {}, year = [], taskDetails = {}, taskId = '', flag = '', clientTaxonomyId = "", companyTaskReports = [], controversyTaskReports = [];
const isfromNotification = false;
/**
 * @api {post} /taskAssignments Create task assignment
 * @apiName CreateTaskAssignment
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Task assignment's companyId.
 * @apiParam categoryId Task assignment's categoryId.
 * @apiParam groupId Task assignment's groupId.
 * @apiParam batchId Task assignment's batchId.
 * @apiParam year Task assignment's year.
 * @apiParam analystSLA Task assignment's analystSLA.
 * @apiParam analystId Task assignment's analystId.
 * @apiParam qaId Task assignment's qaId.
 * @apiSuccess {Object} taskAssignment Task assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task assignment not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyId, categoryId, groupId, batchId, year, analystSLA, qaSLA, analystId, qaId }),
  create)

/**
* @api {post} /taskAssignments Create task assignment
* @apiName CreateTaskAssignment
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam companyId Task assignment's companyId.
* @apiParam categoryId Task assignment's categoryId.
* @apiParam groupId Task assignment's groupId.
* @apiParam batchId Task assignment's batchId.
* @apiParam year Task assignment's year.
* @apiParam analystSLA Task assignment's analystSLA.
* @apiParam analystId Task assignment's analystId.
* @apiParam qaId Task assignment's qaId.
* @apiSuccess {Object} taskAssignment Task assignment's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Task assignment not found.
* @apiError 401 user access only.
*/
router.post('/create',
  token({ required: true }),
  body({ groupId, batchId, year, pillar, company, analyst, qa, analystSla, qaSla }),
  createTask)

/**
* @api {post} /taskAssignments Create task assignment
* @apiName CreateTaskAssignment
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam groupId Task assignment's groupId.
* @apiParam batchId Task assignment's batchId.
* @apiSuccess {Object} taskAssignment Task assignment's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Task assignment not found.
* @apiError 401 user access only.
*/
router.post('/getQaAndAnalyst',
  token({ required: true }),
  body({ groupId, batchId }),
  getQaAndAnalystFromGrp)

/**
* @api {get} /taskAssignments/controversies/:role Retrieve Controversy Task List
* @apiName RetrieveControversyTaskList
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of task list.
* @apiSuccess {Object[]} rows List of task assignments.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/controversies/:role',
  token({
    required: true
  }),
  query({
    page: {
      max: Infinity
    },
    limit: {
      max: Infinity
    },
    company
  }),
  retrieveFilteredControversyTasks)

/**
* @api {get} /taskAssignments/:taskStatus/:role Retrieve Task List
* @apiName RetrieveTaskList
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of task list.
* @apiSuccess {Object[]} rows List of task assignments.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/:taskStatus/:role',
  token({
    required: true
  }),
  query({
    page: {
      max: Infinity
    },
    limit: {
      max: Infinity
    },
    company
  }),
  retrieveFilteredDataTasks)

/**
* @api {get} /taskAssignments/task/reports/:role Retrieve Task Reports
* @apiName RetrieveTaskReports
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of task assignments.
* @apiSuccess {Object[]} rows List of task assignments.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/task/reports/:role',
  token({
    required: true
  }),
  query(),
  taskReports)

/**
* @api {get} /taskAssignments/task/controversyReports Retrieve my task assignments
* @apiName RetrieveTaskAssignments
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of task assignments.
* @apiSuccess {Object[]} rows List of task assignments.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/task/controversyReports',
  token({
    required: true
  }),
  controversyReports)

/**
 * @api {get} /taskAssignments Retrieve task assignments
 * @apiName RetrieveTaskAssignments
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of task assignments.
 * @apiSuccess {Object[]} rows List of task assignments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({
    required: true
  }),
  query(),
  index)

/**
 * @api {get} /taskAssignments/my-tasks/:type/:role Retrieve my task assignments
 * @apiName RetrieveTaskAssignments
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of task assignments.
 * @apiSuccess {Object[]} rows List of task assignments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/my-tasks/:type/:role',
  token({
    required: true
  }),
  query({
    page: {
      max: Infinity
    },
    limit: {
      max: Infinity
    },
    company
  }),
  getMyTasksPageData)

/**
 * @api {get} /taskAssignments/getGroupAndBatches Retrieve my task assignments
 * @apiName RetrieveTaskAssignments
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of task assignments.
 * @apiSuccess {Object[]} rows List of task assignments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/getGroupAndBatches',
  token({
    required: true
  }),
  query(),
  getGroupAndBatches)

/**
 * @api {get} /taskAssignments/:id Retrieve task assignment
 * @apiName RetrieveTaskAssignment
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} taskAssignment Task assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task assignment not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({
    required: true
  }),
  show)

/**
 * @api {put} /taskAssignments/updateCompanyStatus Update task assignment
 * @apiName UpdateTaskAssignment
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Task assignment's companyId.
 * @apiParam batchId Task assignment's batchId.
 * @apiParam year Task assignment's year.
 * @apiSuccess {Object} taskAssignment Task assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task assignment not found.
 * @apiError 401 user access only.
 */
router.put('/updateCompanyStatus',
  token({
    required: true
  }),
  body({
    companyId,
    year,
    clientTaxonomyId,
    taskId,
    role
  }),
  updateCompanyStatus)
/**
* @api {put} /taskAssignments Update task assignment
* @apiName UpdateTaskAssignment
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam taskDetails Task assignment's qaId.
* @apiParam taskId Task assignment's status.
* @apiSuccess {Object} taskAssignment Task assignment's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Task assignment not found.
* @apiError 401 user access only.
*/
router.put('/updateSlaDates',
  token({
    required: true
  }),
  body({
    taskDetails,
    taskId,
    isfromNotification
  }),
  updateSlaDates)
/**
 * @api {put} /taskAssignments/:id Update task assignment
 * @apiName UpdateTaskAssignment
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam companyId Task assignment's companyId.
 * @apiParam categoryId Task assignment's categoryId.
 * @apiParam batchId Task assignment's batchId.
 * @apiParam year Task assignment's year.
 * @apiParam analystSLA Task assignment's analystSLA.
 * @apiParam taskStatus Task assignment's taskStatus.
 * @apiParam analystId Task assignment's analystId.
 * @apiParam qaId Task assignment's qaId.
 * @apiParam status Task assignment's status.
 * @apiSuccess {Object} taskAssignment Task assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Task assignment not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({
    required: true
  }),
  body({
    companyId,
    categoryId,
    batchId,
    year,
    analystSLA,
    qaSLA,
    taskStatus,
    analystId,
    qaId,
    status
  }),
  update)



/**
 * @api {delete} /taskAssignments/:id Delete task assignment
 * @apiName DeleteTaskAssignment
 * @apiGroup TaskAssignment
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Task assignment not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({
    required: true
  }),
  destroy)

/**
* @api {post} /getAllAssignedUsers to get list of group members
* @apiName GetGroupMembersListInTaskCreatePage
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam batchId Task assignment's batchId.
* @apiParam groupId Task assignment's groupId.
* @apiParam categoryId Task assignment's categoryId.
* @apiSuccess {Object} taskAssignment Task assignment's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Task assignment not found.
* @apiError 401 user access only.
*/
router.post('/getAllAssignedUsers',
  token({
    required: true
  }),
  body({
    batchId,
    groupId,
    categoryId
  }),
  getUsers)

/**
* @api {post} /taskAssignments/taskListWithStatus Create task assignment
* @apiName CreateTaskAssignment
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam groupId Task assignment's groupId.
* @apiParam batchId Task assignment's batchId.
* @apiSuccess {Object} taskAssignment Task assignment's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Task assignment not found.
* @apiError 401 user access only.
*/
router.post('/taskListWithStatus',
  token({ required: true }),
  body({ companyTaskReports }),
  query(),
  getTaskListPageData)


/**
* @api {post} /taskAssignments Create task assignment
* @apiName CreateTaskAssignment
* @apiGroup TaskAssignment
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiParam groupId Task assignment's groupId.
* @apiParam batchId Task assignment's batchId.
* @apiSuccess {Object} taskAssignment Task assignment's data.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 404 Task assignment not found.
* @apiError 401 user access only.
*/
router.post('/taskListForControversy',
  token({ required: true }),
  body({ controversyTaskReports }),
  getTaskListForControversy)


export default router
