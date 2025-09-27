const express = require("express")
const router = express.Router()
const { listSessions, startSession, getSession,deleteSession, sessions } = require("../controllers/sessionsController")

// Dashboard: list all sessions
router.get("/", (req, res) => {
  const registered = listSessions()
  const active = Object.keys(sessions)  // active sessions
  res.render("sessions", { registered, active })
})

// Register new session (shows QR)
router.post("/register", async (req, res) => {
  const { id } = req.body
  if (!id) return res.send("❌ ID required")
  try {
    await startSession(id, req.io)
    res.redirect("/sessions")
  } catch (err) {
    console.error(err)
    res.send("❌ Failed to register session")
  }
})

// Start individual session
router.post("/start", async (req, res) => {
  const { id } = req.body
  if (!id) return res.send("❌ ID required")
  try {
    await startSession(id, req.io)
    res.redirect("/sessions")
  } catch (err) {
    console.error(err)
    res.send("❌ Failed to start session")
  }
})

// Stop individual session
router.post("/stop", async (req, res) => {
  const { id } = req.body
  try {
    const sock = getSession(id)
    if (sock) sock.ws.close()
    res.redirect("/sessions")
  } catch (err) {
    console.error(err)
    res.send("❌ Failed to stop session")
  }
})

// Start all sessions
router.post("/startAll", async (req, res) => {
  const all = listSessions()
  for (const id of all) {
    try { await startSession(id, req.io) } 
    catch (err) { console.error(err) }
  }
  res.redirect("/sessions")
})

// Stop all sessions
router.post("/stopAll", async (req, res) => {
  for (const id in sessions) {
    try { sessions[id].ws.close() } 
    catch (err) { console.error(err) }
  }
  res.redirect("/sessions")
})

// Activate N sessions
router.post("/activate", async (req, res) => {
  const { count } = req.body
  const all = listSessions().slice(0, Number(count))
  for (const id of all) {
    try { await startSession(id, req.io) } 
    catch (err) { console.error(err) }
  }
  res.redirect("/sessions")
})

router.post("/delete", async (req, res) => {
  const { id } = req.body
  if (!id) return res.send("❌ ID required")
  try {
    deleteSession(id)
    res.redirect("/sessions")
  } catch (err) {
    console.error(err)
    res.send("❌ Failed to delete session")
  }
})
module.exports = router
