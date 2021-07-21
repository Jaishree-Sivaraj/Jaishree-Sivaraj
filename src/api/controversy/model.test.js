import { Controversy } from '.'
import { User } from '../user'

let user, controversy

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  controversy = await Controversy.create({ createdBy: user, datapointId: 'test', companyId: 'test', year: 'test', response: 'test', controversyDetails: 'test', comments: 'test', submittedDate: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = controversy.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(controversy.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.datapointId).toBe(controversy.datapointId)
    expect(view.companyId).toBe(controversy.companyId)
    expect(view.year).toBe(controversy.year)
    expect(view.submittedDate).toBe(controversy.submittedDate)
    expect(view.response).toBe(controversy.response)
    expect(view.controversyDetails).toBe(controversy.controversyDetails)
    expect(view.comments).toBe(controversy.comments)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = controversy.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(controversy.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.datapointId).toBe(controversy.datapointId)
    expect(view.companyId).toBe(controversy.companyId)
    expect(view.year).toBe(controversy.year)
    expect(view.submittedDate).toBe(controversy.submittedDate)
    expect(view.response).toBe(controversy.response)
    expect(view.controversyDetails).toBe(controversy.controversyDetails)
    expect(view.comments).toBe(controversy.comments)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
