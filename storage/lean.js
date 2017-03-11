const AV = require('leanengine')

// Customer session
const Session = AV.Object.extend('Session')
Session.query = () => {
  return new AV.Query('Session')
}

module.exports = {
  Session,
}
