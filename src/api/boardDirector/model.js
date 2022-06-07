import mongoose, { Schema } from 'mongoose'

const boardDirectorSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  din: {
    type: String,
    default: ''
  },
  BOSP004: {
    type: String
  },
  BODR005: {
    //gender
    type: String
  },
  dob: {
    type: String
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
  },
  companyName: {
    type: String,
  },
  cin: {
    type: String,
  },
  joiningDate: {
    type: String,
  },
  cessationDate: {
    type: String,
    default: ''
  },
  memberType: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true
  },
  isPresent: {
    type: Boolean,
    default: true
  },
  qualification: {
    type: String
  },
  profilePhoto: {
    type: String
  },
  socialLinks:  [{
    type: String
}]

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

boardDirectorSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy ? this.createdBy.view(full) : null,
      din: this.din,
      BOSP004: this.BOSP004,
      BODR005: this.BODR005,
      dob: this.dob,
      companyId: this.companyId,
      companyName: this.companyName,
      cin: this.cin,
      joiningDate: this.joiningDate,
      cessationDate: this.cessationDate,
      memberType: this.memberType,
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
