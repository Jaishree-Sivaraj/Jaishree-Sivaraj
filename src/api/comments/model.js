import mongoose, { Schema } from 'mongoose'

const commentsSchema = new Schema({
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: String
  },
  name: {
    type: String
  },
  description: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})


// import mongoose, { Schema } from 'mongoose';
// import { v4 as uuidv4 } from 'uuid';

// const commentSchema = new Schema({

//     userId: {
//         type: Schema.ObjectId,
//         required: true
//     },
//     name: {
//         type: String,
//         required: true
//     },
//     taskId: {
//         type: Schema.ObjectId,
//         required: true
//     },
//     companyId: {
//         type: Schema.ObjectId,
//         required: true
//     },
//     categoryId: {
//         type: Schema.ObjectId,
//         required: true
//     },
//     datapointId: {
//         type: Schema.ObjectId,
//         required: true
//     },
//     errorDetailId: {
//         type: Schema.ObjectId,
//         required: true
//     },
//     threadId: {
//         type: String,
//         default: uuid,
//         unique: true,
//     },
//     role: {
//         type: String,
//         required: true
//     },
//     year: {
//         type: String,
//         required: true
//     },
//     content: {
//         type: String,
//         required: true
//     },
//     status: {
//         type: Boolean,
//         default: true,
//         required: true
//     },
//     isExternal: {
//         type: String,
//         required: true
//     }
// }, {
//     timestamps: true,
//     toJSON: {
//         virtuals: true,
//         transform: (obj, ret) => { delete ret._id }
//     }
// });



// commentSchema.methods = {
//     view(full) {
//         const view = {
//             userId: this.userId,
//             name: this.name,
//             taskId: this.taskId,
//             companyId: this.companyId,
//             categoryId: this.categoryId,
//             datapointId: this.datapointId,
//             errorDetailId: this.errorDetailId,
//             threadId: this.threadId,
//             role: this.role,
//             year: this.year,
//             content: this.content,
//             status: this.status,
//             isExternal: this.isExternal,
//             createdAt: this.createdAt,
//             updatedAt: this.updatedAt
//         }

//         return full ? {
//             ...view
//             // add properties for a full view
//         } : view
//     }
// }

// const model = mongoose.model('Comment', commentSchema)

// export const schema = model.schema
// export default model


commentsSchema.methods = {
  view (full) {
    const view = {
      // simple view
      id: this.id,
      createdBy: this.createdBy.view(full),
      userId: this.userId,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    return full ? {
      ...view
      // add properties for a full view
    } : view
  }
}

const model = mongoose.model('Comments', commentsSchema)

export const schema = model.schema
export default model
