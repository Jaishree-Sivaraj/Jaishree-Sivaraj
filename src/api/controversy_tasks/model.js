import mongoose, { Schema } from 'mongoose'

const controversyTasksSchema = new Schema({
  tasknumber: {
    type: String
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  analystId: {
    type: Schema.ObjectId,
    ref: 'Users',
    required: true
  },
  taskStatus: {
    type: String
  },
  completedDate: {
    type: Date,
    default: null
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

controversyTasksSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      tasknumber: this.tasknumber,
      companyId: this.companyId ? this.companyId.view(full) : null,
      analystId: this.analystId ? this.analystId.view(full) : null,
      slaDate: this.slaDate,
      taskStatus: this.taskStatus,
      completedDate: this.completedDate,
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

const model = mongoose.model('ControversyTasks', controversyTasksSchema)

export const schema = model.schema
export default model
