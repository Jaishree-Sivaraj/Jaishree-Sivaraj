import { BoardDirector } from '.'

let boardDirector

beforeEach(async () => {
  boardDirector = await BoardDirector.create({ din: 'test', name: 'test', gender: 'test', companies: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = boardDirector.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(boardDirector.id)
    expect(view.din).toBe(boardDirector.din)
    expect(view.name).toBe(boardDirector.name)
    expect(view.gender).toBe(boardDirector.gender)
    expect(view.companies).toBe(boardDirector.companies)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = boardDirector.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(boardDirector.id)
    expect(view.din).toBe(boardDirector.din)
    expect(view.name).toBe(boardDirector.name)
    expect(view.gender).toBe(boardDirector.gender)
    expect(view.companies).toBe(boardDirector.companies)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
