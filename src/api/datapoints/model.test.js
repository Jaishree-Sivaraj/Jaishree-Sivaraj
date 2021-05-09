import { Datapoints } from '.'
import { User } from '../user'

let user, datapoints

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  datapoints = await Datapoints.create({ updatedBy: user, name: 'test', code: 'test', description: 'test', dataCollection: 'test', unit: 'test', signal: 'test', percentile: 'test', finalUnit: 'test', keyIssueId: 'test', functionId: 'test', dpType: 'test', year: 'test', companyTaxonomyId: 'test', dpStatus: 'test', sourceName: 'test', sourceUrl: 'test', sourcePublicationDate: 'test', pageNumber: 'test', textSnippet: 'test', screenshotType: 'test', filePath: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = datapoints.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(datapoints.id)
    expect(typeof view.updatedBy).toBe('object')
    expect(view.updatedBy.id).toBe(user.id)
    expect(view.name).toBe(datapoints.name)
    expect(view.code).toBe(datapoints.code)
    expect(view.description).toBe(datapoints.description)
    expect(view.dataCollection).toBe(datapoints.dataCollection)
    expect(view.unit).toBe(datapoints.unit)
    expect(view.signal).toBe(datapoints.signal)
    expect(view.percentile).toBe(datapoints.percentile)
    expect(view.finalUnit).toBe(datapoints.finalUnit)
    expect(view.keyIssueId).toBe(datapoints.keyIssueId)
    expect(view.functionId).toBe(datapoints.functionId)
    expect(view.dpType).toBe(datapoints.dpType)
    expect(view.year).toBe(datapoints.year)
    expect(view.companyTaxonomyId).toBe(datapoints.companyTaxonomyId)
    expect(view.dpStatus).toBe(datapoints.dpStatus)
    expect(view.sourceName).toBe(datapoints.sourceName)
    expect(view.sourceUrl).toBe(datapoints.sourceUrl)
    expect(view.sourcePublicationDate).toBe(datapoints.sourcePublicationDate)
    expect(view.pageNumber).toBe(datapoints.pageNumber)
    expect(view.textSnippet).toBe(datapoints.textSnippet)
    expect(view.screenshotType).toBe(datapoints.screenshotType)
    expect(view.filePath).toBe(datapoints.filePath)
    expect(view.status).toBe(datapoints.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = datapoints.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(datapoints.id)
    expect(typeof view.updatedBy).toBe('object')
    expect(view.updatedBy.id).toBe(user.id)
    expect(view.name).toBe(datapoints.name)
    expect(view.code).toBe(datapoints.code)
    expect(view.description).toBe(datapoints.description)
    expect(view.dataCollection).toBe(datapoints.dataCollection)
    expect(view.unit).toBe(datapoints.unit)
    expect(view.signal).toBe(datapoints.signal)
    expect(view.percentile).toBe(datapoints.percentile)
    expect(view.finalUnit).toBe(datapoints.finalUnit)
    expect(view.keyIssueId).toBe(datapoints.keyIssueId)
    expect(view.functionId).toBe(datapoints.functionId)
    expect(view.dpType).toBe(datapoints.dpType)
    expect(view.year).toBe(datapoints.year)
    expect(view.companyTaxonomyId).toBe(datapoints.companyTaxonomyId)
    expect(view.dpStatus).toBe(datapoints.dpStatus)
    expect(view.sourceName).toBe(datapoints.sourceName)
    expect(view.sourceUrl).toBe(datapoints.sourceUrl)
    expect(view.sourcePublicationDate).toBe(datapoints.sourcePublicationDate)
    expect(view.pageNumber).toBe(datapoints.pageNumber)
    expect(view.textSnippet).toBe(datapoints.textSnippet)
    expect(view.screenshotType).toBe(datapoints.screenshotType)
    expect(view.filePath).toBe(datapoints.filePath)
    expect(view.status).toBe(datapoints.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
