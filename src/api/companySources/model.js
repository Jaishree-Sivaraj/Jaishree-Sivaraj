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
  sourceTitle: {
    type: String
  },
  publicationDate: {
    type: Date,
    default: null
  },
  fiscalYear: {
    type: String
  },
  name: {
    type: String
  },
  s3Url: {
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

companySourcesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      companyId: this.companyId ? this.companyId.view(full) : this.companyId,
      sourceTypeId: this.sourceTypeId ? this.sourceTypeId.view(full) : null,
      isMultiYear: this.isMultiYear,
      isMultiSource: this.isMultiSource,
      sourceUrl: this.sourceUrl,
      sourceFile: this.sourceFile,
      publicationDate: this.publicationDate,
      fiscalYear: this.fiscalYear,
      name: this.name,
      newSourceTypeName: this.newSourceTypeName,
      newSubSourceTypeName: this.newSubSourceTypeName,
      s3Url: this.s3Url,
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

const model = mongoose.model('CompanySources', companySourcesSchema)

export const schema = model.schema
export default model
