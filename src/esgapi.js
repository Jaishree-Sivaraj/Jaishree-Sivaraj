require('@babel/register')

exports = module.exports = require('./app')
process.on('uncaughtException', err => {
    console.log('uncaughtException', err);
    process.exit(1)
})
process.on('unhandledRejection', (err, promise) => {
    console.log('unhandledRejection', err);
    process.exit(1)
})
