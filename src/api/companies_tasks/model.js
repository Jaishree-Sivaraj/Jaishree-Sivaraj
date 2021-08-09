import mongoose, { Schema } from 'mongoose'

const companiesTasksSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  taskList: [{
    type: Schema.ObjectId,
    ref: 'TaskAssignment',
    required: true
  }],
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  year: {
    type: String
  },
  overAllCompanyTaskStatus: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date,
    required: false
  },
  canGenerateJson: {
    type: Boolean,
    required: false
  },
  isJsonGenerated: {
    type: Boolean,
    required: false
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

companiesTasksSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      taskId: this.taskId ? this.taskId.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      year: this.year,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
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

const model = mongoose.model('CompaniesTasks', companiesTasksSchema)

export const schema = model.schema
export default model
