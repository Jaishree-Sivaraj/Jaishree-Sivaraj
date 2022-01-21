import { PlaceValues } from '.'

let placeValues

beforeEach(async () => {
  placeValues = await PlaceValues.create({ name: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = placeValues.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(placeValues.id)
    expect(view.name).toBe(placeValues.name)
    expect(view.status).toBe(placeValues.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = placeValues.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(placeValues.id)
    expect(view.name).toBe(placeValues.name)
    expect(view.status).toBe(placeValues.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
