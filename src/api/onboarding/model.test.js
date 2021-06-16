import { Onboarding } from '.'

let onboarding

beforeEach(async () => {
  onboarding = await Onboarding.create({ email: 'test', onboardingType: 'test', content: 'test', mailStatus: 'test', status: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = onboarding.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(onboarding.id)
    expect(view.email).toBe(onboarding.email)
    expect(view.onboardingType).toBe(onboarding.onboardingType)
    expect(view.content).toBe(onboarding.content)
    expect(view.mailStatus).toBe(onboarding.mailStatus)
    expect(view.status).toBe(onboarding.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = onboarding.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(onboarding.id)
    expect(view.email).toBe(onboarding.email)
    expect(view.onboardingType).toBe(onboarding.onboardingType)
    expect(view.content).toBe(onboarding.content)
    expect(view.mailStatus).toBe(onboarding.mailStatus)
    expect(view.status).toBe(onboarding.status)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
