import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export Employees, { schema } from './model'

const router = new Router()
const { userId, firstName, middleName, lastName, panNumber, aadhaarNumber, bankAccountNumber, bankIFSCCode, accountHolderName, pancardUrl, aadhaarUrl, cancelledChequeUrl, status } = schema.tree

/**
 * @api {post} /employees Create employees
 * @apiName CreateEmployees
 * @apiGroup Employees
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam userId Employees's userId.
 * @apiParam firstName Employees's firstName.
 * @apiParam middleName Employees's middleName.
 * @apiParam lastName Employees's lastName.
 * @apiParam panNumber Employees's panNumber.
 * @apiParam aadhaarNumber Employees's aadhaarNumber.
 * @apiParam bankAccountNumber Employees's bankAccountNumber.
 * @apiParam bankIFSCCode Employees's bankIFSCCode.
 * @apiParam accountHolderName Employees's accountHolderName.
 * @apiParam pancardUrl Employees's pancardUrl.
 * @apiParam aadhaarUrl Employees's aadhaarUrl.
 * @apiParam cancelledChequeUrl Employees's cancelledChequeUrl.
 * @apiParam status Employees's status.
 * @apiSuccess {Object} employees Employees's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Employees not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ userId, firstName, middleName, lastName, panNumber, aadhaarNumber, bankAccountNumber, bankIFSCCode, accountHolderName, pancardUrl, aadhaarUrl, cancelledChequeUrl, status }),
  create)

/**
 * @api {get} /employees Retrieve employees
 * @apiName RetrieveEmployees
 * @apiGroup Employees
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of employees.
 * @apiSuccess {Object[]} rows List of employees.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /employees/:id Retrieve employees
 * @apiName RetrieveEmployees
 * @apiGroup Employees
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} employees Employees's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Employees not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /employees/:id Update employees
 * @apiName UpdateEmployees
 * @apiGroup Employees
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam userId Employees's userId.
 * @apiParam firstName Employees's firstName.
 * @apiParam middleName Employees's middleName.
 * @apiParam lastName Employees's lastName.
 * @apiParam panNumber Employees's panNumber.
 * @apiParam aadhaarNumber Employees's aadhaarNumber.
 * @apiParam bankAccountNumber Employees's bankAccountNumber.
 * @apiParam bankIFSCCode Employees's bankIFSCCode.
 * @apiParam accountHolderName Employees's accountHolderName.
 * @apiParam pancardUrl Employees's pancardUrl.
 * @apiParam aadhaarUrl Employees's aadhaarUrl.
 * @apiParam cancelledChequeUrl Employees's cancelledChequeUrl.
 * @apiParam status Employees's status.
 * @apiSuccess {Object} employees Employees's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Employees not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ userId, firstName, middleName, lastName, panNumber, aadhaarNumber, bankAccountNumber, bankIFSCCode, accountHolderName, pancardUrl, aadhaarUrl, cancelledChequeUrl, status }),
  update)

/**
 * @api {delete} /employees/:id Delete employees
 * @apiName DeleteEmployees
 * @apiGroup Employees
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Employees not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
