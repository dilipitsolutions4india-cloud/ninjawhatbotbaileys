// In-memory automation rules
const rules = {}       // { sessionId: [{ keyword, reply }, ...] }
const defaultReplies = {} // { sessionId: "default reply" }

module.exports = { rules, defaultReplies }
