import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { Companies } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, companies

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  companies = await Companies.create({ createdBy: user })
})

test('POST /companies 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.companyName).toEqual('test')
  expect(body.cin).toEqual('test')
  expect(body.nicCode).toEqual('test')
  expect(body.nic).toEqual('test')
  expect(body.nicIndustry).toEqual('test')
  expect(body.isinCode).toEqual('test')
  expect(body.cmieProwessCode).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /companies 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /companies 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /companies 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /companies/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${companies.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(companies.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /companies/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${companies.id}`)
  expect(status).toBe(401)
})

test('GET /companies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /companies/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${companies.id}`)
    .send({ access_token: userSession, companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(companies.id)
  expect(body.companyName).toEqual('test')
  expect(body.cin).toEqual('test')
  expect(body.nicCode).toEqual('test')
  expect(body.nic).toEqual('test')
  expect(body.nicIndustry).toEqual('test')
  expect(body.isinCode).toEqual('test')
  expect(body.cmieProwessCode).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /companies/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${companies.id}`)
    .send({ access_token: anotherSession, companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /companies/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${companies.id}`)
  expect(status).toBe(401)
})

test('PUT /companies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /companies/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companies.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /companies/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companies.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /companies/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companies.id}`)
  expect(status).toBe(401)
})

test('DELETE /companies/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
