import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { UomConversions } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, uomConversions

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  uomConversions = await UomConversions.create({ createdBy: user })
})

test('POST /uom_conversions 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, measureId: 'test', uomId: 'test', uomSource: 'test', uomTarget: 'test', conversionType: 'test', conversionParameter: 'test', conversionFormula: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.measureId).toEqual('test')
  expect(body.uomId).toEqual('test')
  expect(body.uomSource).toEqual('test')
  expect(body.uomTarget).toEqual('test')
  expect(body.conversionType).toEqual('test')
  expect(body.conversionParameter).toEqual('test')
  expect(body.conversionFormula).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /uom_conversions 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /uom_conversions 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /uom_conversions 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /uom_conversions/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${uomConversions.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(uomConversions.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /uom_conversions/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${uomConversions.id}`)
  expect(status).toBe(401)
})

test('GET /uom_conversions/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /uom_conversions/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${uomConversions.id}`)
    .send({ access_token: userSession, measureId: 'test', uomId: 'test', uomSource: 'test', uomTarget: 'test', conversionType: 'test', conversionParameter: 'test', conversionFormula: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(uomConversions.id)
  expect(body.measureId).toEqual('test')
  expect(body.uomId).toEqual('test')
  expect(body.uomSource).toEqual('test')
  expect(body.uomTarget).toEqual('test')
  expect(body.conversionType).toEqual('test')
  expect(body.conversionParameter).toEqual('test')
  expect(body.conversionFormula).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /uom_conversions/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${uomConversions.id}`)
    .send({ access_token: anotherSession, measureId: 'test', uomId: 'test', uomSource: 'test', uomTarget: 'test', conversionType: 'test', conversionParameter: 'test', conversionFormula: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /uom_conversions/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${uomConversions.id}`)
  expect(status).toBe(401)
})

test('PUT /uom_conversions/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, measureId: 'test', uomId: 'test', uomSource: 'test', uomTarget: 'test', conversionType: 'test', conversionParameter: 'test', conversionFormula: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /uom_conversions/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${uomConversions.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /uom_conversions/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${uomConversions.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /uom_conversions/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${uomConversions.id}`)
  expect(status).toBe(401)
})

test('DELETE /uom_conversions/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
