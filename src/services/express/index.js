import express from 'express'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
// import bodyParser from 'body-parser'
import { errorHandler as queryErrorHandler } from 'querymen'
import { errorHandler as bodyErrorHandler } from 'bodymen'
import { env } from '../../config'

export default (apiRoot, routes) => {
  const app = express()

  /* istanbul ignore next */
  if (env === 'production' || env === 'development' || env === 'test' || env === 'demo') {
    app.use(cors())
    app.use(compression())
    app.use(morgan('dev'))
  }
  // app.use(bodyParser.json({ limit: "50mb" }));
  // app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
  app.use(express.json({ limit: '100mb', extended: true }));
  app.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 100000 }));
  app.use(apiRoot, routes)
  app.use(queryErrorHandler())
  app.use(bodyErrorHandler())

  app.get('/crashed', (err, res) => {
     res.status(500).json({message:  "Failed, some error occured!" });
  })

  app.get('/', (req, res) => res.status(200).json({ message: "Location-Service - CHECK" }))

  app.use((err, req, res, next) => {
    console.log("Error", err);
    console.error(err);
    res.redirect('/crashed')
  })
  return app
}
