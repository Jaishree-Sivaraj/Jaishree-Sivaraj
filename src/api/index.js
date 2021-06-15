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
import role from './role'
import batches from './batches'
import reference from './reference'
import boardMembers from './boardMembers'
import boardMembersMatrixDataPoints from './boardMembersMatrixDataPoints'
import kmp from './kmp'
import kmpMatrixDataPoints from './kmpMatrixDataPoints'
import group from './group'
import groupAnalyst from './groupAnalyst'
import groupQa from './groupQA'
import taskAssignment from './taskAssignment'
import error from './error'
import errorDetails from './errorDetails'
import taskSlaLog from './taskSlaLog'
import controversy from './controversy'
import polarityRules from './polarity_rules'
import ztables from './ztables'
import employees from './employees'
import clientRepresentatives from './client-representatives'
import companyRepresentatives from './company-representatives'
import masterTaxonomy from './masterTaxonomy'
import clientTaxonomy from './clientTaxonomy'
import notifications from './notifications'
import onboarding from './onboarding'

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
 * @apiParam {Number{1..1000}} [page=1] Page number.
 * @apiParam {Number{1..1000}} [limit=1000] Amount of returned items.
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
router.use('/role', role)
router.use('/batches', batches)
router.use('/references', reference)
router.use('/boardMembers', boardMembers)
router.use('/boardMembersMatrixDataPoints', boardMembersMatrixDataPoints)
router.use('/kmp', kmp)
router.use('/kmpMatrixDataPoints', kmpMatrixDataPoints)
router.use('/groups', group)
router.use('/groupAnalysts', groupAnalyst)
router.use('/groupQAS', groupQa)
router.use('/taskAssignments', taskAssignment)
router.use('/errors', error)
router.use('/errorDetails', errorDetails)
router.use('/errorDetails', errorDetails)
router.use('/taskSlaLogs', taskSlaLog)
router.use('/controversies', controversy)
router.use('/polarity_rules', polarityRules)
router.use('/ztables', ztables)
router.use('/employees', employees)
router.use('/client-representatives', clientRepresentatives)
router.use('/company-representatives', companyRepresentatives)
router.use('/clientTaxonomies', clientTaxonomy)
router.use('/masterTaxonomies', masterTaxonomy)
router.use('/notifications', notifications)
router.use('/onboardings', onboarding)

export default router
