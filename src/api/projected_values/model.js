import mongoose, { Schema } from 'mongoose'

const projectedValuesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  clientTaxonomyId: {
    type: Schema.ObjectId,
    ref: 'ClientTaxonomy',
    required: true
  },
  nic: {
    type: String
  },
  categoryId: {
    type: Schema.ObjectId,
    ref: 'Categories',
    required: true
  },
  year: {
    type: String
  },
  datapointId: {
    type: Schema.ObjectId,
    ref: 'Datapoints',
    required: true
  },
  projectedStdDeviation: {
    type: String
  },
  projectedAverage: {
    type: String
  },
  actualStdDeviation: {
    type: String
  },
  actualAverage: {
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

projectedValuesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      clientTaxonomyId: this.clientTaxonomyId ? this.clientTaxonomyId.view(full) : null,
      nic: this.nic,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
      year: this.year,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      projectedStdDeviation: this.projectedStdDeviation,
      projectedAverage: this.projectedAverage,
      actualStdDeviation: this.actualStdDeviation,
      actualAverage: this.actualAverage,
      performanceResult: this.performanceResult,
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

const model = mongoose.model('ProjectedValues', projectedValuesSchema)

export const schema = model.schema
export default model
