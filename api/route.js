const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const json = require('koa-json')
const bearychat = require('bearychat')

const router = new Router()

router
  .use(bodyParser())
  .use(json())

router.get('/hello', async function(ctx, next) {
  const me = await ctx.bearychat.me()
  ctx.body = {
    hello: 'world',
    bearychat: {
      name: me.name,
    },
  }
})

module.exports = router
