import { Resources } from '.'

let resources

beforeEach(async () => {
  resources = await Resources.create({})
})

describe('view', () => {
  it('returns simple view', () => {
    const view = resources.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(resources.id)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = resources.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(resources.id)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
