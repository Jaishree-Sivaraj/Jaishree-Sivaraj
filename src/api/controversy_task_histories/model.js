import mongoose, { Schema } from 'mongoose'

const controversyTaskHistoriesSchema = new Schema({
  taskId: {
    type: Schema.ObjectId,
    ref: 'ControversyTasks',
    required: true
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
  stage: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Users',
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

controversyTaskHistoriesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      taskId: this.taskId ? this.taskId.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      analystId: this.analystId ? this.analystId.view(full) : null,
      stage: this.stage,
      status: this.status,
      createdBy: this.createdBy.view(full),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('ControversyTaskHistories', controversyTaskHistoriesSchema)

export const schema = model.schema
export default model
