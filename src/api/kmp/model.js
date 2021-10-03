import mongoose, { Schema } from 'mongoose'

const kmpSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  clientTaxonomyId: {
    type: Schema.ObjectId,
    ref: 'ClientTaxonomy',
    required: true
  },
  companyId: {
   type: Schema.ObjectId,
    ref: 'Companies',
    required: true
  },
  MASP003: {
    //kmpmemberName
    type: String
  },
  memberStatus: {
    type: Boolean
  },
  dob: {
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
  MASR008: {
    //gender
    type: String
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

kmpSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null ,
      companyId: this.companyId ? this.companyId.view(full) :null ,
      clientTaxonomyId: this.clientTaxonomyId ? this.clientTaxonomyId.view(full) :null ,
      MASP003: this.MASP003,
      MASR008: this.MASR008,
      memberStatus: this.memberStatus,
      startDate: this.startDate,
      endDate: this.endDate,
      endDateTimeStamp: this.endDateTimeStamp,
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

const model = mongoose.model('Kmp', kmpSchema)

export const schema = model.schema
export default model
