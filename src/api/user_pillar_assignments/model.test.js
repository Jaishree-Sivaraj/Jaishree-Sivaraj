import { UserPillarAssignments } from '.'
import { User } from '../user'

let user, userPillarAssignments

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  userPillarAssignments = await UserPillarAssignments.create({ createdBy: user, clientTaxonomyId: 'test', primaryPillar: 'test', secondaryPillar: 'test', userId: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = userPillarAssignments.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(userPillarAssignments.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.clientTaxonomyId).toBe(userPillarAssignments.clientTaxonomyId)
    expect(view.primaryPillar).toBe(userPillarAssignments.primaryPillar)
    expect(view.secondaryPillar).toBe(userPillarAssignments.secondaryPillar)
    expect(view.userId).toBe(userPillarAssignments.userId)
    expect(view.status).toBe(userPillarAssignments.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = userPillarAssignments.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(userPillarAssignments.id)
    expect(typeof view.createdBy).toBe('object')
    expect(view.createdBy.id).toBe(user.id)
    expect(view.clientTaxonomyId).toBe(userPillarAssignments.clientTaxonomyId)
    expect(view.primaryPillar).toBe(userPillarAssignments.primaryPillar)
    expect(view.secondaryPillar).toBe(userPillarAssignments.secondaryPillar)
    expect(view.userId).toBe(userPillarAssignments.userId)
    expect(view.status).toBe(userPillarAssignments.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
