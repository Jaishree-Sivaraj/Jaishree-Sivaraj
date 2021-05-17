import mongoose, { Schema } from 'mongoose'

const boardMembersMatrixDataPointsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  datapointId: {
   type: Schema.ObjectId,
    ref: 'DataPoints',
    required: true
  },
  boardMemberId: {
   type: Schema.ObjectId,
    ref: 'BoardMembers',
    required: true
  },
  year: {
    type: String
  },
  response: {
    type: String
  },
  fiscalYearEndDate:{
    type:String
  },
  status: {
    type: Boolean,
    default:true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

boardMembersMatrixDataPointsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      datapointId: this.datapointId ? this.datapointId.view(full) : null,
      boardMemberId: this.boardMemberId.view(full) ? this.boardMemberId.view(full) : null,
      year: this.year,
      response: this.response,
      fiscalYearEndDate: this.fiscalYearEndDate,
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
