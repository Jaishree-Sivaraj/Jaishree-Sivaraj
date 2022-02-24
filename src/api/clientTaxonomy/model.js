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
  isDerivedCalculationRequired: {
    type: Boolean,
    default: true
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
    type: Object,
    default: {
      additionalFields: {
        type: Array,
        default: []
      }
    },
  },
  outputFields: {
    type: Object,
    default: {
      cin: { displayName: 'bvd9', fieldName: 'cin', orderNumber: 4 },
      companyName: { displayName: 'name_of_company', fieldName: 'companyName', orderNumber: 5  },
      additionalFields: {
        type: Array,
        default: []
      }
    },
  }
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
      outputFields: this.outputFields ? this.outputFields : {},
      status: this.status,
      isDerivedCalculationRequired: this.isDerivedCalculationRequired,
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
//    type: String
//   },/   description: {
//     typString
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


