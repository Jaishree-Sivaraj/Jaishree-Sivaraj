import { CompanySources } from '.'

let companySources

beforeEach(async () => {
  companySources = await CompanySources.create({ sourceTypeId: 'test', sourceUrl: 'test', sourceFile: 'test', publicationDate: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = companySources.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(companySources.id)
    expect(view.sourceTypeId).toBe(companySources.sourceTypeId)
    expect(view.sourceUrl).toBe(companySources.sourceUrl)
    expect(view.sourceFile).toBe(companySources.sourceFile)
    expect(view.publicationDate).toBe(companySources.publicationDate)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = companySources.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(companySources.id)
    expect(view.sourceTypeId).toBe(companySources.sourceTypeId)
    expect(view.sourceUrl).toBe(companySources.sourceUrl)
    expect(view.sourceFile).toBe(companySources.sourceFile)
    expect(view.publicationDate).toBe(companySources.publicationDate)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
