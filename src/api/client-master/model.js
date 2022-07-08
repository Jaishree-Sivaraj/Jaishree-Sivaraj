import mongoose, { Schema } from 'mongoose'

const clientMasterSchema = new Schema({
  clientId: {
    type: String
  },
  clientName: {
    type: String
  },
  taxonomy: {
    type: String
  },
  companyList: {
    type: String
  },
  country: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

clientMasterSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      clientId: this.clientId,
      clientName: this.clientName,
      taxonomy: this.taxonomy,
      companyList: this.companyList,
      country: this.country,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('ClientMaster', clientMasterSchema)

export const schema = model.schema
export default model
