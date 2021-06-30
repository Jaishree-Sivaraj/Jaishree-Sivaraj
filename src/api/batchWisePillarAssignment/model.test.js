import { BatchWisePillarAssignment } from '.'

let batchWisePillarAssignment

beforeEach(async () => {
  batchWisePillarAssignment = await BatchWisePillarAssignment.create({ userId: 'test', batchId: 'test', pillars: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = batchWisePillarAssignment.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(batchWisePillarAssignment.id)
    expect(view.userId).toBe(batchWisePillarAssignment.userId)
    expect(view.batchId).toBe(batchWisePillarAssignment.batchId)
    expect(view.pillars).toBe(batchWisePillarAssignment.pillars)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = batchWisePillarAssignment.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(batchWisePillarAssignment.id)
    expect(view.userId).toBe(batchWisePillarAssignment.userId)
    expect(view.batchId).toBe(batchWisePillarAssignment.batchId)
    expect(view.pillars).toBe(batchWisePillarAssignment.pillars)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
