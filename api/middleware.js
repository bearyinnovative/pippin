async function sessionRequired (ctx, next) {
  const sessionToken = ctx.req.headers['auth']
  if (!sessionToken) {
    return ctx.render.sessionRequired(ctx)
  }

  const s = await ctx.models.Session
    .query()
    .equalTo('token', sessionToken)
    .find()

  if (s.length !== 1) {
    return ctx.render.sessionRequired(ctx)
  }

  ctx.session = s[0]

  await next()
}

module.exports = {
  sessionRequired,
}
