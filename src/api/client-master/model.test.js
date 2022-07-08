import { ClientMaster } from '.'

let clientMaster

beforeEach(async () => {
  clientMaster = await ClientMaster.create({ clientId: 'test', clientName: 'test', taxonomy: 'test', companyList: 'test', country: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = clientMaster.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(clientMaster.id)
    expect(view.clientId).toBe(clientMaster.clientId)
    expect(view.clientName).toBe(clientMaster.clientName)
    expect(view.taxonomy).toBe(clientMaster.taxonomy)
    expect(view.companyList).toBe(clientMaster.companyList)
    expect(view.country).toBe(clientMaster.country)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = clientMaster.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(clientMaster.id)
    expect(view.clientId).toBe(clientMaster.clientId)
    expect(view.clientName).toBe(clientMaster.clientName)
    expect(view.taxonomy).toBe(clientMaster.taxonomy)
    expect(view.companyList).toBe(clientMaster.companyList)
    expect(view.country).toBe(clientMaster.country)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
