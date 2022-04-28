import request from 'supertest'
import { apiRoot } from '../../config'
import { signSync } from '../../services/jwt'
import express from '../../services/express'
import { User } from '../user'
import routes, { MasterCompanies } from '.'

const app = () => express(apiRoot, routes)

let userSession, adminSession, masterCompanies

beforeEach(async () => {
  const user = await User.create({ email: 'a@a.com', password: '123456' })
  const admin = await User.create({ email: 'c@c.com', password: '123456', role: 'admin' })
  userSession = signSync(user.id)
  adminSession = signSync(admin.id)
  masterCompanies = await MasterCompanies.create({})
})

test('POST /mastercompanies 201 (admin)', async () => {
  const { status, body } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: adminSession, createdBy: 'test', companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', socialAnalystName: 'test', socialQAName: 'test', companyMemberDetails: 'test', fiscalYearEndDate: 'test', fiscalYearEndMonth: 'test', isAssignedToBatch: 'test', status: 'test' })
  expect(status).toBe(201)
  expect(typeof body).toEqual('object')
  expect(body.createdBy).toEqual('test')
  expect(body.companyName).toEqual('test')
  expect(body.cin).toEqual('test')
  expect(body.nicCode).toEqual('test')
  expect(body.nic).toEqual('test')
  expect(body.nicIndustry).toEqual('test')
  expect(body.isinCode).toEqual('test')
  expect(body.cmieProwessCode).toEqual('test')
  expect(body.socialAnalystName).toEqual('test')
  expect(body.socialQAName).toEqual('test')
  expect(body.companyMemberDetails).toEqual('test')
  expect(body.fiscalYearEndDate).toEqual('test')
  expect(body.fiscalYearEndMonth).toEqual('test')
  expect(body.isAssignedToBatch).toEqual('test')
  expect(body.status).toEqual('test')
})

test('POST /mastercompanies 401 (user)', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('POST /mastercompanies 401', async () => {
  const { status } = await request(app())
    .post(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /mastercompanies 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(Array.isArray(body.rows)).toBe(true)
  expect(Number.isNaN(body.count)).toBe(false)
})

test('GET /mastercompanies 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /mastercompanies 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}`)
  expect(status).toBe(401)
})

test('GET /mastercompanies/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .get(`${apiRoot}/${masterCompanies.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(masterCompanies.id)
})

test('GET /mastercompanies/:id 401 (user)', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${masterCompanies.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('GET /mastercompanies/:id 401', async () => {
  const { status } = await request(app())
    .get(`${apiRoot}/${masterCompanies.id}`)
  expect(status).toBe(401)
})

test('GET /mastercompanies/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .get(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})

test('PUT /mastercompanies/:id 200 (admin)', async () => {
  const { status, body } = await request(app())
    .put(`${apiRoot}/${masterCompanies.id}`)
    .send({ access_token: adminSession, createdBy: 'test', companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', socialAnalystName: 'test', socialQAName: 'test', companyMemberDetails: 'test', fiscalYearEndDate: 'test', fiscalYearEndMonth: 'test', isAssignedToBatch: 'test', status: 'test' })
  expect(status).toBe(200)
  expect(typeof body).toEqual('object')
  expect(body.id).toEqual(masterCompanies.id)
  expect(body.createdBy).toEqual('test')
  expect(body.companyName).toEqual('test')
  expect(body.cin).toEqual('test')
  expect(body.nicCode).toEqual('test')
  expect(body.nic).toEqual('test')
  expect(body.nicIndustry).toEqual('test')
  expect(body.isinCode).toEqual('test')
  expect(body.cmieProwessCode).toEqual('test')
  expect(body.socialAnalystName).toEqual('test')
  expect(body.socialQAName).toEqual('test')
  expect(body.companyMemberDetails).toEqual('test')
  expect(body.fiscalYearEndDate).toEqual('test')
  expect(body.fiscalYearEndMonth).toEqual('test')
  expect(body.isAssignedToBatch).toEqual('test')
  expect(body.status).toEqual('test')
})

test('PUT /mastercompanies/:id 401 (user)', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${masterCompanies.id}`)
    .send({ access_token: userSession })
  expect(status).toBe(401)
})

test('PUT /mastercompanies/:id 401', async () => {
  const { status } = await request(app())
    .put(`${apiRoot}/${masterCompanies.id}`)
  expect(status).toBe(401)
})

test('PUT /mastercompanies/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .put(apiRoot + '/123456789098765432123456')
    .send({ access_token: adminSession, createdBy: 'test', companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', socialAnalystName: 'test', socialQAName: 'test', companyMemberDetails: 'test', fiscalYearEndDate: 'test', fiscalYearEndMonth: 'test', isAssignedToBatch: 'test', status: 'test' })
  expect(status).toBe(404)
})

test('DELETE /mastercompanies/:id 204 (admin)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${masterCompanies.id}`)
    .query({ access_token: adminSession })
  expect(status).toBe(204)
})

test('DELETE /mastercompanies/:id 401 (user)', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${masterCompanies.id}`)
    .query({ access_token: userSession })
  expect(status).toBe(401)
})

test('DELETE /mastercompanies/:id 401', async () => {
  const { status } = await request(app())
    .delete(`${apiRoot}/${masterCompanies.id}`)
  expect(status).toBe(401)
})

test('DELETE /mastercompanies/:id 404 (admin)', async () => {
  const { status } = await request(app())
    .delete(apiRoot + '/123456789098765432123456')
    .query({ access_token: adminSession })
  expect(status).toBe(404)
})
