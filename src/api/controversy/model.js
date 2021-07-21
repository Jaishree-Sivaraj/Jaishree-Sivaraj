import mongoose, { Schema } from 'mongoose'

const controversySchema = new Schema({
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
  year: {
    type: String
  },
  controversyDetails: {
    type: Object,
    default: []
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
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      datapointId: this.datapointId ? this.datapointId.view(full) : null ,
      companyId: this.companyId ? this.companyId.view(full) : null,
      year: this.year,
      response: this.response,
      controversyDetails: this.controversyDetails ? this.controversyDetails : [],
      comments: this.comments ? this.comments : [],
      status: this.status,
      submittedDate: this.submittedDate ? this.submittedDate : '',
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
