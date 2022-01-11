import { Conversiontypes } from '.'

let conversiontypes

beforeEach(async () => {
  conversiontypes = await Conversiontypes.create({ typeName: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = conversiontypes.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(conversiontypes.id)
    expect(view.typeName).toBe(conversiontypes.typeName)
    expect(view.status).toBe(conversiontypes.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = conversiontypes.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(conversiontypes.id)
    expect(view.typeName).toBe(conversiontypes.typeName)
    expect(view.status).toBe(conversiontypes.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
