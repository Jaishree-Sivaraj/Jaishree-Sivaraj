import { SourceSubTypes } from '.'

let sourceSubTypes

beforeEach(async () => {
  sourceSubTypes = await SourceSubTypes.create({ subTypeName: 'test', description: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = sourceSubTypes.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(sourceSubTypes.id)
    expect(view.subTypeName).toBe(sourceSubTypes.subTypeName)
    expect(view.description).toBe(sourceSubTypes.description)
    expect(view.status).toBe(sourceSubTypes.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = sourceSubTypes.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(sourceSubTypes.id)
    expect(view.subTypeName).toBe(sourceSubTypes.subTypeName)
    expect(view.description).toBe(sourceSubTypes.description)
    expect(view.status).toBe(sourceSubTypes.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
