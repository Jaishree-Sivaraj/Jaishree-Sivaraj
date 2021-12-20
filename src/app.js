import http from 'http'
import { env, mongo, port, ip, apiRoot } from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'

const app = express(apiRoot, api)
const server = http.createServer(app)

if (mongo.uri) {
  mongoose.connect(mongo.uri)
    .then(() => {
      console.log('Connected to db')
    })
    .catch((error) => {
      console.error('Database connection connected')
      console.error(error)
    })

  mongoose.connection.on('error', err => {
    console.log(err)
  })
}

mongoose.Promise = Promise

setImmediate(() => {
  server.listen(port, ip, () => {
    console.log('Express server listening on http://%s:%d, in %s mode', ip, port, env)
  })
})

export default app
