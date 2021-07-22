import mongoose, { Schema } from 'mongoose'

const sourceSubTypesSchema = new Schema({
  subTypeName: {
    type: String,
    required: true
  },
  description: {
    type: String
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

sourceSubTypesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      subTypeName: this.subTypeName,
      description: this.description,
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

const model = mongoose.model('SourceSubTypes', sourceSubTypesSchema)

export const schema = model.schema
export default model
