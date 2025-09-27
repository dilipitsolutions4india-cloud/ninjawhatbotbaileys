const express = require("express")
const router = express.Router()
const { getMessages } = require("../controllers/messagesController")
const { listSessions } = require("../controllers/sessionsController")

router.get("/", (req, res) => {
  const registered = listSessions()
  res.render("messages", { registered, sessionId: null, messages: [] })
})

router.get("/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId
  const messages = getMessages(sessionId)
  const registered = listSessions()
  res.render("messages", { registered, sessionId, messages })
})

module.exports = router
