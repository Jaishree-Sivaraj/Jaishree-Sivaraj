import mongoose, { Schema } from 'mongoose'

const boardDirectorSchema = new Schema({
  din: {
    type: String,
    required: true,
    unique : true
  },
  name: {
    type: String
  },
  gender: {
    type: String
  },
  companies: {
    type: [],
    ref: 'MasterCompanies',
  },
  taskId: {
    type: Schema.ObjectId,
    ref: 'TaskAssignment'
  },
  memberName: {
    type: String,
    default: ''
  },
  memberId: {
    type: String,
    default: ''
  }, 
  startDate: {
    type: String,
    default: ''
  }, 
  endDate: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  financialExp: {
    type: String,
    default: ''
  },
  nationality: {
    type: String,
    default: ''
  },
  industrialExp: {
    type: String,
    default: ''
  } 
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

boardDirectorSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      din: this.din,
      name: this.name,
      gender: this.gender,
      companies: this.companies,
      taskId: this.taskId ? this.taskId.view(full) : null,
      memberName: this.memberName,
      memberId: this.memberId,
      startDate: this.startDate,
      endDate: this.endDate,
      financialExp: this.financialExp,
      nationality: this.nationality,
      industrialExp: this.industrialExp,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('BoardDirector', boardDirectorSchema)

export const schema = model.schema
export default model
