import mongoose, { Schema } from 'mongoose'

const employeesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: false,
  },
  userId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String
  },
  middleName: {
    type: String
  },
  lastName: {
    type: String
  },
  panNumber: {
    type: String
  },
  aadhaarNumber: {
    type: String
  },
  bankAccountNumber: {
    type: String
  },
  bankIFSCCode: {
    type: String
  },
  accountHolderName: {
    type: String
  },
  pancardUrl: {
    type: Buffer,
  },
  aadhaarUrl: {
    type: Buffer,
  },
  cancelledChequeUrl: {
    type: Buffer,
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

employeesSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      userId: this.userId ? this.userId.view(full) : null,
      firstName: this.firstName,
      middleName: this.middleName,
      lastName: this.lastName,
      panNumber: this.panNumber,
      aadhaarNumber: this.aadhaarNumber,
      bankAccountNumber: this.bankAccountNumber,
      bankIFSCCode: this.bankIFSCCode,
      accountHolderName: this.accountHolderName,
      pancardUrl: this.pancardUrl.toString('base64'),
      aadhaarUrl: this.aadhaarUrl.toString('base64'),
      cancelledChequeUrl: this.cancelledChequeUrl.toString('base64'),
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

const model = mongoose.model('Employees', employeesSchema)

export const schema = model.schema
export default model
