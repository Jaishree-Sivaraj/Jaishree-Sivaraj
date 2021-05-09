import { Router } from 'express'
import user from './user'
import auth from './auth'
import passwordReset from './password-reset'
import categories from './categories'
import themes from './themes'
import keyIssues from './key_issues'
import functions from './functions'
import taxonomies from './taxonomies'
import companyTaxonomies from './company_taxonomies'
import datapoints from './datapoints'
import companies from './companies'
import validationRules from './validation_rules'
import averageSd from './average_sd'
import rules from './rules'
import validations from './validations'
import standaloneDatapoints from './standalone_datapoints'
import derivedDatapoints from './derived_datapoints'

const router = new Router()

/**
 * @apiDefine master Master access only
 * You must pass `access_token` parameter or a Bearer Token authorization header
 * to access this endpoint.
 */
/**
 * @apiDefine admin Admin access only
 * You must pass `access_token` parameter or a Bearer Token authorization header
 * to access this endpoint.
 */
/**
 * @apiDefine user User access only
 * You must pass `access_token` parameter or a Bearer Token authorization header
 * to access this endpoint.
 */
/**
 * @apiDefine listParams
 * @apiParam {String} [q] Query to search.
 * @apiParam {Number{1..30}} [page=1] Page number.
 * @apiParam {Number{1..100}} [limit=30] Amount of returned items.
 * @apiParam {String[]} [sort=-createdAt] Order of returned items.
 * @apiParam {String[]} [fields] Fields to be returned.
 */
router.use('/users', user)
router.use('/auth', auth)
router.use('/password-resets', passwordReset)
router.use('/categories', categories)
router.use('/themes', themes)
router.use('/key_issues', keyIssues)
router.use('/functions', functions)
router.use('/taxonomies', taxonomies)
router.use('/company_taxonomies', companyTaxonomies)
router.use('/datapoints', datapoints)
router.use('/companies', companies)
router.use('/validation_rules', validationRules)
router.use('/average_sd', averageSd)
router.use('/rules', rules)
router.use('/validations', validations)
router.use('/standalone_datapoints', standaloneDatapoints)
router.use('/derived_datapoints', derivedDatapoints)

export default router
