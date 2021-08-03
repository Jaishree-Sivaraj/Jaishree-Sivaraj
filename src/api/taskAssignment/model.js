import mongoose, {
  Schema
} from 'mongoose'

const taskAssignmentSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  taskNumber: {
    type: String,
    default: 'DT1'
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
  groupId: {
    type: Schema.ObjectId,
    ref: 'Group',
    required: true
  },
  batchId: {
    type: Schema.ObjectId,
    ref: 'Batches',
    required: true
  },
  year: {
    type: String
  },
  analystSLADate: {
    type: Date
  },
  qaSLADate: {
    type: Date
  },
  taskStatus: {
    type: String,
    default: "Yet to work"
  },
  analystId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  qaId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  overAllCompanyTaskStatus: {
    type: Boolean,
    default: false
  },
  overAllCompanyTaskCompletedDate: {
    type: Date
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => {
      delete ret._id
    }
  }
})

taskAssignmentSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      taskNumber: this.taskNumber ? this.taskNumber : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
      groupId: this.groupId ? this.groupId.view(full) : null,
      batchId: this.batchId ? this.batchId.view(full) : null,
      year: this.year,
      analystSLA: this.analystSLADate ? this.analystSLADate : null,
      qaSLADate: this.qaSLADate ? this.qaSLADate : null,
      taskStatus: this.taskStatus,
      overAllCompanyTaskStatus: this.overAllCompanyTaskStatus,
      analystId: this.analystId ? this.analystId.view(full) : null,
      qaId: this.qaId ? this.qaId.view(full) : null,
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

const model = mongoose.model('TaskAssignment', taskAssignmentSchema)

export const schema = model.schema
export default model
