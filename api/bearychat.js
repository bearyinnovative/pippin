const bearychat = require('bearychat')

class BearyChat {
  constructor(token) {
    this.token = token
  }

  _p(payload = {}) {
    payload.token = this.token
    return payload
  }

  async me() {
    return bearychat.user.me(this._p())
      .then((resp) => {
        return resp.json()
      })
  }
}

module.exports = () => {
  var token = process.env.BEARYCHAT_RTM_TOKEN
  if (!token) {
    throw 'BEARYCHAT_RTM_TOKEN required'
  }

  return new BearyChat(token)
}
