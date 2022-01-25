import mongoose, { Schema } from 'mongoose'

const placeValuesSchema = new Schema({
  name: {
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

placeValuesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      name: this.name,
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

const model = mongoose.model('PlaceValues', placeValuesSchema)

export const schema = model.schema
export default model
