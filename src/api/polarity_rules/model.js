import mongoose, { Schema } from 'mongoose'

const polarityRulesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  polarityName: {
    type: String
  },
  polarityValue: {
    type: String
  },
  condition: {
    type: String
  },
  datapointId: {
    type: Schema.ObjectId,
    ref: 'Datapoints',
    required: true
  },
  categoryId: {
    type: Schema.ObjectId,
    ref: 'Categories',
    required: true
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

polarityRulesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      polarityName: this.polarityName,
      polarityValue: this.polarityValue,
      condition: this.condition,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      categoryId: this.categoryId ? this.categoryId.view(full): null,
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

const model = mongoose.model('PolarityRules', polarityRulesSchema)

export const schema = model.schema
export default model
