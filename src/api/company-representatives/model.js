import mongoose, { Schema } from 'mongoose'

const companyRepresentativesSchema = new Schema({
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
  companiesList: [{
    type: Schema.ObjectId,
    ref: 'Companies'
  }],
  authenticationLetterForCompanyUrl: {
    type: Buffer
  },
  companyIdForCompany: {
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

companyRepresentativesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      userId: this.userId ? this.userId.view(full) : null,
      name: this.name,
      companiesList: this.companiesList ? this.companiesList : [],
      authenticationLetterForCompanyUrl: this.authenticationLetterForCompanyUrl.toString('base64'),
      companyIdForCompany: this.companyIdForCompany.toString('base64'),
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

const model = mongoose.model('CompanyRepresentatives', companyRepresentativesSchema)

export const schema = model.schema
export default model
