import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { TaskHistories } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, taskHistories

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  taskHistories = await TaskHistories.create({})
})

test('POST /task_histories 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, taskId: 'test', companyId: 'test', categoryId: 'test', submittedByName: 'test', stage: 'test', comment: 'test', status: 'test', createdBy: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.taskId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.submittedByName).toEqual('test')
  expect(body.stage).toEqual('test')
  expect(body.comment).toEqual('test')
  expect(body.status).toEqual('test')
  expect(body.createdBy).toEqual('test')
})

test('POST /task_histories 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /task_histories 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /task_histories 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /task_histories 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /task_histories 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /task_histories/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${taskHistories.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taskHistories.id)
})

test('GET /task_histories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${taskHistories.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /task_histories/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${taskHistories.id}`)
  expect(status).toBe(401)
})

test('GET /task_histories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /task_histories/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${taskHistories.id}`)
    .send({ access_token: adminSession, taskId: 'test', companyId: 'test', categoryId: 'test', submittedByName: 'test', stage: 'test', comment: 'test', status: 'test', createdBy: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taskHistories.id)
  expect(body.taskId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.submittedByName).toEqual('test')
  expect(body.stage).toEqual('test')
  expect(body.comment).toEqual('test')
  expect(body.status).toEqual('test')
  expect(body.createdBy).toEqual('test')
})

test('PUT /task_histories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taskHistories.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /task_histories/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taskHistories.id}`)
  expect(status).toBe(401)
})

test('PUT /task_histories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, taskId: 'test', companyId: 'test', categoryId: 'test', submittedByName: 'test', stage: 'test', comment: 'test', status: 'test', createdBy: 'test' })
  expect(status).toBe(404)
})

test('DELETE /task_histories/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskHistories.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /task_histories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskHistories.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /task_histories/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskHistories.id}`)
  expect(status).toBe(401)
})

test('DELETE /task_histories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
