import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { BatchWisePillarAssignment } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, batchWisePillarAssignment

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  batchWisePillarAssignment = await BatchWisePillarAssignment.create({})
})

test('POST /batchWisePillarAssignments 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, userId: 'test', batchId: 'test', pillars: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.userId).toEqual('test')
  expect(body.batchId).toEqual('test')
  expect(body.pillars).toEqual('test')
})

test('POST /batchWisePillarAssignments 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /batchWisePillarAssignments 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /batchWisePillarAssignments 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /batchWisePillarAssignments 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /batchWisePillarAssignments 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /batchWisePillarAssignments/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${batchWisePillarAssignment.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(batchWisePillarAssignment.id)
})

test('GET /batchWisePillarAssignments/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${batchWisePillarAssignment.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /batchWisePillarAssignments/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${batchWisePillarAssignment.id}`)
  expect(status).toBe(401)
})

test('GET /batchWisePillarAssignments/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /batchWisePillarAssignments/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${batchWisePillarAssignment.id}`)
    .send({ access_token: adminSession, userId: 'test', batchId: 'test', pillars: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(batchWisePillarAssignment.id)
  expect(body.userId).toEqual('test')
  expect(body.batchId).toEqual('test')
  expect(body.pillars).toEqual('test')
})

test('PUT /batchWisePillarAssignments/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${batchWisePillarAssignment.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /batchWisePillarAssignments/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${batchWisePillarAssignment.id}`)
  expect(status).toBe(401)
})

test('PUT /batchWisePillarAssignments/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, userId: 'test', batchId: 'test', pillars: 'test' })
  expect(status).toBe(404)
})

test('DELETE /batchWisePillarAssignments/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${batchWisePillarAssignment.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /batchWisePillarAssignments/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${batchWisePillarAssignment.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /batchWisePillarAssignments/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${batchWisePillarAssignment.id}`)
  expect(status).toBe(401)
})

test('DELETE /batchWisePillarAssignments/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
