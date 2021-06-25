import crypto from 'crypto'
import bcrypt from 'bcrypt'
import mongoose, { Schema } from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import { env } from '../../config'

const roles = ['user', 'admin']

const userSchema = new Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    index: true,
    trim: true
  },
  roleId: {
    type: Schema.ObjectId,
    ref: 'Role',
    required: false
  },
  otp: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'user'
  },
  userType: {
    type: String
  },
  roleDetails: {
    roles: [{
      type: Schema.ObjectId,
      ref: 'Role',
      required: false
    }],
    primaryRole: {
      type: Schema.ObjectId,
      ref: 'Role',
      required: false
    }
  },
  picture: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  comments: {
    type: String,
    default: ''
  },
  isUserApproved: {
    type: Boolean,
    default: false
  },
  status: {
    type: Boolean,
    default: true
  },
  companyId: {
    type: Schema.ObjectId,
    ref: 'Companies',
    required: false
  },
  authenticationLetterForClientUrl: {
    type: String,
    default: ''
  },
  companyIdForClient: {
    type: String,
    default: ''
  },
  isRoleAssigned: {
    type: Boolean,
    default: false
  },
  isAssignedToGroup: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

userSchema.path('email').set(function (email) {
  if (!this.picture || this.picture.indexOf('https://gravatar.com') === 0) {
    const hash = crypto.createHash('md5').update(email).digest('hex')
    this.picture = `https://gravatar.com/avatar/${hash}?d=identicon`
  }

  if (!this.name) {
    this.name = email.replace(/^(.+)@.+$/, '$1')
  }

  return email
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()

  /* istanbul ignore next */
  const rounds = env === 'test' ? 1 : 9

  bcrypt.hash(this.password, rounds).then((hash) => {
    this.password = hash
    next()
  }).catch(next)
})

userSchema.methods = {
  view(full) {
    const view = {}
    let fields = ['id', 'name', 'email', 'role', 'roleId', 'userType', 'picture', 'phoneNumber', 'comments', 'isUserApproved', 'isRoleAssigned', 'isAssignedToGroup', 'status', "roleDetails"]

    if (full) {
      fields = [...fields, 'email', 'createdAt']
    }

    fields.forEach((field) => { view[field] = this[field] })

    return view
  },

  authenticate(password) {
    return bcrypt.compare(password, this.password).then((valid) => valid ? this : false)
  }

}

userSchema.statics = {
  roles
}

userSchema.plugin(mongooseKeywords, { paths: ['email', 'name'] })

const model = mongoose.model('User', userSchema)

export const schema = model.schema
export default model
