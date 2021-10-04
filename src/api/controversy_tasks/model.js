import mongoose, { Schema } from 'mongoose'

const controversyTasksSchema = new Schema({
  taskNumber: {
    type: String
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  analystId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  taskStatus: {
    type: String,
    default: "Pending"
  },
  completedDate: {
    type: Date,
    default: null
  },
  status: {
    type: Boolean,
    default: true
  },
  canGenerateJson: {
    type: Boolean,
    required: false
  },
  isJsonGenerated: {
    type: Boolean,
    required: false
  },
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

controversyTasksSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      taskNumber: this.taskNumber,
      companyId: this.companyId ? this.companyId.view(full) : null,
      analystId: this.analystId ? this.analystId.view(full) : null,
      taskStatus: this.taskStatus,
      completedDate: this.completedDate,
      status: this.status,
      canGenerateJson: this.canGenerateJson,
      isJsonGenerated: this.isJsonGenerated,
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

const model = mongoose.model('ControversyTasks', controversyTasksSchema)

export const schema = model.schema
export default model
