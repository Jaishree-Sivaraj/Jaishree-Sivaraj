import mongoose, { Schema } from 'mongoose'

const masterCompaniesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String
  },
  cin: {
    type: String
  },
  nicCode: {
    type: String
  },
  nic: {
    type: String
  },
  nicIndustry: {
    type: String
  },
  isinCode: {
    type: String
  },
  cmieProwessCode: {
    type: String
  },
  socialAnalystName: {
    type: String,
    required: false,
    default: null
  },
  socialQAName: {
    type: String,
    required: false,
    default: null
  },
  companyMemberDetails: {
    type: Object,
    default: []
  },
  fiscalYearEndDate: {
    type: String,
    default: ''
  },
  fiscalYearEndMonth: {
    type: String,
    default: ''
  },
  isAssignedToBatch: {
    type: Boolean,
    default: false
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

masterCompaniesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      companyName: this.companyName,
      cin: this.cin,
      nicCode: this.nicCode,
      nic: this.nic,
      nicIndustry: this.nicIndustry,
      isinCode: this.isinCode,
      cmieProwessCode: this.cmieProwessCode,
      socialAnalystName: this.socialAnalystName ? this.socialAnalystName : '',
      socialQAName: this.socialQAName ? this.socialQAName : '',
      companyMemberDetails: this.companyMemberDetails ? this.companyMemberDetails : [],
      fiscalYearEndDate: this.fiscalYearEndDate ? this.fiscalYearEndDate : '',
      fiscalYearEndMonth: this.fiscalYearEndMonth ? this.fiscalYearEndMonth : '',
      status: this.status,
      isAssignedToBatch: this.isAssignedToBatch ? this.isAssignedToBatch : false,
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

const model = mongoose.model('MasterCompanies', masterCompaniesSchema)

export const schema = model.schema
export default model
