import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { ValidationResults } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, validationResults

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  validationResults = await ValidationResults.create({ createdBy: user })
})

test('POST /validation_results 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, taskId: 'test', dpCode: 'test', dpCodeId: 'test', companyId: 'test', companyName: 'test', keyIssueId: 'test', keyIssue: 'test', pillarId: 'test', pillar: 'test', dataType: 'test', fiscalYear: 'test', memberName: 'test', memberId: 'test', memberType: 'test', isValidResponse: 'test', description: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.taskId).toEqual('test')
  expect(body.dpCode).toEqual('test')
  expect(body.dpCodeId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.companyName).toEqual('test')
  expect(body.keyIssueId).toEqual('test')
  expect(body.keyIssue).toEqual('test')
  expect(body.pillarId).toEqual('test')
  expect(body.pillar).toEqual('test')
  expect(body.dataType).toEqual('test')
  expect(body.fiscalYear).toEqual('test')
  expect(body.memberName).toEqual('test')
  expect(body.memberId).toEqual('test')
  expect(body.memberType).toEqual('test')
  expect(body.isValidResponse).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /validation_results 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /validation_results 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /validation_results 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /validation_results/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${validationResults.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(validationResults.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /validation_results/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${validationResults.id}`)
  expect(status).toBe(401)
})

test('GET /validation_results/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /validation_results/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${validationResults.id}`)
    .send({ access_token: userSession, taskId: 'test', dpCode: 'test', dpCodeId: 'test', companyId: 'test', companyName: 'test', keyIssueId: 'test', keyIssue: 'test', pillarId: 'test', pillar: 'test', dataType: 'test', fiscalYear: 'test', memberName: 'test', memberId: 'test', memberType: 'test', isValidResponse: 'test', description: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(validationResults.id)
  expect(body.taskId).toEqual('test')
  expect(body.dpCode).toEqual('test')
  expect(body.dpCodeId).toEqual('test')
  expect(body.companyId).toEqual('test')
  expect(body.companyName).toEqual('test')
  expect(body.keyIssueId).toEqual('test')
  expect(body.keyIssue).toEqual('test')
  expect(body.pillarId).toEqual('test')
  expect(body.pillar).toEqual('test')
  expect(body.dataType).toEqual('test')
  expect(body.fiscalYear).toEqual('test')
  expect(body.memberName).toEqual('test')
  expect(body.memberId).toEqual('test')
  expect(body.memberType).toEqual('test')
  expect(body.isValidResponse).toEqual('test')
  expect(body.description).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /validation_results/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${validationResults.id}`)
    .send({ access_token: anotherSession, taskId: 'test', dpCode: 'test', dpCodeId: 'test', companyId: 'test', companyName: 'test', keyIssueId: 'test', keyIssue: 'test', pillarId: 'test', pillar: 'test', dataType: 'test', fiscalYear: 'test', memberName: 'test', memberId: 'test', memberType: 'test', isValidResponse: 'test', description: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /validation_results/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${validationResults.id}`)
  expect(status).toBe(401)
})

test('PUT /validation_results/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, taskId: 'test', dpCode: 'test', dpCodeId: 'test', companyId: 'test', companyName: 'test', keyIssueId: 'test', keyIssue: 'test', pillarId: 'test', pillar: 'test', dataType: 'test', fiscalYear: 'test', memberName: 'test', memberId: 'test', memberType: 'test', isValidResponse: 'test', description: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /validation_results/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${validationResults.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /validation_results/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${validationResults.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /validation_results/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${validationResults.id}`)
  expect(status).toBe(401)
})

test('DELETE /validation_results/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
