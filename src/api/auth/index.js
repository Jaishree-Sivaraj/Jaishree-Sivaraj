import { Router } from 'express'
import { middleware as body } from 'bodymen'
import { login, loginOtp, validateOTP } from './controller'
import { password, master, token, otpVerification } from '../../services/passport'

const router = new Router()
const email = '', otp = '';

/**
 * @api {post} /auth Authenticate
 * @apiName Authenticate
 * @apiGroup Auth
 * @apiHeader {String} Authorization Basic authorization with email and password.
 * @apiSuccess (Success 201) {String} token User `access_token` to be passed to other requests.
 * @apiSuccess (Success 201) {Object} user Current user's data.
 * @apiError 401 Master access only or invalid credentials.
 */
router.post('/',
  password(),
  login)

/**
 * @api {post} /auth/auth-otp AuthenticateOTP
 * @apiName AuthenticateUsingEmailAndOTP
 * @apiGroup Auth
 * @apiPermission master
 * @apiParam {String} access_token Master access_token.
 * @apiParam {String} email User's email.
 * @apiParam {String} otp User's otp.
 * @apiSuccess (Success 201) {String} token User `access_token` to be passed to other requests.
 * @apiSuccess (Success 201) {Object} user Current user's data.
 * @apiError 401 Master access only or invalid credentials.
 */
 router.post('/auth-otp',
 otpVerification(),
//  body({email, otp}),
 loginOtp)

export default router
