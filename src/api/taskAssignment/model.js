import mongoose, { Schema } from 'mongoose'

const taskAssignmentSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
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
  groupId: {
   type: Schema.ObjectId,
    ref: 'Group',
    required: true
  },
  revisionCode: {
    type: String
  },
  assignedTo: {
    type: String
  },
  year: {
    type: String
  },
  analystSLA: {
    type: String
  },
  taskStatus: {
    type: String
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

taskAssignmentSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      companyId: this.companyId ?  this.companyId.view(full) : null,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
      groupId: this.groupId ? this.groupId.view(full) : null,
      revisionCode: this.revisionCode,
      assignedTo: this.assignedTo,
      year: this.year,
      analystSLA: this.analystSLA,
      taskStatus: this.taskStatus,
      analystId: this.analystId ? this.analystId.view(full) : null ,
      qaId: this.qaId  ? this.qaId.view(full) : null ,
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

const model = mongoose.model('TaskAssignment', taskAssignmentSchema)

export const schema = model.schema
export default model
