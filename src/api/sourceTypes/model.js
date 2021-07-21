import mongoose, { Schema } from 'mongoose'

const sourceTypesSchema = new Schema({
  typeName: {
    type: String
  },
  sourceSubTypeId: {
    type: Schema.ObjectId,
    ref: 'SourceSubTypes',
    required: false,
    default: null
  },
  isMultiYear: {
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

sourceTypesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      typeName: this.typeName,
      sourceSubTypeId: this.sourceSubTypeId ? this.sourceSubTypeId.view(full) : null,
      duration: this.duration,
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

const model = mongoose.model('SourceTypes', sourceTypesSchema)

export const schema = model.schema
export default model
