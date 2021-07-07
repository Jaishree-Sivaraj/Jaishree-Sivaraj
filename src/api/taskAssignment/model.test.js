import { TaskAssignment } from '.'
import { User } from '../user'

let user, taskAssignment

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  taskAssignment = await TaskAssignment.create({ createdBy: user, companyId: 'test', categoryId: 'test', batchId: 'test', year: 'test', analystSLA: 'test', qaSLA: 'test', taskStatus: 'test', analystId: 'test', qaId: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = taskAssignment.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taskAssignment.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.companyId).toBe(taskAssignment.companyId)
    expect(view.categoryId).toBe(taskAssignment.categoryId)
    expect(view.batchId).toBe(taskAssignment.batchId)
    expect(view.year).toBe(taskAssignment.year)
    expect(view.analystSLA).toBe(taskAssignment.analystSLA)
    expect(view.qaSLA).toBe(taskAssignment.qaSLA)
    expect(view.taskStatus).toBe(taskAssignment.taskStatus)
    expect(view.analystId).toBe(taskAssignment.analystId)
    expect(view.qaId).toBe(taskAssignment.qaId)
    expect(view.status).toBe(taskAssignment.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = taskAssignment.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taskAssignment.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.companyId).toBe(taskAssignment.companyId)
    expect(view.categoryId).toBe(taskAssignment.categoryId)
    expect(view.batchId).toBe(taskAssignment.batchId)
    expect(view.year).toBe(taskAssignment.year)
    expect(view.analystSLA).toBe(taskAssignment.analystSLA)
    expect(view.qaSLA).toBe(taskAssignment.qaSLA)
    expect(view.taskStatus).toBe(taskAssignment.taskStatus)
    expect(view.analystId).toBe(taskAssignment.analystId)
    expect(view.qaId).toBe(taskAssignment.qaId)
    expect(view.status).toBe(taskAssignment.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
