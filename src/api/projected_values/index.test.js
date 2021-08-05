import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { ProjectedValues } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, projectedValues

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  projectedValues = await ProjectedValues.create({ createdBy: user })
})

test('POST /projected_values 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, clientTaxonomyId: 'test', nic: 'test', categoryId: 'test', year: 'test', datapointId: 'test', projectedStdDeviation: 'test', projectedAverage: 'test', actualStdDeviation: 'test', actualAverage: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.clientTaxonomyId).toEqual('test')
  expect(body.nic).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.datapointId).toEqual('test')
  expect(body.projectedStdDeviation).toEqual('test')
  expect(body.projectedAverage).toEqual('test')
  expect(body.actualStdDeviation).toEqual('test')
  expect(body.actualAverage).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /projected_values 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /projected_values 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /projected_values 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /projected_values/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${projectedValues.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(projectedValues.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /projected_values/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${projectedValues.id}`)
  expect(status).toBe(401)
})

test('GET /projected_values/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /projected_values/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${projectedValues.id}`)
    .send({ access_token: userSession, clientTaxonomyId: 'test', nic: 'test', categoryId: 'test', year: 'test', datapointId: 'test', projectedStdDeviation: 'test', projectedAverage: 'test', actualStdDeviation: 'test', actualAverage: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(projectedValues.id)
  expect(body.clientTaxonomyId).toEqual('test')
  expect(body.nic).toEqual('test')
  expect(body.categoryId).toEqual('test')
  expect(body.year).toEqual('test')
  expect(body.datapointId).toEqual('test')
  expect(body.projectedStdDeviation).toEqual('test')
  expect(body.projectedAverage).toEqual('test')
  expect(body.actualStdDeviation).toEqual('test')
  expect(body.actualAverage).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /projected_values/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${projectedValues.id}`)
    .send({ access_token: anotherSession, clientTaxonomyId: 'test', nic: 'test', categoryId: 'test', year: 'test', datapointId: 'test', projectedStdDeviation: 'test', projectedAverage: 'test', actualStdDeviation: 'test', actualAverage: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /projected_values/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${projectedValues.id}`)
  expect(status).toBe(401)
})

test('PUT /projected_values/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, clientTaxonomyId: 'test', nic: 'test', categoryId: 'test', year: 'test', datapointId: 'test', projectedStdDeviation: 'test', projectedAverage: 'test', actualStdDeviation: 'test', actualAverage: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /projected_values/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${projectedValues.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /projected_values/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${projectedValues.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /projected_values/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${projectedValues.id}`)
  expect(status).toBe(401)
})

test('DELETE /projected_values/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
