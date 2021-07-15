import mongoose, { Schema } from 'mongoose'

const batchesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  clientTaxonomy: {
    type: Schema.ObjectId,
    ref: 'ClientTaxonomy',
    required: true
  },
  batchName: {
    type: String,
    unique: true
  },
  years: {
    type: []
  },
  companiesList: [{
    type: Schema.ObjectId,
    ref: 'Companies'
  }],
  status: {
    type: Boolean,
    default: true
  },
  isAssignedToGroup: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

batchesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      batchName: this.batchName,
      years: this.years,
      companiesList: this.companiesList ? this.companiesList : [],
      clientTaxonomy: this.clientTaxonomy ? this.clientTaxonomy.view(full) : null,
      status: this.status,
      isAssignedToGroup: this.isAssignedToGroup,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('Batches', batchesSchema)

export const schema = model.schema
export default model
