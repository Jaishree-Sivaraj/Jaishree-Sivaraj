import mongoose, { Schema } from 'mongoose'

const onboardingSchema = new Schema({
  email: {
    type: String
  },
  onboardingType: {
    type: String
  },
  content: {
    type: String
  },
  mailStatus: {
    type: Boolean
  },
  status: {
    type: Boolean,
    default:true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

onboardingSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      email: this.email,
      onboardingType: this.onboardingType,
      content: this.content,
      mailStatus: this.mailStatus,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('Onboarding', onboardingSchema)

export const schema = model.schema
export default model
