import mongoose, { Schema } from 'mongoose'

const ACTUAL = 'Actual';
const PROXY = 'Proxy';
const DERIVED = 'Derived';
export const dpResponseType = [ACTUAL, PROXY, DERIVED];

const clientTaxonomySchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  taxonomyName: {
    type: String
  },
  fields: {
    type: Array,
    default: []
  },
  status: {
    type: Boolean,
    default: true
  },
  hasChildDp: {
    type: Boolean,
    default: false
  },
  childFields: {
    companyDataElementLabel: {
      type: String,
      default: ''
    },
    companyDataElementSubLabel: {
      type: String,
      default: ''
    },
    dataType: {
      type: String,
      default: ''
    },
    dataValue: {
      type: Number,
      default: ''
    },
    formatOfDataProvidedByCompany: {
      type: String,
      default: ''
    },
    keywordUsed: {
      type: String,
      default: ''
    },
    pageNumber: {
      type: Number,
      default: ''
    },
    sectionOfDocument: {
      type: String,
      default: ''
    },
    supportingNarrative: {
      type: String,
      default: ''
    },
    snapShot: {
      type: String,
      default: ''
    },
    typeOf: {
      type: String,
      default: ACTUAL,
      enum: dpResponseType
    },
    additionalFields: {
      type: Array,
      default: []
    }
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

clientTaxonomySchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      taxonomyName: this.taxonomyName,
      fields: this.fields ? this.fields : [],
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

// {
//   name: {
//     type: String
//   },
//   fieldName: {
//     type: String
//   },
//   description: {
//     type: String
//   },
//   isRequired: {
//     type: Boolean,
//     default: false
//   },
//   inputType: {
//     type: String
//   },
//   inputValues: {
//     type: Array,
//     default: []
//   },
//   toDisplay: {
//     type: Boolean,
//     default: false
//   }
// }