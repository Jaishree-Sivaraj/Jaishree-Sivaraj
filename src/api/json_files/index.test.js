import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { JsonFiles } from '.'

const app = () => express(apiRoot, routes)

let userSession, jsonFiles

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  userSession = signSync(user.id)
  jsonFiles = await JsonFiles.create({})
})

test('POST /json_files 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, companyId: 'test', year: 'test', type: 'test', fileName: 'test', url: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.companyId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.type).toEqual('test')
  expect(body.fileName).toEqual('test')
  expect(body.url).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /json_files 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /json_files 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /json_files 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /json_files/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${jsonFiles.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(jsonFiles.id)
})

test('GET /json_files/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${jsonFiles.id}`)
  expect(status).toBe(401)
})

test('GET /json_files/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /json_files/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${jsonFiles.id}`)
    .send({ access_token: userSession, companyId: 'test', year: 'test', type: 'test', fileName: 'test', url: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(jsonFiles.id)
  expect(body.companyId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.type).toEqual('test')
  expect(body.fileName).toEqual('test')
  expect(body.url).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /json_files/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${jsonFiles.id}`)
  expect(status).toBe(401)
})

test('PUT /json_files/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: userSession, companyId: 'test', year: 'test', type: 'test', fileName: 'test', url: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /json_files/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${jsonFiles.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /json_files/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${jsonFiles.id}`)
  expect(status).toBe(401)
})

test('DELETE /json_files/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})
