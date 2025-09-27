const express = require("express")
const http = require("http")
const path = require("path")
const bodyParser = require("body-parser")
const socketio = require("socket.io")
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require("@whiskeysockets/baileys")

// ================== EXPRESS APP ==================
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const expressLayouts = require("express-ejs-layouts")

app.use(expressLayouts)
app.set("layout", "layout")
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

app.use((req, res, next) => {
  req.io = io
  next()
})

// Routes
app.use("/sessions", require("./routes/sessions"))
app.use("/messages", require("./routes/messages"))
app.use("/automation", require("./routes/automation"))
app.use("/bulk", require("./routes/bulk"))

app.get("/", (req, res) => res.redirect("/sessions"))

// ================== HUMAN CHAT LOGIC ==================
const MessagesPatterns = [
  "Hey, what are you doing?",
  "Khana khaya tumne?",
  "Good morning 🌞",
  "Good night 😴",
  "Busy ho kya?",
  "Miss you ❤️",
  "Ping me when free.",
  "Safe journey ✈️",
  "Lol 🤣",
  "😂😂😂",
  "Hmm",
  "K",
  "Scene kya hai?",
  "Party kab de raha? 🎉",
  "Sweet dreams 💭",
  "Jaldi aa ja.",
  "Take care!",
  "Ok 👍",
  "Alright.",
  "Done deal.",
]

const targetNumbers = [
  "919220229776@s.whatsapp.net",
  "918800931204@s.whatsapp.net",
  "919871182401@s.whatsapp.net",
  "919211828252@s.whatsapp.net",
  "917011611817@s.whatsapp.net",
  "918376970739@s.whatsapp.net",
  "919953800553@s.whatsapp.net",
  "919818344297@s.whatsapp.net",
  "916361161836@s.whatsapp.net",

]

// helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function normalizeJid(raw) {
  if (!raw) return null
  if (raw.includes("@")) return raw
  return raw.replace(/^\+/, "") + "@s.whatsapp.net"
}

async function simulateTyping(sock, jid, text, typingTime = 3000) {
  try {
    // show "typing..."
    await sock.sendPresenceUpdate("composing", jid)
    console.log(`💬 Simulating typing to ${jid} for ${typingTime / 1000}s`)

    await new Promise((resolve) => setTimeout(resolve, typingTime))

    // pause typing
    await sock.sendPresenceUpdate("paused", jid)

    // finally send message
    await sock.sendMessage(jid, { text })
    console.log(`✅ Sent to ${jid}: ${text}`)
  } catch (err) {
    console.error(`❌ Failed to send to ${jid}:`, err?.message || err)
  }
}

// ================== INIT BAILEYS ==================
async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")
  console.log("creating auth")
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.macOS("Chrome"), // looks like real chrome
  })

  sock.ev.on("connection.update", (update) => {
    const { connection } = update
    if (connection === "open") {
      console.log("✅ WhatsApp connected, human-like chat enabled!")
    }
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message || !msg.key.remoteJid) return

    const from = msg.key.remoteJid
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (!body) return
    console.log(`📩 Incoming from ${from}: ${body}`)

    // reply after 2–7 minutes
    const replyDelay = randInt(120, 420)
    const replyText = pickRandom(MessagesPatterns)
    console.log(`⏲ Reply scheduled in ${replyDelay}s to ${from} -> "${replyText}"`)

    setTimeout(async () => {
      await simulateTyping(sock, from, replyText, randInt(2000, 6000)) // 2–6s typing
    }, replyDelay * 1000)

    // random outgoing to other targets after 5–15 minutes
    if (targetNumbers.length > 0) {
      const targetRaw = pickRandom(targetNumbers)
      const targetJid = normalizeJid(targetRaw)
      const targetDelay = randInt(300, 900)
      const targetText = pickRandom(MessagesPatterns)
      console.log(`⏲ Outgoing scheduled in ${targetDelay}s to ${targetJid} -> "${targetText}"`)

      setTimeout(async () => {
        await simulateTyping(sock, targetJid, targetText, randInt(2000, 6000))
      }, targetDelay * 1000)
    }
  })

  return sock
}

// ================== START SERVER ==================
const PORT = 3000
server.listen(PORT, () =>
  console.log(`🚀 Dashboard running at http://localhost:${PORT}`)
)

startSock()
