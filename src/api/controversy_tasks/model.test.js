import { ControversyTasks } from '.'

let controversyTasks

beforeEach(async () => {
  controversyTasks = await ControversyTasks.create({ createdBy: user, tasknumber: 'test', companyId: 'test', analystId: 'test', taskStatus: 'test', completedDate: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = controversyTasks.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(controversyTasks.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.tasknumber).toBe(controversyTasks.tasknumber)
    expect(view.companyId).toBe(controversyTasks.companyId)
    expect(view.analystId).toBe(controversyTasks.analystId)
    expect(view.taskStatus).toBe(controversyTasks.taskStatus)
    expect(view.completedDate).toBe(controversyTasks.completedDate)
    expect(view.status).toBe(controversyTasks.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = controversyTasks.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(controversyTasks.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.tasknumber).toBe(controversyTasks.tasknumber)
    expect(view.companyId).toBe(controversyTasks.companyId)
    expect(view.analystId).toBe(controversyTasks.analystId)
    expect(view.taskStatus).toBe(controversyTasks.taskStatus)
    expect(view.completedDate).toBe(controversyTasks.completedDate)
    expect(view.status).toBe(controversyTasks.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
