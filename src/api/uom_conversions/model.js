import mongoose, { Schema } from 'mongoose'

const uomConversionsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  measureId: {
    type: String
  },
  uomId: {
    type: String
  },
  uomSource: {
    type: String
  },
  uomTarget: {
    type: String
  },
  conversionType: {
    type: String
  },
  conversionParameter: {
    type: String
  },
  conversionFormula: {
    type: String
  },
  status: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

uomConversionsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      measureId: this.measureId,
      uomId: this.uomId,
      uomSource: this.uomSource,
      uomTarget: this.uomTarget,
      conversionType: this.conversionType,
      conversionParameter: this.conversionParameter,
      conversionFormula: this.conversionFormula,
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

const model = mongoose.model('UomConversions', uomConversionsSchema)

export const schema = model.schema
export default model
