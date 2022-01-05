import mongoose, { Schema } from 'mongoose'

const taxonomyUomsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  measureId: {
    type: String
  },
  measureUomId: {
    type: String
  },
  uomConversionId: {
    type: String
  },
  clientTaxonomyId: {
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

taxonomyUomsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      measureId: this.measureId,
      measureUomId: this.measureUomId,
      uomConversionId: this.uomConversionId,
      clientTaxonomyId: this.clientTaxonomyId,
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

const model = mongoose.model('TaxonomyUoms', taxonomyUomsSchema)

export const schema = model.schema
export default model
