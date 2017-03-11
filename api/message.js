const mw = require('./middleware')

async function create(ctx) {
  const text = ctx.request.body.text
  if (!text) {
    return ctx.render.badRequest(ctx, 'text is required')
  }

  let vchannelId = ctx.session.get('vchannel_id')
  if (!vchannelId) {
    const channel = await ctx.bearychat.createSessionChannel(
      ctx.session,
      ctx.config.customerServiceMemberIds,
    )
    vchannelId = channel.vchannel_id
    ctx.session.set('vchannel_id', vchannelId)
    await ctx.session.save()
  }

  await ctx.bearychat.sendMessage(vchannelId, text)

  ctx.status = 201
}

function isDisplayableMessage(message) {
  return message.subtype === 'normal'
}

function simplifyMessage(bc, message) {
  return {
    text: message.text,
    is_me: bc.isMessageFromMe(message),
    key: message.key,
    created: message.created,
  }
}

async function queryLatest(ctx) {
  let vchannelId = ctx.session.get('vchannel_id')
  if (!vchannelId) {
    ctx.body = []
    return
  }

  const rv = await ctx.bearychat.queryMessageLatest(vchannelId)
  ctx.body = rv.messages
    .filter(isDisplayableMessage)
    .map((m) => simplifyMessage(ctx.bearychat, m))
}

async function querySince(ctx) {
  let vchannelId = ctx.session.get('vchannel_id')
  if (!vchannelId) {
    ctx.body = []
    return
  }

  const rv = await ctx.bearychat.queryMessageSince(vchannelId, ctx.params.since)
  ctx.body = rv.messages
    .filter(isDisplayableMessage)
    .map((m) => simplifyMessage(ctx.bearychat, m))
}

module.exports = (router) => {
  router.post('/message', mw.sessionRequired, create)
  router.get('/message', mw.sessionRequired, queryLatest)
  router.get('/message/:since', mw.sessionRequired, querySince)
}
