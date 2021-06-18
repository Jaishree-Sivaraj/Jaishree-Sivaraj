import mongoose, { Schema } from 'mongoose'

const companySourcesSchema = new Schema({
  sourceTypeId: {
    type: Schema.ObjectId,
    ref: 'SourceTypes',
    required: true
  },
  sourceUrl: {
    type: String
  },
  sourceFile: {
    type: Buffer
  },
  publicationDate: {
    type: Date
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: false
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

companySourcesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      sourceTypeId: this.sourceTypeId ? this.sourceTypeId.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      sourceUrl: this.sourceUrl,
      sourceFile: this.sourceFile.toString('base64'),
      publicationDate: this.publicationDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('CompanySources', companySourcesSchema)

export const schema = model.schema
export default model
