import mongoose, { Schema } from 'mongoose'

const validationResultsSchema = new Schema({
  taskId: {
    type: String
  },
  dpCode: {
    type: String
  },
  dpCodeId: {
    type: String
  },
  companyId: {
    type: String
  },
  companyName: {
    type: String
  },
  keyIssueId: {
    type: String
  },
  keyIssue: {
    type: String
  },
  pillarId: {
    type: String
  },
  pillar: {
    type: String
  },
  dataType: {
    type: String
  },
  fiscalYear: {
    type: String
  },
  memberName: {
    type: String
  },
  memberId: {
    type: String
  },
  memberType: {
    type: String
  },
  isValidResponse: {
    type: String
  },
  description: {
    type: Array
  },
  status: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

validationResultsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      taskId: this.taskId,
      dpCode: this.dpCode,
      dpCodeId: this.dpCodeId,
      companyId: this.companyId,
      companyName: this.companyName,
      keyIssueId: this.keyIssueId,
      keyIssue: this.keyIssue,
      pillarId: this.pillarId,
      pillar: this.pillar,
      dataType: this.dataType,
      fiscalYear: this.fiscalYear,
      memberName: this.memberName,
      memberId: this.memberId,
      memberType: this.memberType,
      isValidResponse: this.isValidResponse,
      description: this.description,
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

const model = mongoose.model('ValidationResults', validationResultsSchema)

export const schema = model.schema
export default model
