import mongoose, { Schema } from 'mongoose'

const jsonFilesSchema = new Schema({
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  year: {
    type: String
  },
  type: {
    type: String
  },
  fileName: {
    type: String
  },
  url: {
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

jsonFilesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      companyId: this.companyId ? this.companyId.view(full) : null,
      year: this.year,
      type: this.type,
      fileName: this.fileName,
      url: this.url,
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

const model = mongoose.model('JsonFiles', jsonFilesSchema)

export const schema = model.schema
export default model
