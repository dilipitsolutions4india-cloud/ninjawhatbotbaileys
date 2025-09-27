// controllers/sessionsController.js
const fs = require("fs")
const path = require("path")
const qrcode = require("qrcode")
const P = require("pino")
const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const { handleMessage } = require("./messagesController")

const SESSIONS_DIR = path.join(__dirname, "..", "sessions")
const sessions = {} // in-memory active sockets

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true })

/**
 * List registered session folders (strings)
 */
function listSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return []
  return fs.readdirSync(SESSIONS_DIR)
}

/**
 * Return the socket for a sessionId
 */
function getSession(sessionId) {
  return sessions[sessionId] || null
}


function deleteSession(sessionId) {
  // 1️⃣ Close the socket if running
  if (sessions[sessionId]) {
    try {
      sessions[sessionId].ws.close()
    } catch (err) {
      console.error(err)
    }
    delete sessions[sessionId]
    if (global.sessions) delete global.sessions[sessionId]
  }

  // 2️⃣ Delete the session folder and all its contents
  const sessionPath = path.join(SESSIONS_DIR, sessionId)
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true })
    console.log(`✅ Session folder ${sessionId} deleted`)
  }
}



/**
 * Start (or re-start) a session and emit QR/status via `io` (optional)
 * - sessionId: string folder name under ./sessions
 * - io: socket.io instance (optional) - used to emit QR and status to the web UI
 */
async function startSession(sessionId, io = null) {
  if (sessions[sessionId]) {
    console.log(`Session ${sessionId} already running`)
    return sessions[sessionId]
  }

  const sessionPath = path.join(SESSIONS_DIR, sessionId)
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // we will emit QR to browser via socket.io
    logger: P({ level: "silent" })
  })

  // save credentials on update
  sock.ev.on("creds.update", saveCreds)

  // messages -> forward to messagesController
  sock.ev.on("messages.upsert", (m) => {
    try { handleMessage(sessionId, m, sock, io) } catch (e) { console.error("handleMessage error", e) }
  })

  // listen for connection updates (QR arrives here too)
  sock.ev.on("connection.update", (update) => {
    try {
      // QR string appears here when terminal wants to show QR
      if (update.qr) {
        // convert QR string to data URL for the browser
        qrcode.toDataURL(update.qr, (err, url) => {
          if (!err) {
            console.log(`QR for ${sessionId} generated`)
            if (io) io.emit("qr", { sessionId, qrDataUrl: url })
          } else {
            console.error("qrcode.toDataURL err", err)
          }
        })
      }

      const { connection, lastDisconnect } = update
      if (connection === "open") {
        console.log(`✅ Session ${sessionId} connected`)
        // register sock in local and global maps
        sessions[sessionId] = sock
        if (!global.sessions) global.sessions = {}
        global.sessions[sessionId] = sock
        if (io) io.emit("sessionStatus", { sessionId, status: "connected" })
      } else if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode
        console.log(`Connection for ${sessionId} closed, reason:`, reason)
        if (reason === DisconnectReason.loggedOut) {
          // logged out: remove active socket and notify UI
          console.log(`Session ${sessionId} logged out (remove credentials if you want)`)
          delete sessions[sessionId]
          if (global.sessions) delete global.sessions[sessionId]
          if (io) io.emit("sessionStatus", { sessionId, status: "loggedOut" })
        } else {
          // try reconnecting after small delay
          if (io) io.emit("sessionStatus", { sessionId, status: "reconnecting" })
          setTimeout(() => startSession(sessionId, io), 2000)
        }
      }
    } catch (err) {
      console.error("connection.update handler error", err)
    }
  })

  return sock
}

module.exports = { listSessions, startSession, getSession,deleteSession, sessions }
