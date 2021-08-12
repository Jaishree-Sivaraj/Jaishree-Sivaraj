import { JsonFiles } from '.'

let jsonFiles

beforeEach(async () => {
  jsonFiles = await JsonFiles.create({ companyId: 'test', year: 'test', type: 'test', fileName: 'test', url: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = jsonFiles.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(jsonFiles.id)
    expect(view.companyId).toBe(jsonFiles.companyId)
    expect(view.year).toBe(jsonFiles.year)
    expect(view.type).toBe(jsonFiles.type)
    expect(view.fileName).toBe(jsonFiles.fileName)
    expect(view.url).toBe(jsonFiles.url)
    expect(view.status).toBe(jsonFiles.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = jsonFiles.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(jsonFiles.id)
    expect(view.companyId).toBe(jsonFiles.companyId)
    expect(view.year).toBe(jsonFiles.year)
    expect(view.type).toBe(jsonFiles.type)
    expect(view.fileName).toBe(jsonFiles.fileName)
    expect(view.url).toBe(jsonFiles.url)
    expect(view.status).toBe(jsonFiles.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
