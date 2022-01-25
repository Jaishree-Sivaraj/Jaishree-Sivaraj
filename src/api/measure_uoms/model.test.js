import { MeasureUoms } from '.'
import { User } from '../user'

let user, measureUoms

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  measureUoms = await MeasureUoms.create({ createdBy: user, measureId: 'test', uomName: 'test', description: 'test', orderNumber: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = measureUoms.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(measureUoms.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureId).toBe(measureUoms.measureId)
    expect(view.uomName).toBe(measureUoms.uomName)
    expect(view.description).toBe(measureUoms.description)
    expect(view.orderNumber).toBe(measureUoms.orderNumber)
    expect(view.status).toBe(measureUoms.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = measureUoms.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(measureUoms.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureId).toBe(measureUoms.measureId)
    expect(view.uomName).toBe(measureUoms.uomName)
    expect(view.description).toBe(measureUoms.description)
    expect(view.orderNumber).toBe(measureUoms.orderNumber)
    expect(view.status).toBe(measureUoms.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
