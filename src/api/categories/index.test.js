import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Categories } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, categories

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  categories = await Categories.create({})
})

test('POST /categories 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, categoryName: 'test', categoryCode: 'test', categoryDescription: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.categoryName).toEqual('test')
  expect(body.categoryCode).toEqual('test')
  expect(body.categoryDescription).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /categories 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /categories 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /categories 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /categories 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /categories/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${categories.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(categories.id)
})

test('GET /categories/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${categories.id}`)
  expect(status).toBe(401)
})

test('GET /categories/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /categories/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${categories.id}`)
    .send({ access_token: adminSession, categoryName: 'test', categoryCode: 'test', categoryDescription: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(categories.id)
  expect(body.categoryName).toEqual('test')
  expect(body.categoryCode).toEqual('test')
  expect(body.categoryDescription).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /categories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${categories.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /categories/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${categories.id}`)
  expect(status).toBe(401)
})

test('PUT /categories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, categoryName: 'test', categoryCode: 'test', categoryDescription: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /categories/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${categories.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /categories/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${categories.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /categories/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${categories.id}`)
  expect(status).toBe(401)
})

test('DELETE /categories/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
