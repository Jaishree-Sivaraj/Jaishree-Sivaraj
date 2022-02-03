import { Router } from 'express'
import user from './user'
import auth from './auth'
import passwordReset from './password-reset'
import categories from './categories'
import themes from './themes'
import keyIssues from './key_issues'
import functions from './functions'
import taxonomies from './taxonomies'
import datapoints from './datapoints'
import companies from './companies'
import validationRules from './validation_rules'
import rules from './rules'
import validations from './validations'
import standaloneDatapoints from './standalone_datapoints'
import derivedDatapoints from './derived_datapoints'
import role from './role'
import batches from './batches'
import boardMembers from './boardMembers'
import boardMembersMatrixDataPoints from './boardMembersMatrixDataPoints'
import kmp from './kmp'
import kmpMatrixDataPoints from './kmpMatrixDataPoints'
import group from './group'
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
import clientTaxonomy from './clientTaxonomy'
import notifications from './notifications'
import companySources from './companySources'
import sourceTypes from './sourceTypes'
import companiesTasks from './companies_tasks'
import userPillarAssignments from './user_pillar_assignments'
import controversyTasks from './controversy_tasks'
import controversyTaskHistories from './controversy_task_histories'
import taskHistories from './task_histories'
import sourceSubTypes from './source_sub_types'
import projectedValues from './projected_values'
import jsonFiles from './json_files'
import dashboards from './dashboards'
import onboardingEmails from './onboarding-emails'
import conversiontypes from './conversiontypes'
import measures from './measures'
import measureUoms from './measure_uoms'
import uomConversions from './uom_conversions'
import taxonomyUoms from './taxonomy_uoms'
import placeValues from './place_values'
import validationResults from './validation_results'
import childDp from './child-dp'
import reports from './reports'

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
router.use('/datapoints', datapoints)
router.use('/companies', companies)
router.use('/validation_rules', validationRules)
router.use('/rules', rules)
router.use('/validations', validations)
router.use('/standalone_datapoints', standaloneDatapoints)
router.use('/derived_datapoints', derivedDatapoints)
router.use('/role', role)
router.use('/batches', batches)
router.use('/boardMembers', boardMembers)
router.use('/boardMembersMatrixDataPoints', boardMembersMatrixDataPoints)
router.use('/kmp', kmp)
router.use('/kmpMatrixDataPoints', kmpMatrixDataPoints)
router.use('/groups', group)
router.use('/taskAssignments', taskAssignment)
router.use('/errors', error)
router.use('/errorDetails', errorDetails)
router.use('/taskSlaLogs', taskSlaLog)
router.use('/controversies', controversy)
router.use('/polarity_rules', polarityRules)
router.use('/ztables', ztables)
router.use('/employees', employees)
router.use('/client-representatives', clientRepresentatives)
router.use('/company-representatives', companyRepresentatives)
router.use('/clientTaxonomies', clientTaxonomy)
router.use('/notifications', notifications)
router.use('/companySources', companySources)
router.use('/sourceTypes', sourceTypes)
router.use('/companies_tasks', companiesTasks)
router.use('/user_pillar_assignments', userPillarAssignments)
router.use('/controversy_tasks', controversyTasks)
router.use('/controversy_task_histories', controversyTaskHistories)
router.use('/task_histories', taskHistories)
router.use('/source_sub_types', sourceSubTypes)
router.use('/projected_values', projectedValues)
router.use('/json_files', jsonFiles)
router.use('/dashboards', dashboards)
router.use('/onboarding-emails', onboardingEmails)
router.use('/conversiontypes', conversiontypes)
router.use('/measures', measures)
router.use('/measure_uoms', measureUoms)
router.use('/uom_conversions', uomConversions)
router.use('/taxonomy_uoms', taxonomyUoms)
router.use('/place_values', placeValues)
router.use('/validation_results', validationResults)
router.use('/child-dps', childDp)
router.use('/reports', reports)
router.use('/', (req, res) => res.status(200).json({ message: "Location-Service - CHECK" }))

export default router
