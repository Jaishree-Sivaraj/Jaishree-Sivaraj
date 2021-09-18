import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { OnboardingEmails } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, onboardingEmails

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  onboardingEmails = await OnboardingEmails.create({ user })
})

test('POST /onboarding-emails 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, emailId: 'test', isOnboarded: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.emailId).toEqual('test')
  expect(body.isOnboarded).toEqual('test')
  expect(typeof body.user).toEqual('object')
})

test('POST /onboarding-emails 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /onboarding-emails 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].user).toEqual('object')
})

test('GET /onboarding-emails 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /onboarding-emails/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${onboardingEmails.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(onboardingEmails.id)
  expect(typeof body.user).toEqual('object')
})

test('GET /onboarding-emails/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${onboardingEmails.id}`)
  expect(status).toBe(401)
})

test('GET /onboarding-emails/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /onboarding-emails/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${onboardingEmails.id}`)
    .send({ access_token: userSession, emailId: 'test', isOnboarded: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(onboardingEmails.id)
  expect(body.emailId).toEqual('test')
  expect(body.isOnboarded).toEqual('test')
  expect(typeof body.user).toEqual('object')
})

test('PUT /onboarding-emails/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${onboardingEmails.id}`)
    .send({ access_token: anotherSession, emailId: 'test', isOnboarded: 'test' })
  expect(status).toBe(401)
})

test('PUT /onboarding-emails/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${onboardingEmails.id}`)
  expect(status).toBe(401)
})

test('PUT /onboarding-emails/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, emailId: 'test', isOnboarded: 'test' })
  expect(status).toBe(404)
})

test('DELETE /onboarding-emails/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${onboardingEmails.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /onboarding-emails/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${onboardingEmails.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /onboarding-emails/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${onboardingEmails.id}`)
  expect(status).toBe(401)
})

test('DELETE /onboarding-emails/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
