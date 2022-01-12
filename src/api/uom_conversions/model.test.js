import { UomConversions } from '.'
import { User } from '../user'

let user, uomConversions

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  uomConversions = await UomConversions.create({ createdBy: user, measureId: 'test', uomId: 'test', uomSource: 'test', uomTarget: 'test', conversionType: 'test', conversionParameter: 'test', conversionFormula: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = uomConversions.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(uomConversions.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureId).toBe(uomConversions.measureId)
    expect(view.uomId).toBe(uomConversions.uomId)
    expect(view.uomSource).toBe(uomConversions.uomSource)
    expect(view.uomTarget).toBe(uomConversions.uomTarget)
    expect(view.conversionType).toBe(uomConversions.conversionType)
    expect(view.conversionParameter).toBe(uomConversions.conversionParameter)
    expect(view.conversionFormula).toBe(uomConversions.conversionFormula)
    expect(view.status).toBe(uomConversions.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = uomConversions.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(uomConversions.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.measureId).toBe(uomConversions.measureId)
    expect(view.uomId).toBe(uomConversions.uomId)
    expect(view.uomSource).toBe(uomConversions.uomSource)
    expect(view.uomTarget).toBe(uomConversions.uomTarget)
    expect(view.conversionType).toBe(uomConversions.conversionType)
    expect(view.conversionParameter).toBe(uomConversions.conversionParameter)
    expect(view.conversionFormula).toBe(uomConversions.conversionFormula)
    expect(view.status).toBe(uomConversions.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
