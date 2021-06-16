import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { SourceTypes } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, sourceTypes

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  sourceTypes = await SourceTypes.create({})
})

test('POST /sourceTypes 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, typeName: 'test', duration: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.typeName).toEqual('test')
  expect(body.duration).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /sourceTypes 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /sourceTypes 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /sourceTypes 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /sourceTypes 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /sourceTypes 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /sourceTypes/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${sourceTypes.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(sourceTypes.id)
})

test('GET /sourceTypes/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${sourceTypes.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /sourceTypes/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${sourceTypes.id}`)
  expect(status).toBe(401)
})

test('GET /sourceTypes/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /sourceTypes/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${sourceTypes.id}`)
    .send({ access_token: adminSession, typeName: 'test', duration: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(sourceTypes.id)
  expect(body.typeName).toEqual('test')
  expect(body.duration).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /sourceTypes/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${sourceTypes.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /sourceTypes/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${sourceTypes.id}`)
  expect(status).toBe(401)
})

test('PUT /sourceTypes/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, typeName: 'test', duration: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /sourceTypes/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${sourceTypes.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /sourceTypes/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${sourceTypes.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /sourceTypes/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${sourceTypes.id}`)
  expect(status).toBe(401)
})

test('DELETE /sourceTypes/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
