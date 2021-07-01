import mongoose, { Schema } from 'mongoose'

const clientRepresentativesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: false,
  },
  userId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String
  },
  CompanyName: {
    type: String,
    required: true
  },
  authenticationLetterForClientUrl: {
    type: Buffer
  },
  companyIdForClient: {
    type: Buffer
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

clientRepresentativesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      userId: this.userId ? this.userId.view(full) : null,
      name: this.name,
      CompanyName: this.CompanyName ? this.CompanyName : null,
      authenticationLetterForClientUrl: this.authenticationLetterForClientUrl.toString('base64'),
      companyIdForClient: this.companyIdForClient.toString('base64'),
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

const model = mongoose.model('ClientRepresentatives', clientRepresentativesSchema)

export const schema = model.schema
export default model
