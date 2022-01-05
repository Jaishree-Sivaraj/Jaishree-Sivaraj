import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { TaxonomyUoms } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, taxonomyUoms

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  taxonomyUoms = await TaxonomyUoms.create({ createdBy: user })
})

test('POST /taxonomy_uoms 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, measureId: 'test', measureUomId: 'test', uomConversionId: 'test', clientTaxonomyId: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.measureId).toEqual('test')
  expect(body.measureUomId).toEqual('test')
  expect(body.uomConversionId).toEqual('test')
  expect(body.clientTaxonomyId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /taxonomy_uoms 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taxonomy_uoms 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /taxonomy_uoms 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /taxonomy_uoms/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${taxonomyUoms.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taxonomyUoms.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /taxonomy_uoms/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${taxonomyUoms.id}`)
  expect(status).toBe(401)
})

test('GET /taxonomy_uoms/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /taxonomy_uoms/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${taxonomyUoms.id}`)
    .send({ access_token: userSession, measureId: 'test', measureUomId: 'test', uomConversionId: 'test', clientTaxonomyId: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(taxonomyUoms.id)
  expect(body.measureId).toEqual('test')
  expect(body.measureUomId).toEqual('test')
  expect(body.uomConversionId).toEqual('test')
  expect(body.clientTaxonomyId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /taxonomy_uoms/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taxonomyUoms.id}`)
    .send({ access_token: anotherSession, measureId: 'test', measureUomId: 'test', uomConversionId: 'test', clientTaxonomyId: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /taxonomy_uoms/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${taxonomyUoms.id}`)
  expect(status).toBe(401)
})

test('PUT /taxonomy_uoms/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, measureId: 'test', measureUomId: 'test', uomConversionId: 'test', clientTaxonomyId: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /taxonomy_uoms/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taxonomyUoms.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /taxonomy_uoms/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taxonomyUoms.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /taxonomy_uoms/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${taxonomyUoms.id}`)
  expect(status).toBe(401)
})

test('DELETE /taxonomy_uoms/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
