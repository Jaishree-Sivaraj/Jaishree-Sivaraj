import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { PlaceValues } from '.'

const app = () => express(apiRoot, routes)

let userSession, placeValues

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  userSession = signSync(user.id)
  placeValues = await PlaceValues.create({})
})

test('POST /place_values 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, name: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.name).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /place_values 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /place_values 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /place_values 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /place_values/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${placeValues.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(placeValues.id)
})

test('GET /place_values/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${placeValues.id}`)
  expect(status).toBe(401)
})

test('GET /place_values/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /place_values/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${placeValues.id}`)
    .send({ access_token: userSession, name: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(placeValues.id)
  expect(body.name).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /place_values/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${placeValues.id}`)
  expect(status).toBe(401)
})

test('PUT /place_values/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: userSession, name: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /place_values/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${placeValues.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /place_values/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${placeValues.id}`)
  expect(status).toBe(401)
})

test('DELETE /place_values/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})
