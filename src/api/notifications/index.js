import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, getMyNotifications } from './controller'
import { schema } from './model'
export Notifications, { schema } from './model'

const router = new Router()
const { notifyToUser, notificationType, content, notificationTitle, isRead, status } = schema.tree

/**
 * @api {post} /notifications Create notifications
 * @apiName CreateNotifications
 * @apiGroup Notifications
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam notifyToUser Notifications's notifyToUser.
 * @apiParam notificationType Notifications's notificationType.
 * @apiParam content Notifications's content.
 * @apiParam notificationTitle Notifications's notificationTitle.
 * @apiSuccess {Object} notifications Notifications's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Notifications not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ notifyToUser, notificationType, content, notificationTitle }),
  create)

/**
 * @api {get} /notifications Retrieve notifications
 * @apiName RetrieveNotifications
 * @apiGroup Notifications
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of notifications.
 * @apiSuccess {Object[]} rows List of notifications.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /notifications/my-notifications/:notifyToUser Retrieve My notifications
 * @apiName RetrieveMyNotifications
 * @apiGroup Notifications
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of notifications.
 * @apiSuccess {Object[]} rows List of notifications.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/my-notifications/:notifyToUser',
  token({ required: true }),
  getMyNotifications)

/**
 * @api {get} /notifications/:id Retrieve notifications
 * @apiName RetrieveNotifications
 * @apiGroup Notifications
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} notifications Notifications's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Notifications not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /notifications/:id Update notifications
 * @apiName UpdateNotifications
 * @apiGroup Notifications
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam notifyToUser Notifications's notifyToUser.
 * @apiParam notificationType Notifications's notificationType.
 * @apiParam content Notifications's content.
 * @apiParam notificationTitle Notifications's notificationTitle.
 * @apiParam isRead Notifications's isRead.
 * @apiParam status Notifications's status.
 * @apiSuccess {Object} notifications Notifications's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Notifications not found.
 * @apiError 401 user access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ notifyToUser, notificationType, content, notificationTitle, isRead, status }),
  update)

/**
 * @api {delete} /notifications/:id Delete notifications
 * @apiName DeleteNotifications
 * @apiGroup Notifications
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Notifications not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
