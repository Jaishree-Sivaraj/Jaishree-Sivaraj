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
  if (env === 'production' || env === 'development' || env === 'test') {
    app.use(cors())
    app.use(compression())
    app.use(morgan('dev'))
  }
  // app.use(bodyParser.json({ limit: "50mb" }));
  // app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
  app.use(express.json({ limit: '50mb', extended: true }));
  app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
  app.use(apiRoot, routes)
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({status: "500", message: err ? err : "API Failed!" });
  })
  app.use(queryErrorHandler())
  app.use(bodyErrorHandler())


  return app
}
