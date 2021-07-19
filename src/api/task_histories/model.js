import mongoose, { Schema } from 'mongoose'

const taskHistoriesSchema = new Schema({
  taskId: {
    type: Schema.ObjectId,
    ref: 'TaskAssignment',
    required: true
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  categoryId: {
    type: Schema.ObjectId,
    ref: 'Categories',
    required: true
  },
  submittedByName: {
    type: String
  },
  stage: {
    type: String
  },
  comment: {
    type: String,
    default: null
  },
  status: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.ObjectId,
    ref: 'Users',
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

taskHistoriesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      taskId: this.taskId ? this.taskId.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
      submittedByName: this.submittedByName,
      stage: this.stage,
      comment: this.comment,
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

const model = mongoose.model('TaskHistories', taskHistoriesSchema)

export const schema = model.schema
export default model
