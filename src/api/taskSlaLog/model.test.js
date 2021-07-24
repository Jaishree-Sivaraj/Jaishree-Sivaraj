import { TaskSlaLog } from '.'
import { User } from '../user'

let user, taskSlaLog

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  taskSlaLog = await TaskSlaLog.create({ createdBy: user, taskId: 'test', currentDate: 'test', preferedDate: 'test', requestedBy: 'test', isAccepted: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = taskSlaLog.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taskSlaLog.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.taskId).toBe(taskSlaLog.taskId)
    expect(view.currentDate).toBe(taskSlaLog.currentDate)
    expect(view.preferedDate).toBe(taskSlaLog.preferedDate)
    expect(view.requestedBy).toBe(taskSlaLog.requestedBy)
    expect(view.isAccepted).toBe(taskSlaLog.isAccepted)
    expect(view.status).toBe(taskSlaLog.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = taskSlaLog.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taskSlaLog.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.taskId).toBe(taskSlaLog.taskId)
    expect(view.currentDate).toBe(taskSlaLog.currentDate)
    expect(view.preferedDate).toBe(taskSlaLog.preferedDate)
    expect(view.requestedBy).toBe(taskSlaLog.requestedBy)
    expect(view.isAccepted).toBe(taskSlaLog.isAccepted)
    expect(view.status).toBe(taskSlaLog.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
