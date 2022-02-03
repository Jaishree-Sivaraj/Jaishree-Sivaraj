import { ChildDp } from '.'

let childDp

beforeEach(async () => {
  childDp = await ChildDp.create({ companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = childDp.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(childDp.id)
    expect(view.companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue).toBe(childDp.companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = childDp.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(childDp.id)
    expect(view.companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue).toBe(childDp.companyDataElementLabel, companyDataElementSubLabel, dataType, dataValue, formatOfDataProvidedByCompany, keywordUsed, pageNumber, sectionOfDocument, snapshotsupportingNarrative, typeOfValue)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
