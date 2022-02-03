import mongoose, { Schema } from 'mongoose';

const childDpSchema = new Schema({
  childFields: {
    type: Object,
    default: {}
  },
  parentDpId: {
    type: String
  },
  companyId: {
    type: String
  },
  taskId: {
    type: String
  },
  year: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentFields: {
    type: Object,
    default: {}
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




childDpSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      childFields: this.childFields,
      parentDpId: this.parentDpId,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
      companyId: this.companyId,
      year: this.year,
      taskId: this.taskId

    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('ChildDp', childDpSchema)

export const schema = model.schema
export default model


