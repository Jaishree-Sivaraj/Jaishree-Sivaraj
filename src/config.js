/* eslint-disable no-unused-vars */
import path from 'path'
import merge from 'lodash/merge'



/* istanbul ignore next */
const requireProcessEnv = (name) => {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}



/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv-safe')
  dotenv.config({
    path: path.join(__dirname, '../.env'),
    example: path.join(__dirname, '../.env.example')
  })
}



const config = {
  all: {
    env: process.env.NODE_ENV || 'development',
    root: path.join(__dirname, '..'),
    port: process.env.PORT || 9010,
    ip: process.env.IP || '0.0.0.0',
    apiRoot: process.env.API_ROOT || '',
    defaultEmail: 'no-reply@esgapi.com',
    sendgridKey: requireProcessEnv('SENDGRID_KEY'),
    masterKey: requireProcessEnv('MASTER_KEY'),
    jwtSecret: requireProcessEnv('JWT_SECRET'),
    mongo: {
      options: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
      }
    }
  },
  test: {
    mongo: {
      // uri: `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/esgapi-dev?authSource=admin`,
      uri: 'mongodb://localhost:7777/esgapi-dev',
      options: {
        debug: true
      }
    }
  },
  development: {
    mongo: {
      uri: 'mongodb://localhost/esgapi-dev',
      options: {
        debug: false
      }
    }
  },
  production: {
    ip: process.env.IP || undefined,
    port: process.env.PORT || 9010,
    mongo: {
      uri: `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/esgapi-dev?authSource=admin`,
      options: {
        debug: false
      }
    }
  }
}

module.exports = merge(config.all, config[config.all.env])
export default module.export
