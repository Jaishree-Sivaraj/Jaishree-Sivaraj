import mongoose, { Schema } from 'mongoose'

const onboardingEmailsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: false
  },
  emailId: {
    type: String
  },
  isOnboarded: {
    type: String,
    default: false
  },
  status: {
    type: String,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

onboardingEmailsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      emailId: this.emailId,
      isOnboarded: this.isOnboarded,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('OnboardingEmails', onboardingEmailsSchema)

export const schema = model.schema
export default model
