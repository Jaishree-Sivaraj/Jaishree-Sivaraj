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
  controversyTasks = await ControversyTasks.create({})
})

test('POST /controversy_tasks 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, tasknumber: 'test', companyId: 'test', analystId: 'test', slaDate: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.tasknumber).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.slaDate).toEqual('test')
  expect(body.taskStatus).toEqual('test')
  expect(body.completedDate).toEqual('test')
  expect(body.status).toEqual('test')
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
    .send({ access_token: adminSession, tasknumber: 'test', companyId: 'test', analystId: 'test', slaDate: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(controversyTasks.id)
  expect(body.tasknumber).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.slaDate).toEqual('test')
  expect(body.taskStatus).toEqual('test')
  expect(body.completedDate).toEqual('test')
  expect(body.status).toEqual('test')
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
    .send({ access_token: adminSession, tasknumber: 'test', companyId: 'test', analystId: 'test', slaDate: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
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
