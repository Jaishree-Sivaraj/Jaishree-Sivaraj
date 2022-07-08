import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { ClientMaster } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, clientMaster

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  clientMaster = await ClientMaster.create({})
})

test('POST /client-masters 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, clientId: 'test', clientName: 'test', taxonomy: 'test', companyList: 'test', country: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.clientId).toEqual('test')
  expect(body.clientName).toEqual('test')
  expect(body.taxonomy).toEqual('test')
  expect(body.companyList).toEqual('test')
  expect(body.country).toEqual('test')
})

test('POST /client-masters 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /client-masters 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /client-masters 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /client-masters 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /client-masters 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /client-masters/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${clientMaster.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(clientMaster.id)
})

test('GET /client-masters/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${clientMaster.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /client-masters/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${clientMaster.id}`)
  expect(status).toBe(401)
})

test('GET /client-masters/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /client-masters/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${clientMaster.id}`)
    .send({ access_token: adminSession, clientId: 'test', clientName: 'test', taxonomy: 'test', companyList: 'test', country: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(clientMaster.id)
  expect(body.clientId).toEqual('test')
  expect(body.clientName).toEqual('test')
  expect(body.taxonomy).toEqual('test')
  expect(body.companyList).toEqual('test')
  expect(body.country).toEqual('test')
})

test('PUT /client-masters/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${clientMaster.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /client-masters/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${clientMaster.id}`)
  expect(status).toBe(401)
})

test('PUT /client-masters/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, clientId: 'test', clientName: 'test', taxonomy: 'test', companyList: 'test', country: 'test' })
  expect(status).toBe(404)
})

test('DELETE /client-masters/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${clientMaster.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /client-masters/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${clientMaster.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /client-masters/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${clientMaster.id}`)
  expect(status).toBe(401)
})

test('DELETE /client-masters/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
