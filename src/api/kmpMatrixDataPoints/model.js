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
  sourceFileType: {
    type: String,
    default: "pdf"
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
  optionalAnalystComment: {
    type: String
  },
  isRestated: {
    type: String
  },
  restatedForYear: {
    type: String
  },
  restatedInYear: {
    type: String
  },
  restatedValue: {
    type: String
  },
  dpStatus: {
    type: String,
    default:'Collection'
  },
  publicationDate: {
    type: String
  },
  textSnippet: {
    type: String
  },
  screenShot: {
    type: Array
  },
  filePathway: {
    type: String
  },
  commentCalculations: {
    type: String
  },
  internalFileSource: {
    type: String
  },
  comments: {
    type: Array
  },
  correctionStatus:{
     type: String,
     default:'Incomplete'
  },
  collectionStatus: {
    type: Boolean,
    default: false
  },
  hasCorrection: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: Boolean,
    default: false
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
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: Boolean,
    default: true
  },
  additionalDetails: {
    type: Object
  },
  sourceName1: {
    type: String,
    default: ''
  },
  sourceFile: {
    type: String,
    default: ''
  },
  isCounted: {
    type: Boolean,
    default: false
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  screenShot1: {
    type: String,
    default: ''
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
      isActive: this.isActive,
      year: this.year,
      fiscalYearEndDate: this.fiscalYearEndDate,
      memberStatus: this.memberStatus,
      sourceName: this.sourceName,
      url: this.url,
      sourceFile: this.sourceFile ? this.sourceFile : '',
      pageNumber: this.pageNumber,
      optionalAnalystComment: this.optionalAnalystComment,
      isRestated: this.restated,
      restatedForYear: this.restatedForYear,
      restatedInYear: this.restatedInYear,
      restatedValue: this.restatedValue,
      publicationDate: this.publicationDate,
      textSnippet: this.textSnippet,
      correctionStatus: this.correctionStatus,
      screenShot: this.screenShot ? this.screenShot : [],
      sourceFileType: this.sourceFileType,
      filePathway: this.filePathway,
      commentCalculations: this.commentCalculations,
      comments: this.comments,
      dpStatus: this.dpStatus,
      collectionStatus: this.collectionStatus,
      hasCorrection: this.hasCorrection,
      verificationStatus: this.verificationStatus,
      hasError: this.hasError,
      internalFileSource: this.internalFileSource,
      additionalComments: this.additionalComments,
      additionalDetails: this.additionalDetails ? this.additionalDetails : {},
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
