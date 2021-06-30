import mongoose, { Schema } from 'mongoose'

const batchWisePillarAssignmentSchema = new Schema({
  userId: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  batchId: [{
    type: Schema.ObjectId,
    ref: 'Batches'
  }],
  pillars: [{
    type: Object
  }],
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

batchWisePillarAssignmentSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      userId: this.userId ? this.userId : [],
      batchId: this.batchId ? this.batchId : [],
      pillars: this.pillars,
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

const model = mongoose.model('BatchWisePillarAssignment', batchWisePillarAssignmentSchema)

export const schema = model.schema
export default model
