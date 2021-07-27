import mongoose, { Schema } from 'mongoose'

const taskSlaLogSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
   type: Schema.ObjectId,
    ref: 'TaskAssigment',
    required: true
  },
  currentDate: {
    type: String
  },
  preferedDate: {
    type: String
  },
  requestedBy: {
    type: String
  },
  isAccepted: {
    type: Boolean,
    default: false
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

taskSlaLogSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      taskId: this.taskId ? this.taskId.view(full) : null ,
      currentDate: this.currentDate,
      preferedDate: this.preferedDate,
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
