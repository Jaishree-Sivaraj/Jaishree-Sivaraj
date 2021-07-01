import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Taxonomies } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, taxonomies

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  taxonomies = await Taxonomies.create({ createdBy: user })
})

test('POST /taxonomies 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, name: 'test', fieldName: 'test', description: 'test', isRequired: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.name).toEqual('test')
  expect(body.fieldName).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.isRequired).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /taxonomies 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taxonomies 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /taxonomies 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taxonomies/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${taxonomies.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taxonomies.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /taxonomies/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${taxonomies.id}`)
  expect(status).toBe(401)
})

test('GET /taxonomies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /taxonomies/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${taxonomies.id}`)
    .send({ access_token: userSession, name: 'test', fieldName: 'test', description: 'test', isRequired: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taxonomies.id)
  expect(body.name).toEqual(taxonomies.name)
  expect(body.fieldName).toEqual(taxonomies.fieldName)
  expect(body.description).toEqual(taxonomies.description)
  expect(body.isRequired).toEqual(taxonomies.isRequired)
  expect(body.status).toEqual(taxonomies.status)
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /taxonomies/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taxonomies.id}`)
    .send({ access_token: anotherSession, name: 'test', fieldName: 'test', description: 'test', isRequired: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /taxonomies/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taxonomies.id}`)
  expect(status).toBe(401)
})

test('PUT /taxonomies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, name: 'test', fieldName: 'test', description: 'test', isRequired: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /taxonomies/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taxonomies.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /taxonomies/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taxonomies.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /taxonomies/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taxonomies.id}`)
  expect(status).toBe(401)
})

test('DELETE /taxonomies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
