import { Comments } from '.'
import { User } from '../user'

let user, comments

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  comments = await Comments.create({ createdBy: user, userId: 'test', name: 'test', description: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = comments.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(comments.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.userId).toBe(comments.userId)
    expect(view.name).toBe(comments.name)
    expect(view.description).toBe(comments.description)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = comments.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(comments.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.userId).toBe(comments.userId)
    expect(view.name).toBe(comments.name)
    expect(view.description).toBe(comments.description)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
