const bearychat = require('bearychat')

const parseJSON = (resp) => { return resp.json() }

const QUERY_MESSAGES_LIMIT = 50

class BearyChat {
  constructor(token) {
    this.token = token
  }

  async _init() {
    this.currentUser = await this.me()
  }

  _p(payload = {}) {
    payload.token = this.token
    return payload
  }

  async me() {
    return bearychat.user.me(this._p()).then(parseJSON)
  }

  async createSessionChannel(session, memberIds) {
    const payload = this._p({
      // TODO better naming
      name: `pippin-${session.get('token').substring(0, 5)}`,
      member_uids: memberIds,
    })

    return bearychat.sessionChannel.create(payload).then(parseJSON)
  }

  async sendMessage(vchannelId, text) {
    const payload = this._p({
      vchannel_id: vchannelId,
      text,
      attachments: [],
    })

    return bearychat.message.create(payload).then(parseJSON)
  }

  async queryMessageSince(vchannelId, sinceKey) {
    const payload = this._p({
      vchannel_id: vchannelId,
      query: {
        since: {
          key: sinceKey,
          backward: QUERY_MESSAGES_LIMIT,
        },
      },
    })

    return bearychat.message.query(payload).then(parseJSON)
  }

  async queryMessageLatest(vchannelId) {
    const payload = this._p({
      vchannel_id: vchannelId,
      query: {
        latest: {
          limit: QUERY_MESSAGES_LIMIT,
        },
      },
    })

    return bearychat.message.query(payload).then(parseJSON)
  }

  isMessageFromMe(message) {
    return message.uid === this.currentUser.id
  }
}

module.exports = async () => {
  var token = process.env.BEARYCHAT_RTM_TOKEN
  if (!token) {
    throw 'BEARYCHAT_RTM_TOKEN required'
  }

  const bc = new BearyChat(token)

  await bc._init()

  return bc
}
