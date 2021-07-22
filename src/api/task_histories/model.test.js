import { TaskHistories } from '.'

let taskHistories

beforeEach(async () => {
  taskHistories = await TaskHistories.create({ taskId: 'test', companyId: 'test', categoryId: 'test', submittedByName: 'test', stage: 'test', comment: 'test', status: 'test', createdBy: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = taskHistories.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taskHistories.id)
    expect(view.taskId).toBe(taskHistories.taskId)
    expect(view.companyId).toBe(taskHistories.companyId)
    expect(view.categoryId).toBe(taskHistories.categoryId)
    expect(view.submittedByName).toBe(taskHistories.submittedByName)
    expect(view.stage).toBe(taskHistories.stage)
    expect(view.comment).toBe(taskHistories.comment)
    expect(view.status).toBe(taskHistories.status)
    expect(view.createdBy).toBe(taskHistories.createdBy)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = taskHistories.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taskHistories.id)
    expect(view.taskId).toBe(taskHistories.taskId)
    expect(view.companyId).toBe(taskHistories.companyId)
    expect(view.categoryId).toBe(taskHistories.categoryId)
    expect(view.submittedByName).toBe(taskHistories.submittedByName)
    expect(view.stage).toBe(taskHistories.stage)
    expect(view.comment).toBe(taskHistories.comment)
    expect(view.status).toBe(taskHistories.status)
    expect(view.createdBy).toBe(taskHistories.createdBy)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
