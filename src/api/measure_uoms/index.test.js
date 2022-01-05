import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { MeasureUoms } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, measureUoms

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  measureUoms = await MeasureUoms.create({ createdBy: user })
})

test('POST /measure_uoms 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, measureId: 'test', uomName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.measureId).toEqual('test')
  expect(body.uomName).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /measure_uoms 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /measure_uoms 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /measure_uoms 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /measure_uoms/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${measureUoms.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(measureUoms.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /measure_uoms/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${measureUoms.id}`)
  expect(status).toBe(401)
})

test('GET /measure_uoms/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /measure_uoms/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${measureUoms.id}`)
    .send({ access_token: userSession, measureId: 'test', uomName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(measureUoms.id)
  expect(body.measureId).toEqual('test')
  expect(body.uomName).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /measure_uoms/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${measureUoms.id}`)
    .send({ access_token: anotherSession, measureId: 'test', uomName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /measure_uoms/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${measureUoms.id}`)
  expect(status).toBe(401)
})

test('PUT /measure_uoms/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, measureId: 'test', uomName: 'test', description: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /measure_uoms/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${measureUoms.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /measure_uoms/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${measureUoms.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /measure_uoms/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${measureUoms.id}`)
  expect(status).toBe(401)
})

test('DELETE /measure_uoms/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
