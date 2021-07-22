import mongoose, { Schema } from 'mongoose'

const datapointsSchema = new Schema({
  updatedBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: false
  },
  categoryId: {
    type: Schema.ObjectId,
    ref: 'Categories',
    required: true
  },
  name: {
    type: String
  },
  code: {
    type: String
  },
  description: {
    type: String
  },
  polarity: {
    type: String
  },
  dataCollection: {
    type: String
  },
  dataCollectionGuide: {
    type: String
  },
  normalizedBy: {
    type: String
  },
  weighted: {
    type: String
  },
  relevantForIndia: {
    type: String
  },
  standaloneOrMatrix: {
    type: String
  },
  reference: {
    type: String
  },
  industryRelevant: {
    type: String
  },
  unit: {
    type: String
  },
  signal: {
    type: String
  },
  percentile: {
    type: String
  },
  finalUnit: {
    type: String
  },
  keyIssueId: {
    type: Schema.ObjectId,
    ref: 'KeyIssues',
    required: true
  },
  functionId: {
    type: Schema.ObjectId,
    ref: 'Functions',
    required: true
  },
  dpType: {
    type: String
  },
  dpStatus: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
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
    type: String
  },
  dependentCodes: {
    type: Array
  },
  hasDependentCode: {
    type: Boolean,
    default: false
  },
  validationTypes: {
    type: Array
  },
  percentileThresholdValue: {
    type: String
  },
  parameters: {
    type: String
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
  collectionOrderNumber: {
    type: Number
  },
  isPriority: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})

datapointsSchema.methods = {
  view(full) {
    const view = {
      // simple view
      id: this.id,
      updatedBy: this.updatedBy ? this.updatedBy.view(full) : null,
      categoryId: this.categoryId ? this.categoryId.view(full) : null,
      name: this.name,
      code: this.code,
      description: this.description,
      polarity: this.polarity,
      dataCollection: this.dataCollection,
      dataCollectionGuide: this.dataCollectionGuide,
      normalizedBy: this.normalizedBy,
      weighted: this.weighted,
      relevantForIndia: this.relevantForIndia,
      standaloneOrMatrix: this.standaloneOrMatrix,
      reference: this.reference,
      industryRelevant: this.industryRelevant,
      unit: this.unit,
      isPriority:this.isPriority,
      signal: this.signal,
      percentile: this.percentile,
      finalUnit: this.finalUnit,
      keyIssueId: this.keyIssueId ? this.keyIssueId.view(full) : null,
      functionId: this.functionId ? this.functionId.view(full) : null,
      clientTaxonomyId: this.clientTaxonomyId ? this.clientTaxonomyId.view(full) : null,
      validationRule: this.validationRule,
      dataType: this.dataType,
      dependentCodes: this.dependentCodes,
      validationTypes: this.validationTypes,
      percentileThresholdValue: this.percentileThresholdValue,
      dpType: this.dpType,
      dpStatus: this.dpStatus,
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

const model = mongoose.model('Datapoints', datapointsSchema)

export const schema = model.schema
export default model
