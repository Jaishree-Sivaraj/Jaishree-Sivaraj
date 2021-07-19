import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { ControversyTaskHistories } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, controversyTaskHistories

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  controversyTaskHistories = await ControversyTaskHistories.create({})
})

test('POST /controversy_task_histories 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, taskId: 'test', companyId: 'test', analystId: 'test', stage: 'test', status: 'test', createdBy: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.taskId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.stage).toEqual('test')
  expect(body.status).toEqual('test')
  expect(body.createdBy).toEqual('test')
})

test('POST /controversy_task_histories 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /controversy_task_histories 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /controversy_task_histories 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /controversy_task_histories 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /controversy_task_histories 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /controversy_task_histories/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${controversyTaskHistories.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversyTaskHistories.id)
})

test('GET /controversy_task_histories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${controversyTaskHistories.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /controversy_task_histories/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${controversyTaskHistories.id}`)
  expect(status).toBe(401)
})

test('GET /controversy_task_histories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /controversy_task_histories/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${controversyTaskHistories.id}`)
    .send({ access_token: adminSession, taskId: 'test', companyId: 'test', analystId: 'test', stage: 'test', status: 'test', createdBy: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversyTaskHistories.id)
  expect(body.taskId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.stage).toEqual('test')
  expect(body.status).toEqual('test')
  expect(body.createdBy).toEqual('test')
})

test('PUT /controversy_task_histories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${controversyTaskHistories.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /controversy_task_histories/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${controversyTaskHistories.id}`)
  expect(status).toBe(401)
})

test('PUT /controversy_task_histories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, taskId: 'test', companyId: 'test', analystId: 'test', stage: 'test', status: 'test', createdBy: 'test' })
  expect(status).toBe(404)
})

test('DELETE /controversy_task_histories/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversyTaskHistories.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /controversy_task_histories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversyTaskHistories.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /controversy_task_histories/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversyTaskHistories.id}`)
  expect(status).toBe(401)
})

test('DELETE /controversy_task_histories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
