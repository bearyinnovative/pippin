var Koa = require('koa')
var app = new Koa()
var Nuxt = require('nuxt')
var Router = require('koa-router')
var AV = require('leanengine')

AV.init({
  appId: process.env.LEANCLOUD_APP_ID || '{{appid}}',
  appKey: process.env.LEANCLOUD_APP_KEY || '{{appkey}}',
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || '{{masterkey}}',
})

var config = require('./nuxt.config.js')
config.dev = !(app.env === 'production')

var nuxt = new Nuxt(config)

// Build only in dev mode
if (config.dev) {
  nuxt.build()
  .catch((error) => {
    console.error(error) // eslint-disable-line no-console
    process.exit(1)
  })
}

app.use(AV.koa())

var router = new Router()
var apiRoute = require('./api/route')

router.use('/api/v1', apiRoute.routes(), apiRoute.allowedMethods())

app.use(router.routes())

app.context.render = require('./api/response')
app.context.bearychat = require('./api/bearychat')()
app.context.models = require('./storage/lean')
app.context.config = require('./pippin.config.js')

app.use(async (ctx, next) => {
  ctx.status = 200 // koa defaults to 404 when it sees that status is unset
  await nuxt.render(ctx.req, ctx.res)
})

app.listen(process.env.LEANCLOUD_APP_PORT)
