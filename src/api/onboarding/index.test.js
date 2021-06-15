import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Onboarding } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, onboarding

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  onboarding = await Onboarding.create({})
})

test('POST /onboardings 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, email: 'test', onboardingType: 'test', content: 'test', mailStatus: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.email).toEqual('test')
  expect(body.onboardingType).toEqual('test')
  expect(body.content).toEqual('test')
  expect(body.mailStatus).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /onboardings 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /onboardings 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /onboardings 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body)).toBe(true)
})

test('GET /onboardings 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /onboardings 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /onboardings/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${onboarding.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(onboarding.id)
})

test('GET /onboardings/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${onboarding.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /onboardings/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${onboarding.id}`)
  expect(status).toBe(401)
})

test('GET /onboardings/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /onboardings/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${onboarding.id}`)
    .send({ access_token: adminSession, email: 'test', onboardingType: 'test', content: 'test', mailStatus: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(onboarding.id)
  expect(body.email).toEqual('test')
  expect(body.onboardingType).toEqual('test')
  expect(body.content).toEqual('test')
  expect(body.mailStatus).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /onboardings/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${onboarding.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /onboardings/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${onboarding.id}`)
  expect(status).toBe(401)
})

test('PUT /onboardings/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, email: 'test', onboardingType: 'test', content: 'test', mailStatus: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /onboardings/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${onboarding.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /onboardings/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${onboarding.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /onboardings/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${onboarding.id}`)
  expect(status).toBe(401)
})

test('DELETE /onboardings/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
