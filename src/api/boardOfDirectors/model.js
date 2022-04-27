import mongoose, { Schema } from 'mongoose'

const boardOfDirectors = new Schema({
  din: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  gender: {
    type: String
    },
  companies: {
    type: [],
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

boardOfDirectors.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      din: this.din ? this.din : '',
      name: this.name,
      gender: this.gender,
      companies: this.companies ? this.companies : '',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('BoardOfDirectors', boardOfDirectors)

export const schema = model.schema
export default model
