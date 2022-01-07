import mongoose, { Schema } from 'mongoose'

const taxonomyUomsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  measureId: {
    type: Schema.ObjectId,
    ref: 'Measures',
    required: true
  },
  measureUomId: {
    type: Schema.ObjectId,
    ref: 'MeasureUoms',
    required: true
  },
  uomConversionId: {
    type: Schema.ObjectId,
    ref: 'UomConversions',
    required: false,
    default: null
  },
  clientTaxonomyId: {
    type: Schema.ObjectId,
    ref: 'ClientTaxonomy',
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

taxonomyUomsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      measureId: this.measureId ? this.measureId.view(full) : null,
      measureUomId: this.measureUomId ? this.measureUomId.view(full) : null,
      uomConversionId: this.uomConversionId ? this.uomConversionId.view(full) : null,
      clientTaxonomyId: this.clientTaxonomyId ? this.clientTaxonomyId.view(full) : null,
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
