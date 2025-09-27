const express = require("express")
const router = express.Router()
const { listSessions } = require("../controllers/sessionsController")
const { addRule, setDefaultReply, getRules, getDefaultReply } = require("../controllers/automationController")

router.get("/", (req, res) => {
  const registered = listSessions()
  res.render("automation", { registered, sessionId: null, rules: [], defaultReply: "" })
})

router.get("/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId
  const rules = getRules(sessionId)
  const defaultReply = getDefaultReply(sessionId)
  const registered = listSessions()
  res.render("automation", { registered, sessionId, rules, defaultReply })
})

router.post("/addRule", (req, res) => {
  const { sessionId, keyword, reply } = req.body
  addRule(sessionId, keyword, reply)
  res.redirect("/automation/" + sessionId)
})

router.post("/setDefault", (req, res) => {
  const { sessionId, reply } = req.body
  setDefaultReply(sessionId, reply)
  res.redirect("/automation/" + sessionId)
})

module.exports = router
