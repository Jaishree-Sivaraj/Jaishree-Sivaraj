import mongoose, {
  Schema
} from 'mongoose'

const standaloneDatapointsSchema = new Schema({
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
  datapointId: {
    type: Schema.ObjectId,
    ref: 'Datapoints',
    required: true
  },
  performanceResult: {
    type: String
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
    type: Array,
    default: []
  },
  correctionStatus:{
     type: String,
     default:'Incomplete'
  },
  collectionStatus: {
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
  submittedBy: {
    type: String
  },
  hasCorrection: {
    type: Boolean,
    default: false
  },
  submittedDate: {
    type: Date,
    default: Date.now()
  },
  activeStatus: {
    type: String
  },
  lastModifiedDate: {
    type: Date
  },
  modifiedBy: {
    type: String
  },
  isSubmitted: {
    type: Boolean
  },
  dpStatus:{
    type: String,
    default:'Collection'
  },
  standaradDeviation: {
    type: String
  },
  average: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  },
  additionalDetails: {
    type: Object
  },
  isCounted: {
    type: Boolean,
    default: false
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  sourceName1: {
    type: String,
    default: ''
  },
  url1: {
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

standaloneDatapointsSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      performanceResult: this.performanceResult,
      response: this.response,
      year: this.year,
      fiscalYearEndDate: this.fiscalYearEndDate,
      standaloneStatus: this.standaloneStatus,
      taskId: this.taskId ? this.taskId.view(full) : null,
      submittedBy: this.submittedBy,
      submittedDate: this.submittedDate,
      activeStatus: this.activeStatus,
      sourceName: this.sourceName,
      url: this.url,
      pageNumber: this.pageNumber,
      correctionStatus: this.correctionStatus,
      publicationDate: this.publicationDate,
      textSnippet: this.textSnippet,
      screenShot: this.screenShot,
      sourceFileType: this.sourceFileType,
      filePathway: this.filePathway,
      commentCalculations: this.commentCalculations,
      comments: this.comments,   
      collectionStatus: this.collectionStatus,
      verificationStatus: this.verificationStatus,
      hasError: this.hasError,
      dpStatus: this.dpStatus,
      internalFileSource: this.internalFileSource,
      hasCorrection: this.hasCorrection,
      standaradDeviation: this.standaradDeviation,
      average: this.average,
      lastModifiedDate: this.lastModifiedDate,
      modifiedBy: this.modifiedBy,
      isSubmitted: this.isSubmitted,
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

const model = mongoose.model('StandaloneDatapoints', standaloneDatapointsSchema)

export const schema = model.schema
export default model
