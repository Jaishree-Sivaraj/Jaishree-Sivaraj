import mongoose, { Schema } from 'mongoose'

const companySourcesSchema = new Schema({
  sourceTypeId: {
    type: Schema.ObjectId,
    ref:'SourceTypes',
    required:true
  },
  sourceUrl: {
    type: String
  },
  sourceFile: {
    type: String
  },
  publicationDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

companySourcesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      sourceTypeId: this.sourceTypeId ? this.sourceTypeId.view(full) : null,
      sourceUrl: this.sourceUrl,
      sourceFile: this.sourceFile, 
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
