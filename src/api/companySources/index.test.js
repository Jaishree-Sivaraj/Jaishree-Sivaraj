import request from 'supertest'
import { apiRoot } from '../../config'
import express from '../../services/express'
import routes, { CompanySources } from '.'

const app = () => express(apiRoot, routes)

let companySources

beforeEach(async () => {
  companySources = await CompanySources.create({})
})

test('POST /companySources 201', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ sourceTypeId: 'test', sourceUrl: 'test', sourceFile: 'test', publicationDate: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.sourceTypeId).toEqual('test')
  expect(body.sourceUrl).toEqual('test')
  expect(body.sourceFile).toEqual('test')
  expect(body.publicationDate).toEqual('test')
})

test('GET /companySources 200', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /companySources/:id 200', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${companySources.id}`)
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(companySources.id)
})

test('GET /companySources/:id 404', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
  expect(status).toBe(404)
})

test('PUT /companySources/:id 200', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${companySources.id}`)
    .send({ sourceTypeId: 'test', sourceUrl: 'test', sourceFile: 'test', publicationDate: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(companySources.id)
  expect(body.sourceTypeId).toEqual('test')
  expect(body.sourceUrl).toEqual('test')
  expect(body.sourceFile).toEqual('test')
  expect(body.publicationDate).toEqual('test')
})

test('PUT /companySources/:id 404', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ sourceTypeId: 'test', sourceUrl: 'test', sourceFile: 'test', publicationDate: 'test' })
  expect(status).toBe(404)
})

test('DELETE /companySources/:id 204', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${companySources.id}`)
  expect(status).toBe(204)
})

test('DELETE /companySources/:id 404', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
  expect(status).toBe(404)
})
