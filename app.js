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
const MessagesPatterns =  [
  // ---------------- ENGLISH CASUAL ----------------
  "Hey, what are you doing?",
  "Did you have lunch?",
  "Good morning! 🌞",
  "Good night, sleep well 😴",
  "Where are you now?",
  "Call me when you’re free.",
  "How’s work going?",
  "Long time no see!",
  "What’s up?",
  "Are you coming today?",
  "How was your day?",
  "Good evening 🌆",
  "Just reached home.",
  "Let’s meet soon!",
  "Are you busy?",
  "Ping me when you’re online.",
  "Had breakfast?",
  "Good afternoon ☀️",
  "See you tomorrow.",
  "Take care!",
  "How’s your health?",
  "I was just thinking of you.",
  "Call me later.",
  "How’s family doing?",
  "Did you watch the match?",
  "Let’s go for a walk.",
  "What’s new?",
  "I miss you.",
  "How’s everything?",
  "Are you awake?",
  "Still at work?",
  "Did you reach safely?",
  "How’s the weather?",
  "Feeling sleepy?",
  "Talk to you later.",
  "Where shall we meet?",
  "Any plans for tonight?",
  "Don’t forget.",
  "Good luck 🍀",
  "Congratulations 🎉",
  "I’ll text you later.",
  "When are you free?",
  "Call me asap.",
  "Sorry, was busy.",
  "Are you online?",
  "Message me once you reach.",
  "I’ll wait for your reply.",
  "What are you watching?",
  "Any update?",
  "On the way.",
  "Reached?",
  "Okay 👍",
  "Cool 😎",
  "Sure.",
  "Done.",
  "Later.",
  "Fine.",
  "Hmm",
  "K",
  "Alright.",
  "Got it.",
  "Noted.",
  "No problem.",
  "Take rest.",
  "Sleep tight 🌙",
  "Sweet dreams 💭",
  "Miss you.",
  "Love you ❤️",
  "See you soon.",
  "Don’t worry.",
  "Relax.",
  "Enjoy!",
  "Be happy.",
  "Drive safe 🚗",
  "Safe journey ✈️",
  "All the best!",
  "Feeling good?",
  "I’m tired.",
  "Let’s chill.",
  "Boring day 😒",
  "Nice!",
  "That’s cool.",
  "Sounds good.",
  "Perfect!",
  "Great job 👏",
  "So funny 😂",
  "Seriously?",
  "Unbelievable!",
  "For real?",
  "OMG 😱",
  "Wait a sec.",
  "Give me 5 mins.",
  "Right now?",
  "Not sure.",
  "Maybe.",
  "I’ll think about it.",
  "Done deal.",
  "Ok then.",
  "Later bro.",
  "See ya.",
  "Catch you soon.",

  // ---------------- HINDI CASUAL ----------------
  "Kya kar rahe ho?",
  "Khana khaya tumne?",
  "Subah subah good morning ☀️",
  "Raat me ache se sona 😴",
  "Abhi kahan ho?",
  "Fursat mile to call karna.",
  "Kaam kaisa chal raha hai?",
  "Bahut dino baad baat ho rahi hai!",
  "Kya haal hai?",
  "Aaj aa rahe ho na?",
  "Din kaisa tha?",
  "Good evening dost 🌆",
  "Bas ghar pahunch gaya.",
  "Jaldi milte hain.",
  "Busy ho kya?",
  "Online aate hi msg karna.",
  "Nashta kiya?",
  "Good afternoon ☀️",
  "Kal milte hain.",
  "Apna khayal rakhna.",
  "Tabiyat kaisi hai?",
  "Abhi yaad aaya tumhari.",
  "Baad me call karna.",
  "Parivaar kaisa hai?",
  "Match dekha?",
  "Chalne chale ghoomne?",
  "Kya naya chal raha hai?",
  "Yaad aa rahe ho.",
  "Sab thik?",
  "Jaag rahe ho?",
  "Abhi office me ho?",
  "Safe pahunch gaye?",
  "Mausam kaisa hai?",
  "Neend aa rahi hai?",
  "Chalo baad me baat karte hain.",
  "Kahan milna hai?",
  "Aaj raat ka kya plan hai?",
  "Mat bhoolna.",
  "Shubhkamnayein 🎉",
  "Badhai ho 🎊",
  "Baad me text karunga.",
  "Kab free ho?",
  "Jaldi call karo.",
  "Sorry, thoda busy tha.",
  "Online ho?",
  "Pahunchte hi msg karna.",
  "Reply ka wait kar raha hoon.",
  "Kya dekh rahe ho?",
  "Kuch update?",
  "Bas raste me hoon.",
  "Pahunch gaye?",
  "Theek hai 👍",
  "Cool hai 😎",
  "Sure hai.",
  "Ho gaya.",
  "Baad me.",
  "Theek.",
  "Hmm",
  "K",
  "Chalo thik hai.",
  "Samajh gaya.",
  "Likh liya.",
  "Koi baat nahi.",
  "Aaram karo.",
  "Acchi neend lena 🌙",
  "Meethi neend 💭",
  "Yaad aa rahi hai.",
  "Pyaar karta hoon ❤️",
  "Jaldi milte hain.",
  "Tension mat lo.",
  "Chill karo.",
  "Maza karo!",
  "Khush raho.",
  "Gaadi sambhal ke chalana 🚗",
  "Yatra shubh ho ✈️",
  "Shubhkamnaayein!",
  "Tabiyat theek hai?",
  "Thoda tired hoon.",
  "Chalo chill karte hain.",
  "Din boring tha 😒",
  "Mast!",
  "Sahi hai.",
  "Badiya!",
  "Bahut accha.",
  "Shandar 👏",
  "Hahaha 😂",
  "Sach me?",
  "Vishwas nahi ho raha!",
  "Kya baat hai!",
  "Arey wah 👌",
  "Ek minute.",
  "5 min ruk ja.",
  "Abhi?",
  "Pata nahi.",
  "Ho sakta hai.",
  "Soch ke batata hoon.",
  "Ho gaya kaam.",
  "Chalo fir.",
  "Milte hain.",

  // ---------------- HINGLISH CASUAL ----------------
  "Kya kar rahe ho yaar?",
  "Lunch ho gaya kya?",
  "GM dost 😎",
  "GN buddy ✨",
  "Abhi kahan busy ho?",
  "Free ho to call karna.",
  "Work kaisa chal raha hai?",
  "Itna time ho gaya, milna chahiye ab!",
  "WhatsApp pe active ho?",
  "Aaj ka plan kya hai?",
  "Kal office aa rahe ho?",
  "Scene kya hai aaj?",
  "Kaam kaisa chal raha?",
  "Weekend ka plan bana?",
  "Party kab de raha?",
  "Kahan se aa rahe ho?",
  "Kya mast photo hai!",
  "Mujhe forward kar dena.",
  "Movie chale kya?",
  "Shopping chalte?",
  "Chai pe milte hain.",
  "Kya mast lag rahe ho.",
  "Kuch khushkhabri?",
  "Scene on hai?",
  "Call u later.",
  "Ping kar dena.",
  "Oye, kya haal hai?",
  "Miss u yaar.",
  "Jaldi aa ja.",
  "Wait kar raha hoon.",
  "Nikal gaye?",
  "On the way ho?",
  "Kaafi time ho gaya!",
  "Aaj mat bhoolna.",
  "Kal chalenge.",
  "Mast hai!",
  "Solid 😂",
  "Full on masti!",
  "Bakwaas mat kar.",
  "Chal nikal.",
  "Arey serious bol!",
  "Jhakaas!",
  "Scene tight!",
  "LOL 🤣",
  "ROFL 😂😂",
  "Tu pagal hai kya 😅",
  "Chill maar.",
  "Dekh lunga tujhe.",
  "Chal party karte hain.",
  "Selfie bhej!",
  "DP mast hai.",
  "Status solid hai.",
  "Meme bhej na.",
  "Bhai ka swag 😎",
  "Khatarnak 🔥",
  "Overacting mat kar.",
  "Bhai wah!",
  "Kya scene ban raha hai?",
  "Mast joke tha 😂",
  "Arey wah 👌",
  "Thik hai bro.",
  "Done deal.",
  "Sorted!",
  "Oye hoye!",
  "Bhai full power!",
  "Kaafi sahi.",

  // ---------------- RANDOM FILLERS ----------------
  "Ok 👍",
  "Hmm",
  "K",
  "Accha",
  "Arey wah 👌",
  "Thik hai.",
  "Jaldi milte hain.",
  "Phir baat karte hain.",
  "Sorry, thoda busy tha.",
  "Kal baat karenge.",
  "Bahut mast!",
  "Sahi hai yaar.",
  "Arre sach me?",
  "Haha 😂",
  "Lol 🤣",
  "Seriously?",
  "Tu pagal hai kya 😅",
  "Mujhe bhi bata dena.",
  "Chal thik hai.",
  "Milte hain fir.",

  // ---------------- EMOJIS ONLY ----------------
  "😂😂😂",
  "🤔🤔",
  "😎🔥",
  "❤️❤️",
  "🙌🙌",
  "😅😅",
  "👌👌",
  "👍👍",
  "😭😭",
  "🤣🤣",
  "🙏🙏",
  "🔥🔥",
  "🥳🥳",
  "👀👀",
  "😴😴",
  "🤯🤯",
  "😢😢",
  "😆😆",
  "💯💯",
  "👊👊",
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
// ================== HELPERS ==================
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
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms))
}
function randomHumanDelay() {
  return randInt(10000, 60000) // 10–60s
}

async function simulateTyping(sock, jid, text, typingTime = 3000) {
  try {
    await sock.sendPresenceUpdate("composing", jid)
    console.log(`💬 Typing to ${jid} for ${typingTime / 1000}s...`)
    await delay(typingTime)

    await sock.sendPresenceUpdate("paused", jid)

    await sock.sendMessage(jid, { text })
    console.log(`✅ Sent to ${jid}: ${text}`)

    // after sending → pause randomly 10–60s
    const wait = randomHumanDelay()
    console.log(`⏳ Cooling down for ${wait / 1000}s`)
    await delay(wait)
  } catch (err) {
    console.error(`❌ Failed to send to ${jid}:`, err?.message || err)
  }
}

const messageQueue = []
let isSending = false

async function processQueue(sock) {
  if (isSending) return // already processing
  isSending = true

  while (messageQueue.length > 0) {
    const { jid, text } = messageQueue.shift()
    const typingTime = randInt(2000, 6000)

    try {
      await sock.sendPresenceUpdate("composing", jid)
      console.log(`💬 Simulating typing to ${jid} for ${typingTime / 1000}s`)
      await new Promise((resolve) => setTimeout(resolve, typingTime))
      await sock.sendPresenceUpdate("paused", jid)

      await sock.sendMessage(jid, { text })
      console.log(`✅ Sent to ${jid}: ${text}`)
    } catch (err) {
      console.error(`❌ Failed to send to ${jid}:`, err?.message || err)
    }

    // optional buffer between messages
    const buffer = randInt(2000, 5000)
    await new Promise((resolve) => setTimeout(resolve, buffer))
  }

  isSending = false
}

// ================== INIT BAILEYS ==================
async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")
  console.log("creating auth")
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    // browser: Browsers.macOS("Chrome"), // looks like real chrome
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

    const fromMe = msg.key.fromMe
    const from = msg.key.remoteJid
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""
    
    if (!body) return
    if (fromMe) {
  console.log(`📤 Outgoing to ${from}: ${body}`)
} else {
  console.log(`📩 Incoming from ${from}: ${body}`)
}
    
if (!fromMe){


    // reply after 2–7 minutes
    const replyDelay = randInt(120, 420)
    const replyText = pickRandom(MessagesPatterns)
    console.log(`⏲ Reply scheduled in ${replyDelay}s to ${from} -> "${replyText}"`)

    setTimeout(() => {
  messageQueue.push({ jid: from, text: replyText })
  processQueue(sock)
}, replyDelay * 1000)




    // random outgoing to other targets after 5–15 minutes
    if (targetNumbers.length > 0) {
      const targetRaw = pickRandom(targetNumbers)
      const targetJid = normalizeJid(targetRaw)
      const targetDelay = randInt(300, 900)
      const targetText = pickRandom(MessagesPatterns)
      console.log(`⏲ Outgoing scheduled in ${targetDelay}s to ${targetJid} -> "${targetText}"`)

      setTimeout(() => {
  messageQueue.push({ jid: from, text: replyText })
  processQueue(sock)
}, replyDelay * 1000)

    }}
  })


  return sock

}

// ================== START SERVER ==================
const PORT = 3000
server.listen(PORT, () =>
  console.log(`🚀 Dashboard running at http://localhost:${PORT}`)
)

startSock()
