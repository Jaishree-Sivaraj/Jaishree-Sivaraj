import mongoose, { Schema } from 'mongoose'

const conversiontypesSchema = new Schema({
  typeName: {
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

conversiontypesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      typeName: this.typeName,
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

const model = mongoose.model('Conversiontypes', conversiontypesSchema)

export const schema = model.schema
export default model
