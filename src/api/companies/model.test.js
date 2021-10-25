import { Companies } from '.'
import { User } from '../user'

let user, companies

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  companies = await Companies.create({ createdBy: user, companyName: 'test', cin: 'test', nicCode: 'test', nic: 'test', nicIndustry: 'test', isinCode: 'test', cmieProwessCode: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = companies.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(companies.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.clientTaxonomyId).toBe(companies.clientTaxonomyId)
    expect(view.companyName).toBe(companies.companyName)
    expect(view.cin).toBe(companies.cin)
    expect(view.nicCode).toBe(companies.nicCode)
    expect(view.nic).toBe(companies.nic)
    expect(view.nicIndustry).toBe(companies.nicIndustry)
    expect(view.isinCode).toBe(companies.isinCode)
    expect(view.cmieProwessCode).toBe(companies.cmieProwessCode)
    expect(view.status).toBe(companies.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = companies.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(companies.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.clientTaxonomyId).toBe(companies.clientTaxonomyId)
    expect(view.companyName).toBe(companies.companyName)
    expect(view.cin).toBe(companies.cin)
    expect(view.nicCode).toBe(companies.nicCode)
    expect(view.nic).toBe(companies.nic)
    expect(view.nicIndustry).toBe(companies.nicIndustry)
    expect(view.isinCode).toBe(companies.isinCode)
    expect(view.cmieProwessCode).toBe(companies.cmieProwessCode)
    expect(view.status).toBe(companies.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
