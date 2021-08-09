import mongoose, { Schema } from 'mongoose'

const validationsSchema = new Schema({
//   createdBy: {
//     type: Schema.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   datapointId: {
//     type: Schema.ObjectId,
//     ref: 'Datapoints',
//     required: true
//   },
//   validationRule: {
//     type: String
//   },
//   rule: {
//     type: String
//   },
//   dependantCode: {
//     type: String
//   },
//   condition: {
//     type: String
//   },
//   criteria: {
//     type: String
//   },
//   validationAlert: {
//     type: String
//   },
//   status: {
//     type: Boolean,
//     default: true
//   }
// }, {
//   timestamps: true,
//   toJSON: {
//     virtuals: true,
//     transform: (obj, ret) => { delete ret._id }
//   }
// })

// validationsSchema.methods = {
//   view (full) {
//     const view = {
//       // simple view
//       id: this.id,
//       createdBy: this.createdBy ? this.createdBy.view(full) : null,
//       datapointId: this.datapointId ? this.datapointId.view(full) : null,
//       validationRule: this.validationRule,
//       rule: this.rule,
//       dependantCode: this.dependantCode,
//       condition: this.condition,
//       criteria: this.criteria,
//       validationAlert: this.validationAlert,
//       status: this.status,
//       createdAt: this.createdAt,
//       updatedAt: this.updatedAt
//     }

datapointId: {
  type: Schema.ObjectId,
  ref: 'Datapoints',
  required: true
},
dpCode: {
  type: String,
  required: true
},
clientTaxonomyId: {
  type: Schema.ObjectId,
  ref: 'ClientTaxonomy',
  required: true
}, 
validationRule: {
  type: String
},
dataType: {
  type: String,
  required: true
},
hasDependentCode: {
  type: Boolean
},
dependentCodes: {
  type: Array
},
validationType: {
  type: String
},
percentileThreasholdValue: {
  type: String
},
parameters: {
  type: Array
},
methodName: {
  type: String
},
checkCondition: {
  type: String
},
criteria: {
  type: String
},
checkResponse: {
  type: Array
},
errorMessage: {
  type: String
},
categoryId: {
  type: Schema.ObjectId,
  ref: 'Categories',
  required: false
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

validationsSchema.methods = {
view (full) {
  const view = {
    // simple view
    id: this.id,
    datapointId: this.datapointId ? this.datapointId.view(full) : null,
    dpCode: this.dpCode,
    clientTaxonomyId: this.clientTaxonomyId ? this.clientTaxonomyId.view(full) : null,
    categoryId: this.categoryId ? this.categoryId.view(full) : null,
    validationRule: this.validationRule,
    dataType: this.dataType,
    hasDependentCode: this.hasDependentCode,
    dependantCodes: this.dependantCodes,
    validationType: this.validationType,
    percentileThreasholdValue: this.percentileThreasholdValue,
    parameters: this.parameters,
    methodName: this.methodName,
    checkCondition: this.checkCondition,
    criteria: this.criteria,
    checkResponse: this.checkResponse,
    sucessAlert: this.sucessAlert,
    failureAlert: this.failureAlert,
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

const model = mongoose.model('Validations', validationsSchema)

export const schema = model.schema
export default model
