import { ProjectedValues } from '.'
import { User } from '../user'

let user, projectedValues

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  projectedValues = await ProjectedValues.create({ createdBy: user, clientTaxonomyId: 'test', nic: 'test', categoryId: 'test', year: 'test', datapointId: 'test', projectedStdDeviation: 'test', projectedAverage: 'test', actualStdDeviation: 'test', actualAverage: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = projectedValues.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(projectedValues.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.clientTaxonomyId).toBe(projectedValues.clientTaxonomyId)
    expect(view.nic).toBe(projectedValues.nic)
    expect(view.categoryId).toBe(projectedValues.categoryId)
    expect(view.year).toBe(projectedValues.year)
    expect(view.datapointId).toBe(projectedValues.datapointId)
    expect(view.projectedStdDeviation).toBe(projectedValues.projectedStdDeviation)
    expect(view.projectedAverage).toBe(projectedValues.projectedAverage)
    expect(view.actualStdDeviation).toBe(projectedValues.actualStdDeviation)
    expect(view.actualAverage).toBe(projectedValues.actualAverage)
    expect(view.status).toBe(projectedValues.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = projectedValues.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(projectedValues.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.clientTaxonomyId).toBe(projectedValues.clientTaxonomyId)
    expect(view.nic).toBe(projectedValues.nic)
    expect(view.categoryId).toBe(projectedValues.categoryId)
    expect(view.year).toBe(projectedValues.year)
    expect(view.datapointId).toBe(projectedValues.datapointId)
    expect(view.projectedStdDeviation).toBe(projectedValues.projectedStdDeviation)
    expect(view.projectedAverage).toBe(projectedValues.projectedAverage)
    expect(view.actualStdDeviation).toBe(projectedValues.actualStdDeviation)
    expect(view.actualAverage).toBe(projectedValues.actualAverage)
    expect(view.status).toBe(projectedValues.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
