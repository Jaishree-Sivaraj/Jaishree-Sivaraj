import { CompaniesTasks } from '.'
import { User } from '../user'

let user, companiesTasks

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  companiesTasks = await CompaniesTasks.create({ createdBy: user, taskId: 'test', companyId: 'test', year: 'test', categoryId: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = companiesTasks.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(companiesTasks.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.taskId).toBe(companiesTasks.taskId)
    expect(view.companyId).toBe(companiesTasks.companyId)
    expect(view.year).toBe(companiesTasks.year)
    expect(view.categoryId).toBe(companiesTasks.categoryId)
    expect(view.status).toBe(companiesTasks.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = companiesTasks.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(companiesTasks.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.taskId).toBe(companiesTasks.taskId)
    expect(view.companyId).toBe(companiesTasks.companyId)
    expect(view.year).toBe(companiesTasks.year)
    expect(view.categoryId).toBe(companiesTasks.categoryId)
    expect(view.status).toBe(companiesTasks.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
