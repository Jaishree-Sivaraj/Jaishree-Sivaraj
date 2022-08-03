import mongoose, { Schema } from 'mongoose'

const resourcesSchema = new Schema({
  name:{
    type:String
  },
  file:{
    type:Object
  },
  accessibleFor:[{
    type:Object,
    default:[]
}],
  status:{
    type:Boolean,
    default:true
  }

}, { timestamps: true })

resourcesSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      name:this.name,
      file:this.file,
      accessibleFor:this.accessibleFor,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('Resources', resourcesSchema)

export const schema = model.schema
export default model
