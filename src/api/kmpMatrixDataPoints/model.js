import mongoose, {
  Schema
} from 'mongoose'

const kmpMatrixDataPointsSchema = new Schema({
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
  memberName: {
    type: String
  },
  datapointId: {
    type: Schema.ObjectId,
    ref: 'Datapoints',
    required: true
  },
  response: {
    type: String
  },
  year: {
    type: String
  },
  fiscalYearEndDate: {
    type: String
  },
  memberStatus: {
    type: Boolean
  },
  sourceName: {
    type: String
  },
  url: {
    type: String
  },
  pageNumber: {
    type: String
  },
  publicationDate: {
    type: String
  },
  textSnippet: {
    type: String
  },
  screenShot: {
    type: String
  },
  pdf: {
    type: String
  },
  wordDoc: {
    type: String
  },
  excel: {
    type: String
  },
  filePathway: {
    type: String
  },
  commentCalculations: {
    type: String
  },
  dataVerification: {
    type: String
  },
  errorType: {
    type: String
  },
  errorComments: {
    type: String
  },
  internalFileSource: {
    type: String
  },
  errorStatus: {
    type: String
  },
  analystComments: {
    type: String
  },
  additionalComments: {
    type: String
  },
  collectionStatus: {
    type: String,
    default: 'Yet to start'
  },
  verificationStatus: {
    type: String,
    default: 'Yet to start'
  },
  errorAcceptStatus: {
    type: String,
    default: ''
  },
  errorRejectComment: {
    type: String,
    default: ''
  },
  hasError: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: Schema.ObjectId,
    ref: 'TaskAssignment',
    required: false,
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
    transform: (obj, ret) => {
      delete ret._id
    }
  }
})

kmpMatrixDataPointsSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      memberName: this.memberName,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      taskId: this.taskId ? this.taskId.view(full) : null,
      response: this.response,
      year: this.year,
      fiscalYearEndDate: this.fiscalYearEndDate,
      memberStatus: this.memberStatus,
      sourceName: this.sourceName,
      url: this.url,
      pageNumber: this.pageNumber,
      publicationDate: this.publicationDate,
      textSnippet: this.textSnippet,
      screenShot: this.screenShot,
      pdf: this.pdf,
      wordDoc: this.wordDoc,
      excel: this.excel,
      filePathway: this.filePathway,
      commentCalculations: this.commentCalculations,
      dataVerification: this.dataVerification,
      errorType: this.errorType,
      errorComments: this.errorComments,
      analystComments: this.analystComments,
      collectionStatus: this.collectionStatus,
      errorAcceptStatus: this.errorAcceptStatus,
      verificationStatus: this.verificationStatus,
      errorRejectComment: this.errorRejectComment,
      hasError: this.hasError,
      internalFileSource: this.internalFileSource,
      additionalComments: this.additionalComments,
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

const model = mongoose.model('KmpMatrixDataPoints', kmpMatrixDataPointsSchema)

export const schema = model.schema
export default model
