function sessionRequired (ctx) {
  ctx.body = {
    error: 'session required',
  }
  ctx.status = 401
}

function badRequest (ctx, reason = 'bad request') {
  ctx.body = {
    error: reason,
  }
  ctx.status = 400
}

module.exports = {
  sessionRequired,
  badRequest,
}
