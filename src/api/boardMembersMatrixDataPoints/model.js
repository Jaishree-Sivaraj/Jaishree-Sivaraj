import mongoose, {
  Schema
} from 'mongoose'

const boardMembersMatrixDataPointsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  datapointId: {
    type: Schema.ObjectId,
    ref: 'Datapoints',
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
  year: {
    type: String
  },
  response: {
    type: String
  },
  fiscalYearEndDate: {
    type: String
  },
  dpStatus:{
    type: String,
    default:'Collection'
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
  sourceFileType: {
    type: String,
    default: "pdf"
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
  collectionStatus: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: Boolean,
    default: false
  },
  correctionStatus:{
     type: String,
     default:'Incomplete'
  },
  hasCorrection: {
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

boardMembersMatrixDataPointsSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      companyId: this.companyId.view(full) ? this.companyId.view(full) : null,
      taskId: this.taskId ? this.taskId.view(full) : null,
      memberName: this.memberName,
      isActive: this.isActive,
      year: this.year,
      response: this.response,
      fiscalYearEndDate: this.fiscalYearEndDate,
      sourceName: this.sourceName,
      url: this.url,
      pageNumber: this.pageNumber,
      publicationDate: this.publicationDate,
      textSnippet: this.textSnippet,
      screenShot: this.screenShot,
      sourceFileType: this.sourceFileType,
      filePathway: this.filePathway,
      commentCalculations: this.commentCalculations,
      comments: this.comments,
      dpStatus: this.dpStatus,
      correctionStatus: this.correctionStatus,
      internalFileSource: this.internalFileSource,
      collectionStatus: this.collectionStatus,
      hasCorrection: this.hasCorrection,
      verificationStatus: this.verificationStatus,
      hasError: this.hasError,
      memberStatus: this.memberStatus,
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

const model = mongoose.model('BoardMembersMatrixDataPoints', boardMembersMatrixDataPointsSchema)

export const schema = model.schema
export default model
