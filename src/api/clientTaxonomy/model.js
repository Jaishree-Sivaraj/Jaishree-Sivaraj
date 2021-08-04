import mongoose, { Schema } from 'mongoose'

const clientTaxonomySchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  taxonomyName: {
    type: String
  },
  fields:[{
    name: {
      type: String
    },
    fieldName: {
      type: String
    },
    description: {
      type: String
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    inputType: {
      type: String
    },
    inputValues: {
      type: Array,
      default: []
    },
    toDisplay: {
      type: Boolean,
      default: false
    }
  }],
  fiscalYearEndDate: {
    type: String
  },
  fiscalYearEndMonth: {
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

clientTaxonomySchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      taxonomyName: this.taxonomyName,
      fields: this.fields ? this.fields : [],
      fiscalYearEndDate: this.fiscalYearEndDate ? this.fiscalYearEndDate : '',
      fiscalYearEndMonth: this.fiscalYearEndMonth ? this.fiscalYearEndMonth : '',
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

const model = mongoose.model('ClientTaxonomy', clientTaxonomySchema)

export const schema = model.schema
export default model
