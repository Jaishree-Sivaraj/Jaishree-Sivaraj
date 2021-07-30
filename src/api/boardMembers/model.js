import mongoose, { Schema } from 'mongoose'

const boardMembersSchema = new Schema({
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
  clientTaxonomyId: {
    type: Schema.ObjectId,
    ref: 'ClientTaxonomy',
    required: true
  },
  BOSP004: {
    //boardMemberName
    type: String
  },
  startDate: {
    type: String
  },
  endDate: {
    type: String
  },
  endDateTimeStamp: {
    type: Number,
    default:0
  },
  dob: {
    type: String
  },
  BODR005: {
    //gender
    type: String
  },
  BODP001: {
    //nationality
    type: String
  },
  BOSP005: {
    //IndustryExperience
    type: String
  },
  BOSP006: {
    //FinanicalExpertise
    type: String
  },
  memberStatus: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

boardMembersSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      companyId: this.companyId ? this.companyId.view(full) : null,
      BOSP004: this.BOSP004,
      startDate: this.startDate,
      endDate: this.endDate,
      endDateTimeStamp: this.endDateTimeStamp,
      dob: this.dob,
      BODR005: this.BODR005,
      BODP001: this.BODP001,
      BOSP005: this.BOSP005,
      BOSP006: this.BOSP006,
      memberStatus: this.memberStatus,
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

const model = mongoose.model('BoardMembers', boardMembersSchema)

export const schema = model.schema
export default model
