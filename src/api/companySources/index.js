import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { create, index, show, update, destroy } from './controller'
import { schema } from './model'
export CompanySources, { schema } from './model'

const router = new Router()
const { sourceTypeId, sourceUrl, sourceFile, publicationDate } = schema.tree

/**
 * @api {post} /companySources Create company sources
 * @apiName CreateCompanySources
 * @apiGroup CompanySources
 * @apiParam sourceTypeId Company sources's sourceTypeId.
 * @apiParam sourceUrl Company sources's sourceUrl.
 * @apiParam sourceFile Company sources's sourceFile.
 * @apiParam publicationDate Company sources's publicationDate.
 * @apiSuccess {Object} companySources Company sources's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Company sources not found.
 */
router.post('/',
  body({ sourceTypeId, sourceUrl, sourceFile, publicationDate }),
  create)

/**
 * @api {get} /companySources Retrieve company sources
 * @apiName RetrieveCompanySources
 * @apiGroup CompanySources
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of company sources.
 * @apiSuccess {Object[]} rows List of company sources.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('/',
  query(),
  index)

/**
 * @api {get} /companySources/:id Retrieve company sources
 * @apiName RetrieveCompanySources
 * @apiGroup CompanySources
 * @apiSuccess {Object} companySources Company sources's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Company sources not found.
 */
router.get('/:id',
  show)

/**
 * @api {put} /companySources/:id Update company sources
 * @apiName UpdateCompanySources
 * @apiGroup CompanySources
 * @apiParam sourceTypeId Company sources's sourceTypeId.
 * @apiParam sourceUrl Company sources's sourceUrl.
 * @apiParam sourceFile Company sources's sourceFile.
 * @apiParam publicationDate Company sources's publicationDate.
 * @apiSuccess {Object} companySources Company sources's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Company sources not found.
 */
router.put('/:id',
  body({ sourceTypeId, sourceUrl, sourceFile, publicationDate }),
  update)

/**
 * @api {delete} /companySources/:id Delete company sources
 * @apiName DeleteCompanySources
 * @apiGroup CompanySources
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Company sources not found.
 */
router.delete('/:id',
  destroy)

export default router
