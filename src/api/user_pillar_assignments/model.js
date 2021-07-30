import mongoose, { Schema } from 'mongoose'

const userPillarAssignmentsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // clientTaxonomyId: {
  //   type: Schema.ObjectId,
  //   ref: 'ClientTaxonomy',
  //   required: false
  // },
  primaryPillar: {
    type: Schema.ObjectId,
    ref: 'Categories',
    required: true
  },
  secondaryPillar:  [{
    type: Schema.ObjectId,
    ref: 'Categories'
  }],
  userId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
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

userPillarAssignmentsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      primaryPillar: this.primaryPillar ? this.primaryPillar.view(full) : null,
      secondaryPillar: this.secondaryPillar ? this.secondaryPillar.view(full) : null,
      userId: this.userId ? this.userId.view(full) : null,
      status: this.status,
      // clientTaxonomyId: this.clientTaxonomyId ? this.clientTaxonomyId.view(full) : null,
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

const model = mongoose.model('UserPillarAssignments', userPillarAssignmentsSchema)

export const schema = model.schema
export default model
