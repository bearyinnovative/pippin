const uuid = require('uuid/v4')

async function init (ctx) {
  const session = new ctx.models.Session()
  await session.save({
    token: uuid(),
    ip: ctx.req.headers['x-real-ip'],
  })

  ctx.body = {
    token: session.get('token'),
  }
}

module.exports = (router) => {
  router.post('/session', init)
}
