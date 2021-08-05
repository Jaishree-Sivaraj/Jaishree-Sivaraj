import mongoose, { Schema } from 'mongoose'

const taxonomiesSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fieldName: {
    type: String,
    required: true,
    default: ''
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  applicableFor: {
    type: String,
    default: 'Only Data Collection'
  },
  inputType: {
    type: String,
    default: 'Static'
  }, 
  inputValues: {
    type: String,
    default: ''
  }, 
  toDisplay: {
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

taxonomiesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      name: this.name ? this.name : '',
      fieldName: this.fieldName ? this.fieldName : '',
      isRequired: this.isRequired,
      applicableFor: this.applicableFor ? this.applicableFor : 'Only Data Collection',
      inputType: this.inputType ? this.inputType : '', 
      inputValues: this.inputValues ? this.inputValues : '', 
      toDisplay: this.toDisplay ? this.toDisplay : false,
      status: this.status,
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

const model = mongoose.model('Taxonomies', taxonomiesSchema)

export const schema = model.schema
export default model
