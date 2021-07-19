import { ControversyTaskHistories } from '.'

let controversyTaskHistories

beforeEach(async () => {
  controversyTaskHistories = await ControversyTaskHistories.create({ taskId: 'test', companyId: 'test', analystId: 'test', stage: 'test', status: 'test', createdBy: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = controversyTaskHistories.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(controversyTaskHistories.id)
    expect(view.taskId).toBe(controversyTaskHistories.taskId)
    expect(view.companyId).toBe(controversyTaskHistories.companyId)
    expect(view.analystId).toBe(controversyTaskHistories.analystId)
    expect(view.stage).toBe(controversyTaskHistories.stage)
    expect(view.status).toBe(controversyTaskHistories.status)
    expect(view.createdBy).toBe(controversyTaskHistories.createdBy)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = controversyTaskHistories.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(controversyTaskHistories.id)
    expect(view.taskId).toBe(controversyTaskHistories.taskId)
    expect(view.companyId).toBe(controversyTaskHistories.companyId)
    expect(view.analystId).toBe(controversyTaskHistories.analystId)
    expect(view.stage).toBe(controversyTaskHistories.stage)
    expect(view.status).toBe(controversyTaskHistories.status)
    expect(view.createdBy).toBe(controversyTaskHistories.createdBy)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
