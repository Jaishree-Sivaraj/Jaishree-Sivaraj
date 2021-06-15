import { SourceTypes } from '.'

let sourceTypes

beforeEach(async () => {
  sourceTypes = await SourceTypes.create({ typeName: 'test', duration: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = sourceTypes.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(sourceTypes.id)
    expect(view.typeName).toBe(sourceTypes.typeName)
    expect(view.duration).toBe(sourceTypes.duration)
    expect(view.status).toBe(sourceTypes.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = sourceTypes.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(sourceTypes.id)
    expect(view.typeName).toBe(sourceTypes.typeName)
    expect(view.duration).toBe(sourceTypes.duration)
    expect(view.status).toBe(sourceTypes.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
