import mongoose, {
  Schema
} from 'mongoose'

const errorDetailsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: Schema.ObjectId,
    ref: 'Categories',
    required: true
  },
  datapointId: {
    type: Schema.ObjectId,
    ref: 'Datapoints',
    required: true
  },
  year: {
    type: String
  },
  memberName: {
    type: String
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  errorTypeId: {
    type: Schema.ObjectId,
    ref: 'Error',
    required: false
  },
  taskId: {
    type: Schema.ObjectId,
    ref: 'TaskAssignment',
    required: false,
    default: null
  },
  raisedBy: {
    type: String
  },
  comments: {
    type: Object,
    default: {}
  },
  errorLoggedDate: {
    type: Date,
    default: Date.now()
  },
  errorCaughtByRep: {
    type: Object,
    default: null
  },
  errorStatus: {
    type: String,
    default: null
  },
  isErrorAccepted: {
    type: Boolean,
    default: null
  },
  isErrorRejected: {
    type: Boolean,
    default: false
  },
  rejectComment: {
    type: Object,
    default:{}
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

errorDetailsSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      errorTypeId: this.errorTypeId ? this.errorTypeId.view(full) : null,
      taskId: this.taskId ? this.taskId.view(full) : null,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      year: this.year,
      raisedBy: this.raisedBy,
      comments: this.comments,
      isErrorAccepted: this.isErrorAccepted,
      isErrorRejected: this.isErrorRejected,
      rejectComment: this.rejectComment,
      errorCaughtByRep: this.errorCaughtByRep,
      errorLoggedDate: this.errorLoggedDate,
      errorStatus: this.errorStatus,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
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

const model = mongoose.model('ErrorDetails', errorDetailsSchema)

export const schema = model.schema
export default model
