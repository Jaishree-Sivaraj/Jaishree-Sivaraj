import mongoose, { Schema } from 'mongoose'

const taskSlaLogSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  taskId: {
   type: Schema.ObjectId,
    ref: 'TaskAssigment',
    required: true
  },
  days: {
    type: String
  },
  requestedBy: {
    type: String,
    required: true
  },
  isAccepted: {
    type: Boolean,
    default: false
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

taskSlaLogSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      taskId: this.taskId ? this.taskId.view(full) : null ,
      days: this.days,
      requestedBy: this.requestedBy,
      isAccepted: this.isAccepted,
      status: this.status,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('TaskSlaLog', taskSlaLogSchema)

export const schema = model.schema
export default model
