import { OnboardingEmails } from '.'
import { User } from '../user'

let user, onboardingEmails

beforeEach(async () => {
  user = await User.create({ email: 'a@a.com', password: '123456' })
  onboardingEmails = await OnboardingEmails.create({ user, emailId: 'test', isOnboarded: 'test' })
})

describe('view', () => {
  it('returns simple view', () => {
    const view = onboardingEmails.view()
    expect(typeof view).toBe('object')
    expect(view.id).toBe(onboardingEmails.id)
    expect(typeof view.user).toBe('object')
    expect(view.user.id).toBe(user.id)
    expect(view.emailId).toBe(onboardingEmails.emailId)
    expect(view.isOnboarded).toBe(onboardingEmails.isOnboarded)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })

  it('returns full view', () => {
    const view = onboardingEmails.view(true)
    expect(typeof view).toBe('object')
    expect(view.id).toBe(onboardingEmails.id)
    expect(typeof view.user).toBe('object')
    expect(view.user.id).toBe(user.id)
    expect(view.emailId).toBe(onboardingEmails.emailId)
    expect(view.isOnboarded).toBe(onboardingEmails.isOnboarded)
    expect(view.createdAt).toBeTruthy()
    expect(view.updatedAt).toBeTruthy()
  })
})
