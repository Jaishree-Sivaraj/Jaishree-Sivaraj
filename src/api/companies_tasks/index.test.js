import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { CompaniesTasks } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, companiesTasks

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  companiesTasks = await CompaniesTasks.create({ createdBy: user })
})

test('POST /companies_tasks 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, taskId: 'test', companyId: 'test', year: 'test', categoryId: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.taskId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /companies_tasks 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /companies_tasks 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /companies_tasks 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /companies_tasks/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${companiesTasks.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(companiesTasks.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /companies_tasks/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${companiesTasks.id}`)
  expect(status).toBe(401)
})

test('GET /companies_tasks/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /companies_tasks/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${companiesTasks.id}`)
    .send({ access_token: userSession, taskId: 'test', companyId: 'test', year: 'test', categoryId: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(companiesTasks.id)
  expect(body.taskId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /companies_tasks/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${companiesTasks.id}`)
    .send({ access_token: anotherSession, taskId: 'test', companyId: 'test', year: 'test', categoryId: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /companies_tasks/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${companiesTasks.id}`)
  expect(status).toBe(401)
})

test('PUT /companies_tasks/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, taskId: 'test', companyId: 'test', year: 'test', categoryId: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /companies_tasks/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companiesTasks.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /companies_tasks/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companiesTasks.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /companies_tasks/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companiesTasks.id}`)
  expect(status).toBe(401)
})

test('DELETE /companies_tasks/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
