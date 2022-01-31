import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Conversiontypes } from '.'

const app = () => express(apiRoot, routes)

let userSession, conversiontypes

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  userSession = signSync(user.id)
  conversiontypes = await Conversiontypes.create({})
})

test('POST /conversiontypes 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, typeName: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.typeName).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /conversiontypes 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /conversiontypes 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /conversiontypes 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /conversiontypes/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${conversiontypes.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(conversiontypes.id)
})

test('GET /conversiontypes/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${conversiontypes.id}`)
  expect(status).toBe(401)
})

test('GET /conversiontypes/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /conversiontypes/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${conversiontypes.id}`)
    .send({ access_token: userSession, typeName: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(conversiontypes.id)
  expect(body.typeName).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /conversiontypes/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${conversiontypes.id}`)
  expect(status).toBe(401)
})

test('PUT /conversiontypes/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: userSession, typeName: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /conversiontypes/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${conversiontypes.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /conversiontypes/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${conversiontypes.id}`)
  expect(status).toBe(401)
})

test('DELETE /conversiontypes/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})
