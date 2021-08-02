import mongoose, { Schema } from 'mongoose'

const categoriesSchema = new Schema({
  categoryName: {
    type: String,
    required: true
  },
  categoryCode: {
    type: String,
    required: true
  },
  categoryDescription: {
    type: String,
    default: ''
  },
  status: {
    type: Boolean,
    default: true
  },
  clientTaxonomyId: {
    type: Schema.ObjectId,
    ref: 'ClientTaxonomy'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

categoriesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      categoryName: this.categoryName ? this.categoryName : '',
      categoryCode: this.categoryCode ? this.categoryCode : '',
      categoryDescription: this.categoryDescription ? this.categoryDescription : '',
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

const model = mongoose.model('Categories', categoriesSchema)

export const schema = model.schema
export default model
