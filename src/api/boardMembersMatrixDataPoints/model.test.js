import { BoardMembersMatrixDataPoints } from '.'
import { User } from '../user'

let user, boardMembersMatrixDataPoints

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  boardMembersMatrixDataPoints = await BoardMembersMatrixDataPoints.create({ createdBy: user, datapointId: 'test', boardMemberId: 'test', year: 'test', fiscalYearEndDate: 'test', response: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = boardMembersMatrixDataPoints.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(boardMembersMatrixDataPoints.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.datapointId).toBe(boardMembersMatrixDataPoints.datapointId)
    expect(view.boardMemberId).toBe(boardMembersMatrixDataPoints.boardMemberId)
    expect(view.year).toBe(boardMembersMatrixDataPoints.year)
    expect(view.fiscalYearEndDate).toBe(boardMembersMatrixDataPoints.fiscalYearEndDate)
    expect(view.response).toBe(boardMembersMatrixDataPoints.response)
    expect(view.status).toBe(boardMembersMatrixDataPoints.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = boardMembersMatrixDataPoints.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(boardMembersMatrixDataPoints.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.datapointId).toBe(boardMembersMatrixDataPoints.datapointId)
    expect(view.boardMemberId).toBe(boardMembersMatrixDataPoints.boardMemberId)
    expect(view.year).toBe(boardMembersMatrixDataPoints.year)
    expect(view.fiscalYearEndDate).toBe(boardMembersMatrixDataPoints.fiscalYearEndDate)
    expect(view.response).toBe(boardMembersMatrixDataPoints.response)
    expect(view.status).toBe(boardMembersMatrixDataPoints.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
