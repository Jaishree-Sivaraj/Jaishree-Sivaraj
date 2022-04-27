import request from 'supertest'
import { masterKey, apiRoot } from '../../config'
import express from '../../services/express'
import routes, { BoardDirector } from '.'

const app = () => express(apiRoot, routes)

let boardDirector

beforeEach(async () => {
  boardDirector = await BoardDirector.create({})
})

test('POST /boardDirector 201 (master)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: masterKey, din: 'test', name: 'test', gender: 'test', companies: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.din).toEqual('test')
  expect(body.name).toEqual('test')
  expect(body.gender).toEqual('test')
  expect(body.companies).toEqual('test')
})

test('POST /boardDirector 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /boardDirector 200 (master)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: masterKey })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /boardDirector 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /boardDirector/:id 200 (master)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${boardDirector.id}`)
    .query({ access_token: masterKey })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(boardDirector.id)
})

test('GET /boardDirector/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${boardDirector.id}`)
  expect(status).toBe(401)
})

test('GET /boardDirector/:id 404 (master)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: masterKey })
  expect(status).toBe(404)
})

test('PUT /boardDirector/:id 200 (master)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${boardDirector.id}`)
    .send({ access_token: masterKey, din: 'test', name: 'test', gender: 'test', companies: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(boardDirector.id)
  expect(body.din).toEqual('test')
  expect(body.name).toEqual('test')
  expect(body.gender).toEqual('test')
  expect(body.companies).toEqual('test')
})

test('PUT /boardDirector/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${boardDirector.id}`)
  expect(status).toBe(401)
})

test('PUT /boardDirector/:id 404 (master)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: masterKey, din: 'test', name: 'test', gender: 'test', companies: 'test' })
  expect(status).toBe(404)
})

test('DELETE /boardDirector/:id 204 (master)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${boardDirector.id}`)
    .query({ access_token: masterKey })
  expect(status).toBe(204)
})

test('DELETE /boardDirector/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${boardDirector.id}`)
  expect(status).toBe(401)
})

test('DELETE /boardDirector/:id 404 (master)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: masterKey })
  expect(status).toBe(404)
})
