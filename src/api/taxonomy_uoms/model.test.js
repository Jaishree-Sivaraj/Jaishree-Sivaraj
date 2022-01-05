import { TaxonomyUoms } from '.'
import { User } from '../user'

let user, taxonomyUoms

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  taxonomyUoms = await TaxonomyUoms.create({ createdBy: user, measureId: 'test', measureUomId: 'test', uomConversionId: 'test', clientTaxonomyId: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = taxonomyUoms.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taxonomyUoms.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureId).toBe(taxonomyUoms.measureId)
    expect(view.measureUomId).toBe(taxonomyUoms.measureUomId)
    expect(view.uomConversionId).toBe(taxonomyUoms.uomConversionId)
    expect(view.clientTaxonomyId).toBe(taxonomyUoms.clientTaxonomyId)
    expect(view.status).toBe(taxonomyUoms.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = taxonomyUoms.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(taxonomyUoms.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureId).toBe(taxonomyUoms.measureId)
    expect(view.measureUomId).toBe(taxonomyUoms.measureUomId)
    expect(view.uomConversionId).toBe(taxonomyUoms.uomConversionId)
    expect(view.clientTaxonomyId).toBe(taxonomyUoms.clientTaxonomyId)
    expect(view.status).toBe(taxonomyUoms.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
