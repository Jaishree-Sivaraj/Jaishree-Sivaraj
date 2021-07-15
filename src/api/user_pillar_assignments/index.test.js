import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { UserPillarAssignments } from '.'

const app = () => express(apiRoot, routes)

let userSession, anotherSession, userPillarAssignments

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const anotherUser = await User.create({ email: 'b@b.com', password: '123456' })
  userSession = signSync(user.id)
  anotherSession = signSync(anotherUser.id)
  userPillarAssignments = await UserPillarAssignments.create({ createdBy: user })
})

test('POST /user_pillar_assignments 201 (user)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession, clientTaxonomyId: 'test', primaryPillar: 'test', secondaryPillar: 'test', userId: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.clientTaxonomyId).toEqual('test')
  expect(body.primaryPillar).toEqual('test')
  expect(body.secondaryPillar).toEqual('test')
  expect(body.userId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('POST /user_pillar_assignments 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /user_pillar_assignments 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
  expect(typeof body.rows[0].createdBy).toEqual('object')
})

test('GET /user_pillar_assignments 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /user_pillar_assignments/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${userPillarAssignments.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(userPillarAssignments.id)
  expect(typeof body.createdBy).toEqual('object')
})

test('GET /user_pillar_assignments/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${userPillarAssignments.id}`)
  expect(status).toBe(401)
})

test('GET /user_pillar_assignments/:id 404 (user)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: userSession })
  expect(status).toBe(404)
})

test('PUT /user_pillar_assignments/:id 200 (user)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${userPillarAssignments.id}`)
    .send({ access_token: userSession, clientTaxonomyId: 'test', primaryPillar: 'test', secondaryPillar: 'test', userId: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(userPillarAssignments.id)
  expect(body.clientTaxonomyId).toEqual('test')
  expect(body.primaryPillar).toEqual('test')
  expect(body.secondaryPillar).toEqual('test')
  expect(body.userId).toEqual('test')
  expect(body.status).toEqual('test')
  expect(typeof body.createdBy).toEqual('object')
})

test('PUT /user_pillar_assignments/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${userPillarAssignments.id}`)
    .send({ access_token: anotherSession, clientTaxonomyId: 'test', primaryPillar: 'test', secondaryPillar: 'test', userId: 'test', status: 'test' })
  expect(status).toBe(401)
})

test('PUT /user_pillar_assignments/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${userPillarAssignments.id}`)
  expect(status).toBe(401)
})

test('PUT /user_pillar_assignments/:id 404 (user)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: anotherSession, clientTaxonomyId: 'test', primaryPillar: 'test', secondaryPillar: 'test', userId: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /user_pillar_assignments/:id 204 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${userPillarAssignments.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(204)
})

test('DELETE /user_pillar_assignments/:id 401 (user) - another user', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${userPillarAssignments.id}`)
    .send({ access_token: anotherSession })
  expect(status).toBe(401)
})

test('DELETE /user_pillar_assignments/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${userPillarAssignments.id}`)
  expect(status).toBe(401)
})

test('DELETE /user_pillar_assignments/:id 404 (user)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: anotherSession })
  expect(status).toBe(404)
})
