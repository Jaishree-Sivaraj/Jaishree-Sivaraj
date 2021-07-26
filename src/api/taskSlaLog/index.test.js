import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { TaskSlaLog } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, taskSlaLog

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  taskSlaLog = await TaskSlaLog.create({ createdBy: user })
})

test('POST /taskSlaLogs 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, taskId: 'test', currentDate: 'test', preferedDate: 'test', requestedBy: 'test', isAccepted: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.taskId).toEqual('test')
  expect(body.currentDate).toEqual('test')
  expect(body.preferedDate).toEqual('test')
  expect(body.requestedBy).toEqual('test')
  expect(body.isAccepted).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /taskSlaLogs 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taskSlaLogs 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /taskSlaLogs 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taskSlaLogs/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${taskSlaLog.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taskSlaLog.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /taskSlaLogs/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${taskSlaLog.id}`)
  expect(status).toBe(401)
})

test('GET /taskSlaLogs/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /taskSlaLogs/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${taskSlaLog.id}`)
    .send({ access_token: userSession, taskId: 'test', currentDate: 'test', preferedDate: 'test', requestedBy: 'test', isAccepted: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taskSlaLog.id)
  expect(body.taskId).toEqual('test')
  expect(body.currentDate).toEqual('test')
  expect(body.preferedDate).toEqual('test')
  expect(body.requestedBy).toEqual('test')
  expect(body.isAccepted).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /taskSlaLogs/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taskSlaLog.id}`)
    .send({ access_token: anotherSession, taskId: 'test', currentDate: 'test', preferedDate: 'test', requestedBy: 'test', isAccepted: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /taskSlaLogs/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taskSlaLog.id}`)
  expect(status).toBe(401)
})

test('PUT /taskSlaLogs/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, taskId: 'test', currentDate: 'test', preferedDate: 'test', requestedBy: 'test', isAccepted: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /taskSlaLogs/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskSlaLog.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /taskSlaLogs/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskSlaLog.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /taskSlaLogs/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskSlaLog.id}`)
  expect(status).toBe(401)
})

test('DELETE /taskSlaLogs/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
