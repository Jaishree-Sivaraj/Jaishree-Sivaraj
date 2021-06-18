import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { master } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export CompanyRepAssignment, { schema } from './model'

const router = new Router()
const { userId, assignedId, assignedDate, status, createdAt, updatedAt } = schema.tree

/**
 * @api {post} /companyRepAssignment Create company rep assignment
 * @apiName CreateCompanyRepAssignment
 * @apiGroup CompanyRepAssignment
 * @apiParam userId Company rep assignment's userId.
 * @apiParam assignedId Company rep assignment's assignedId.
 * @apiParam assignedDate Company rep assignment's assignedDate.
 * @apiParam status Company rep assignment's status.
 * @apiParam createdAt Company rep assignment's createdAt.
 * @apiParam updatedAt Company rep assignment's updatedAt.
 * @apiSuccess {Object} companyRepAssignment Company rep assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Company rep assignment not found.
 * @apiError 401 master access only.
 */
router.post('/',
  body({ userId, assignedId, assignedDate, status, createdAt, updatedAt }),
  create)

/**
 * @api {get} /companyRepAssignment Retrieve company rep assignments
 * @apiName RetrieveCompanyRepAssignments
 * @apiGroup CompanyRepAssignment
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of company rep assignments.
 * @apiSuccess {Object[]} rows List of company rep assignments.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 master access only.
 */
router.get('/',
  query(),
  index)

/**
 * @api {get} /companyRepAssignment/:id Retrieve company rep assignment
 * @apiName RetrieveCompanyRepAssignment
 * @apiGroup CompanyRepAssignment
 * @apiSuccess {Object} companyRepAssignment Company rep assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Company rep assignment not found.
 * @apiError 401 master access only.
 */
router.get('/:id',
  show)

/**
 * @api {put} /companyRepAssignment/:id Update company rep assignment
 * @apiName UpdateCompanyRepAssignment
 * @apiGroup CompanyRepAssignment
 * @apiParam userId Company rep assignment's userId.
 * @apiParam assignedId Company rep assignment's assignedId.
 * @apiParam assignedDate Company rep assignment's assignedDate.
 * @apiParam status Company rep assignment's status.
 * @apiParam createdAt Company rep assignment's createdAt.
 * @apiParam updatedAt Company rep assignment's updatedAt.
 * @apiSuccess {Object} companyRepAssignment Company rep assignment's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Company rep assignment not found.
 * @apiError 401 master access only.
 */
router.put('/:id',
  body({ userId, assignedId, assignedDate, status, createdAt, updatedAt }),
  update)

/**
 * @api {delete} /companyRepAssignment/:id Delete company rep assignment
 * @apiName DeleteCompanyRepAssignment
 * @apiGroup CompanyRepAssignment
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Company rep assignment not found.
 * @apiError 401 master access only.
 */
router.delete('/:id',
  destroy)

export default router
