import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { SourceSubTypes } from '.'

const app = () => express(apiRoot, routes)

let userSession, sourceSubTypes

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  userSession = signSync(user.id)
  sourceSubTypes = await SourceSubTypes.create({})
})

test('POST /source_sub_types 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, subTypeName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.subTypeName).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /source_sub_types 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /source_sub_types 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /source_sub_types 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /source_sub_types/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${sourceSubTypes.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(sourceSubTypes.id)
})

test('GET /source_sub_types/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${sourceSubTypes.id}`)
  expect(status).toBe(401)
})

test('GET /source_sub_types/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /source_sub_types/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${sourceSubTypes.id}`)
    .send({ access_token: userSession, subTypeName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(sourceSubTypes.id)
  expect(body.subTypeName).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /source_sub_types/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${sourceSubTypes.id}`)
  expect(status).toBe(401)
})

test('PUT /source_sub_types/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: userSession, subTypeName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /source_sub_types/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${sourceSubTypes.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /source_sub_types/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${sourceSubTypes.id}`)
  expect(status).toBe(401)
})

test('DELETE /source_sub_types/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})
