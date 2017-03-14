const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const AV = require('leanengine')
const serve = require('koa-static')
const mount = require('koa-mount')

AV.init({
  appId: process.env.LEANCLOUD_APP_ID || '{{appid}}',
  appKey: process.env.LEANCLOUD_APP_KEY || '{{appkey}}',
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || '{{masterkey}}',
})

app.context.render = require('./api/response')
app.context.bearychat = require('./api/bearychat')()
app.context.models = require('./storage/lean')
app.context.config = require('./pippin.config.js')

app.use(AV.koa())

// api route
const router = new Router()
const apiRoute = require('./api/route')
router.use('/api/v1', apiRoute.routes(), apiRoute.allowedMethods())
app.use(router.routes())

// dev page
if (app.env !== 'production') {
  app.use(mount('/s', serve(__dirname + '/s')))
} else {
  app.use(mount('/s', serve(__dirname + '/dist')))
}

app.listen(process.env.LEANCLOUD_APP_PORT)
