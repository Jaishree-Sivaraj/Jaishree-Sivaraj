import mongoose, { Schema } from 'mongoose'

const taxonomiesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fieldName: {
    type: String,
    required: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  isRequired: {
    type: Boolean,
    default: true
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

taxonomiesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      name: this.name ? this.name : '',
      fieldName: this.fieldName ? this.fieldName : '',
      description: this.description ? this.description : '',
      isRequired: this.isRequired,
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

const model = mongoose.model('Taxonomies', taxonomiesSchema)

export const schema = model.schema
export default model
