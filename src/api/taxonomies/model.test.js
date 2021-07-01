import { Taxonomies } from '.'
import { User } from '../user'

let user, taxonomies

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  taxonomies = await Taxonomies.create({ createdBy: user, name: 'test', fieldName: 'test', description: 'test', isRequired: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = taxonomies.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taxonomies.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.name).toBe(taxonomies.name)
    expect(view.fieldName).toBe(taxonomies.fieldName)
    expect(view.description).toBe(taxonomies.description)
    expect(view.isRequired).toBe(taxonomies.isRequired)
    expect(view.status).toBe(taxonomies.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = taxonomies.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taxonomies.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.name).toBe(taxonomies.name)
    expect(view.fieldName).toBe(taxonomies.fieldName)
    expect(view.description).toBe(taxonomies.description)
    expect(view.isRequired).toBe(taxonomies.isRequired)
    expect(view.status).toBe(taxonomies.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
