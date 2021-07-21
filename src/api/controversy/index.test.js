import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Controversy } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, controversy

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  controversy = await Controversy.create({ createdBy: user })
})

test('POST /controversies 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, datapointId: 'test', companyId: 'test', year: 'test', controversyDetails: 'test', comments: 'test', submittedDate: 'test', response: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.datapointId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.controversyDetails).toEqual('test')
  expect(body.comments).toEqual('test')
  expect(body.submittedDate).toEqual('test')
  expect(body.response).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /controversies 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /controversies 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /controversies 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /controversies/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${controversy.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversy.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /controversies/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${controversy.id}`)
  expect(status).toBe(401)
})

test('GET /controversies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /controversies/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${controversy.id}`)
    .send({ access_token: userSession, datapointId: 'test', companyId: 'test', year: 'test', controversyDetails: 'test', comments: 'test', submittedDate: 'test', response: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversy.id)
  expect(body.datapointId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.controversyDetails).toEqual('test')
  expect(body.comments).toEqual('test')
  expect(body.submittedDate).toEqual('test')
  expect(body.response).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /controversies/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${controversy.id}`)
    .send({ access_token: anotherSession, datapointId: 'test', companyId: 'test', year: 'test', controversyDetails: 'test', comments: 'test', submittedDate: 'test', response: 'test' })
  expect(status).toBe(401)
})

test('PUT /controversies/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${controversy.id}`)
  expect(status).toBe(401)
})

test('PUT /controversies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, datapointId: 'test', companyId: 'test', year: 'test', controversyDetails: 'test', comments: 'test', submittedDate: 'test', response: 'test' })
  expect(status).toBe(404)
})

test('DELETE /controversies/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversy.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /controversies/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversy.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /controversies/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversy.id}`)
  expect(status).toBe(401)
})

test('DELETE /controversies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
