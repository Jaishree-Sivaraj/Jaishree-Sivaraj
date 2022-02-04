import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { ChildDp } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, childDp

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  childDp = await ChildDp.create({})
})

test('POST /child-dps 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue).toEqual('test')
})

test('POST /child-dps 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /child-dps 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /child-dps 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /child-dps 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /child-dps 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /child-dps/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${childDp.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(childDp.id)
})

test('GET /child-dps/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${childDp.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /child-dps/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${childDp.id}`)
  expect(status).toBe(401)
})

test('GET /child-dps/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /child-dps/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${childDp.id}`)
    .send({ access_token: adminSession, companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(childDp.id)
  expect(body.companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue).toEqual('test')
})

test('PUT /child-dps/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${childDp.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /child-dps/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${childDp.id}`)
  expect(status).toBe(401)
})

test('PUT /child-dps/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, companyDataElementLabel companyDataElementSubLabel dataType dataValue formatOfDataProvidedByCompany keywordUsed pageNumber sectionOfDocument snapshotsupportingNarrative  typeOfValue: 'test' })
  expect(status).toBe(404)
})

test('DELETE /child-dps/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${childDp.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /child-dps/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${childDp.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /child-dps/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${childDp.id}`)
  expect(status).toBe(401)
})

test('DELETE /child-dps/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
