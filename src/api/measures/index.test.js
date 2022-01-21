import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Measures } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, measures

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  measures = await Measures.create({ createdBy: user })
})

test('POST /measures 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, measureName: 'test', measureDescription: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.measureName).toEqual('test')
  expect(body.measureDescription).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /measures 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /measures 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /measures 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /measures/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${measures.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(measures.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /measures/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${measures.id}`)
  expect(status).toBe(401)
})

test('GET /measures/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /measures/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${measures.id}`)
    .send({ access_token: userSession, measureName: 'test', measureDescription: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(measures.id)
  expect(body.measureName).toEqual('test')
  expect(body.measureDescription).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /measures/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${measures.id}`)
    .send({ access_token: anotherSession, measureName: 'test', measureDescription: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /measures/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${measures.id}`)
  expect(status).toBe(401)
})

test('PUT /measures/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, measureName: 'test', measureDescription: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /measures/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${measures.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /measures/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${measures.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /measures/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${measures.id}`)
  expect(status).toBe(401)
})

test('DELETE /measures/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
