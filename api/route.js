const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const json = require('koa-json')

const router = new Router()

router
  .use(bodyParser())
  .use(json())

router.get('/hello', async (ctx) => {
  const me = await ctx.bearychat.me()
  ctx.body = {
    hello: 'world',
    bearychat: {
      name: me.name,
    },
  }
})

const modules = [
  './session',
  './message',
]

for (let m of modules) {
  require(m)(router)
}

module.exports = router
