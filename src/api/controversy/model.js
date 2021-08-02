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
    type: String
  },
  sourcePublicationDate: {
    type: String
  },
  publicationDate: {
    type: String
  },
  comments: {
    type: Object,
    default: []
  },
  response: {
    type: String
  },
  submittedDate: {
    type: Date,
    default: Date.now()
  },
  status:{
    type:Boolean,
    default:true
  },
  additionalDetails: {
    type: Object
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

controversySchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      controversyNumber: this.controversyNumber ? this.controversyNumber : '-',
      taskId: this.taskId ? this.taskId.view(full) : null ,
      datapointId: this.datapointId ? this.datapointId.view(full) : null ,
      companyId: this.companyId ? this.companyId.view(full) : null,
      year: this.year,
      response: this.response,
      controversyDetails: this.controversyDetails ? this.controversyDetails : [],
      pageNumber: this.pageNumber ? this.pageNumber : '',
      sourceName: this.sourceName ? this.sourceName : '',
      sourceURL: this.sourceURL ? this.sourceURL : '',
      textSnippet: this.textSnippet ? this.textSnippet : '',
      screenShot: this.screenShot ? this.screenShot : '',
      sourcePublicationDate: this.sourcePublicationDate ? this.sourcePublicationDate : '',
      publicationDate: this.publicationDate ? this.publicationDate : '',
      comments: this.comments ? this.comments : [],
      additionalDetails: this.additionalDetails ? this.additionalDetails : {},
      status: this.status,
      submittedDate: this.submittedDate ? this.submittedDate : null,
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
