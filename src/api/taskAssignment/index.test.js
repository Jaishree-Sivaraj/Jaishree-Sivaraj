import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { TaskAssignment } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, taskAssignment

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  taskAssignment = await TaskAssignment.create({ createdBy: user })
})

test('POST /taskAssignments 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, companyId: 'test', categoryId: 'test', batchId: 'test', year: 'test', analystSLA: 'test', qaSLA: 'test', taskStatus: 'test', analystId: 'test', qaId: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.companyId).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.batchId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.analystSLA).toEqual('test')
  expect(body.qaSLA).toEqual('test')
  expect(body.taskStatus).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.qaId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /taskAssignments 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taskAssignments 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /taskAssignments 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taskAssignments/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${taskAssignment.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taskAssignment.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /taskAssignments/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${taskAssignment.id}`)
  expect(status).toBe(401)
})

test('GET /taskAssignments/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /taskAssignments/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${taskAssignment.id}`)
    .send({ access_token: userSession, companyId: 'test', categoryId: 'test', batchId: 'test', year: 'test', analystSLA: 'test', qaSLA: 'test', taskStatus: 'test', analystId: 'test', qaId: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taskAssignment.id)
  expect(body.companyId).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.batchId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.analystSLA).toEqual('test')
  expect(body.qaSLA).toEqual('test')
  expect(body.taskStatus).toEqual('test')
  expect(body.analystId).toEqual('test')
  expect(body.qaId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /taskAssignments/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taskAssignment.id}`)
    .send({ access_token: anotherSession, companyId: 'test', categoryId: 'test', batchId: 'test', year: 'test', analystSLA: 'test', qaSLA: 'test', taskStatus: 'test', analystId: 'test', qaId: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /taskAssignments/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taskAssignment.id}`)
  expect(status).toBe(401)
})

test('PUT /taskAssignments/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, companyId: 'test', categoryId: 'test', batchId: 'test', year: 'test', analystSLA: 'test', qaSLA: 'test', taskStatus: 'test', analystId: 'test', qaId: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /taskAssignments/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskAssignment.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /taskAssignments/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskAssignment.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /taskAssignments/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taskAssignment.id}`)
  expect(status).toBe(401)
})

test('DELETE /taskAssignments/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
