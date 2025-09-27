const { rules, defaultReplies } = require("../models/automationRules")

function addRule(sessionId, keyword, reply) {
  if (!rules[sessionId]) rules[sessionId] = []
  rules[sessionId].push({ keyword, reply })
}

function setDefaultReply(sessionId, reply) {
  defaultReplies[sessionId] = reply
}

function getRules(sessionId) {
  return rules[sessionId] || []
}

function getDefaultReply(sessionId) {
  return defaultReplies[sessionId] || ""
}

module.exports = { addRule, setDefaultReply, getRules, getDefaultReply }
