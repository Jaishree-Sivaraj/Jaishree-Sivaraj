import { toString } from 'lodash'
import mongoose, { Schema } from 'mongoose'

const controversySchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  controversyNumber: {
    type: String
  },
  taskId: {
    type: Schema.ObjectId,
    ref: 'ControversyTasks',
    required: false
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
  year: {
    type: String,
    default: ''
  },
  fiscalYearEndDate: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  controversyDetails: {
    type: Object,
    default: []
  },
  pageNumber: {
    type: String
  },
  sourceName: {
    type: String
  },
  sourceURL: {
    type: String
  },
  textSnippet: {
    type: String
  },
  screenShot: {
    type: Array
  },
  sourcePublicationDate: {
    type: String
  },
  publicationDate: {
    type: String
  },
  comments: {
    type: String
  },
  response: {
    type: String
  },
  submittedDate: {
    type: Date,
    default: Date.now()
  },
  additionalDetails: {
    type: Object
  },
  nextReviewDate: {
    type: Date,
    required: false
  },
  reviewDate: {
    type: Date,
    required: false
  },
  assessmentDate: {
    type: Date
  },
  reassessmentDate: {
    type: Date
  },
  sourceFile: {
    type: String,
    default: ''
  },
  sourceName1: {
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
  status: {
    type: Boolean,
    default: true
  },
  screenShot1: {
    type: String,
    default: ''
  },
  analystComments: {
    type: String
  },
  additionalComments: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

controversySchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      controversyNumber: this.controversyNumber ? this.controversyNumber : '-',
      taskId: this.taskId ? this.taskId.view(full) : null,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      year: this.year,
      fiscalYearEndDate: this.fiscalYearEndDate,
      isActive: this.isActive,
      response: this.response,
      assessmentDate: this.assessmentDate,
      reassessmentDate: this. reassessmentDate,
      controversyDetails: this.controversyDetails ? this.controversyDetails : [],
      pageNumber: this.pageNumber ? this.pageNumber : '',
      sourceName: this.sourceName ? this.sourceName : '',
      sourceURL: this.sourceURL ? this.sourceURL : '',
      sourceFile: this.sourceFile ? this.sourceFile : '',
      textSnippet: this.textSnippet ? this.textSnippet : '',
      analystComments: this.analystComments ? this.analystComments : '',
      additionalComments: this.additionalComments ? this.additionalComments : '',
      screenShot: this.screenShot ? this.screenShot : [],
      sourcePublicationDate: this.sourcePublicationDate ? this.sourcePublicationDate : '',
      publicationDate: this.publicationDate ? this.publicationDate : '',
      comments: this.comments,
      additionalDetails: this.additionalDetails ? this.additionalDetails : {},
      status: this.status,
      reviewDate: this.reviewDate,
      submittedDate: this.submittedDate ? this.submittedDate : null,
      nextReviewDate: this.nextReviewDate ? this.nextReviewDate : null,
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

const model = mongoose.model('Controversy', controversySchema)

export const schema = model.schema
export default model
