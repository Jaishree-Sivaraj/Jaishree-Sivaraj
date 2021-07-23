import mongoose, { Schema } from 'mongoose'

const companySourcesSchema = new Schema({
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  sourceTypeId: {
    type: Schema.ObjectId,
    ref: 'SourceTypes',
    required: false,
    default: null
  },
  isMultiYear: {
    type: Boolean,
    default: false
  },
  isMultiSource: {
    type: Boolean,
    default: false
  },
  sourceUrl: {
    type: String
  },
  sourceSubTypeId: {
    type: Schema.ObjectId,
    ref: 'SourceSubTypes',
    default: null
  },
  sourceFile: {
    type: String
  },
  publicationDate: {
    type: Date,
    default: null
  },
  fiscalYear: {
    type: String
  },
  newSourceTypeName: {
    type: String,
    default: null
  },
  newSubSourceTypeName: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: true
  }
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
