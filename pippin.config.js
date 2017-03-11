const customerServiceMemberIds = (process.env.PIPPIN_CUSTOMER_SERVICE_MEMBER_IDS || '')
  .split(',')
  .map((i) => i.trim())
  .filter((i) => !!i)

if (!customerServiceMemberIds || customerServiceMemberIds.length < 1) {
  console.error('PIPPIN_CUSTOMER_SERVICE_MEMBER_IDS required')
  process.exit(1)
}

module.exports = {
  customerServiceMemberIds,
}
