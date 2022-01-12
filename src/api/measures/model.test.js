import { Measures } from '.'
import { User } from '../user'

let user, measures

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  measures = await Measures.create({ createdBy: user, measureName: 'test', measureDescription: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = measures.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(measures.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureName).toBe(measures.measureName)
    expect(view.measureDescription).toBe(measures.measureDescription)
    expect(view.status).toBe(measures.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = measures.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(measures.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureName).toBe(measures.measureName)
    expect(view.measureDescription).toBe(measures.measureDescription)
    expect(view.status).toBe(measures.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
