import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { ControversyTasks } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, controversyTasks

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  controversyTasks = await ControversyTasks.create({ createdBy: user })
})

test('POST /controversy_tasks 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, taskNumber: 'test', companyId: 'test', analystId: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.taskNumber).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.taskStatus).toEqual('test')
  expect(body.completedDate).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /controversy_tasks 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /controversy_tasks 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /controversy_tasks 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /controversy_tasks 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /controversy_tasks 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /controversy_tasks/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${controversyTasks.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversyTasks.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /controversy_tasks/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${controversyTasks.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /controversy_tasks/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${controversyTasks.id}`)
  expect(status).toBe(401)
})

test('GET /controversy_tasks/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /controversy_tasks/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${controversyTasks.id}`)
    .send({ access_token: adminSession, taskNumber: 'test', companyId: 'test', analystId: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversyTasks.id)
  expect(body.taskNumber).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.taskStatus).toEqual('test')
  expect(body.completedDate).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /controversy_tasks/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${controversyTasks.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /controversy_tasks/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${controversyTasks.id}`)
  expect(status).toBe(401)
})

test('PUT /controversy_tasks/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, taskNumber: 'test', companyId: 'test', analystId: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /controversy_tasks/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversyTasks.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /controversy_tasks/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversyTasks.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /controversy_tasks/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${controversyTasks.id}`)
  expect(status).toBe(401)
})

test('DELETE /controversy_tasks/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
