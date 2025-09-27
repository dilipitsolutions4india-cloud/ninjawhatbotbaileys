const { rules, defaultReplies } = require("../models/automationRules")

// Store messages per session
const messagesLog = {} // { sessionId: [{ from, text, type, timestamp }] }

async function handleMessage(sessionId, { messages }, sock, io) {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || ""
    const type = msg.key.fromMe ? "sent" : "received"
    const timestamp = Date.now()

    if (!messagesLog[sessionId]) messagesLog[sessionId] = []
    messagesLog[sessionId].push({ from, text, type, timestamp })

    // Emit real-time update
    io.emit("newMessage", { sessionId, from, text, type, timestamp })

    // Handle bot automation
    if (!msg.key.fromMe) {
        const sessionRules = rules[sessionId] || []
        const matchedRule = sessionRules.find(r => text.toLowerCase().includes(r.keyword.toLowerCase()))
        if (matchedRule) {
            await sock.sendMessage(from, { text: matchedRule.reply })
            messagesLog[sessionId].push({ from, text: matchedRule.reply, type: "sent", timestamp: Date.now() })
        } else if (defaultReplies[sessionId]) {
            await sock.sendMessage(from, { text: defaultReplies[sessionId] })
            messagesLog[sessionId].push({ from, text: defaultReplies[sessionId], type: "sent", timestamp: Date.now() })
        }
    }
}

function getMessages(sessionId) {
    return messagesLog[sessionId] || []
}

module.exports = { handleMessage, getMessages }
