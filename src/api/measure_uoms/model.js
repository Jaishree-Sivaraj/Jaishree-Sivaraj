import mongoose, { Schema } from 'mongoose'

const measureUomsSchema = new Schema({
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
  uomName: {
    type: String
  },
  description: {
    type: String
  },
  orderNumber: {
    type: Number
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

measureUomsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      measureId: this.measureId ? this.measureId.view(full) : null,
      uomName: this.uomName,
      description: this.description,
      orderNumber: this.orderNumber,
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

const model = mongoose.model('MeasureUoms', measureUomsSchema)

export const schema = model.schema
export default model
