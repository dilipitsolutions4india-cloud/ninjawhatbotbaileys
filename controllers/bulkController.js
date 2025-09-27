const fs = require("fs")
const csv = require("csv-parser")
const log = require("../utils/logger")

// OTP patterns (simplified for demo, you can paste your full list here)
const otpPatterns = [
  // ===== English OTPs =====
  "Your OTP is ${otp}. Please do not share it with anyone.",
  "Use ${otp} to verify your login.",
  "${otp} is your OTP, valid for 5 minutes.",
  "Please use this code ${otp} to confirm your action.",
  "Security alert! Your code is ${otp}.",
  "Transaction OTP: ${otp}.",
  "Login verification code: ${otp}.",
  "Temporary PIN is ${otp}.",
  "One time password is ${otp}.",
  "Your code for confirmation is ${otp}.",
  "Verification code: ${otp}.",
  "Your login OTP is ${otp}.",
  "Do not share OTP: ${otp}.",
  "Authentication PIN: ${otp}.",
  "Code ${otp} is required to proceed.",
  "Confirm using OTP: ${otp}.",
  "Your security code is ${otp}.",
  "Use ${otp} for account recovery.",
  "Password reset OTP is ${otp}.",
  "Code ${otp} will expire soon.",
  "OTP ${otp} is valid for 10 minutes.",
  "Temporary verification code: ${otp}.",
  "Your one-time PIN is ${otp}.",
  "Use ${otp} to authenticate your login.",
  "Login OTP ${otp} sent to your device.",
  "Enter OTP ${otp} to confirm transaction.",
  "Code ${otp} is generated for account verification.",
  "Verification PIN ${otp} is active now.",
  "Your code ${otp} is confidential.",
  "Temporary code ${otp} is valid for 5 minutes.",
  "Security OTP ${otp} has been sent to your number.",
  "Your authentication code is ${otp}.",
  "OTP ${otp} will expire in 5 minutes.",
  "Login PIN: ${otp}.",
  "Verification code: ${otp}.",
  "Security PIN: ${otp}.",
  "One time code ${otp} for verification.",
  "Your OTP ${otp} is active.",
  "Code ${otp} is required to login.",
  "OTP ${otp} for account access.",
  "Temporary PIN ${otp} is valid.",
  "Login OTP ${otp} has been generated.",
  "Your verification code is ${otp}.",
  "Code ${otp} is one-time use.",
  "Temporary OTP ${otp} sent.",
  "Verification PIN ${otp} active now.",
  "Enter code ${otp} to continue.",
  "Your OTP ${otp} is valid for 5 mins.",
  "Login code ${otp} sent to your mobile.",
  "OTP ${otp} required to proceed.",

  // ===== Hindi OTPs =====
  "आपका ओटीपी है ${otp}, कृपया किसी से साझा न करें।",
  "लॉगिन के लिए कोड इस्तेमाल करें: ${otp}.",
  "आपके ट्रांजैक्शन का पासकोड: ${otp}.",
  "यह कोड ${otp} केवल 5 मिनट तक मान्य है।",
  "सिक्योरिटी के लिए ओटीपी भेजा गया है: ${otp}.",
  "आपका पासकोड ${otp} है।",
  "कृपया इस नंबर ${otp} को एंटर करें।",
  "आपके अकाउंट के लिए कोड है ${otp}.",
  "आपका अस्थायी पासवर्ड है: ${otp}.",
  "कन्फर्मेशन के लिए कोड डालें: ${otp}.",
  "आपका लॉगिन ओटीपी है: ${otp}.",
  "पासवर्ड बदलने के लिए ओटीपी डालें: ${otp}.",
  "आपका ट्रांजैक्शन ओटीपी है ${otp}.",
  "अकाउंट वेरिफिकेशन कोड: ${otp}.",
  "सिर्फ 5 मिनट तक मान्य है यह ओटीपी: ${otp}.",
  "ओटीपी ${otp} का इस्तेमाल करें।",
  "आपका पासवर्ड रीसेट कोड है: ${otp}.",
  "इस ओटीपी को किसी के साथ साझा न करें: ${otp}.",
  "अकाउंट खोलने के लिए कोड डालें: ${otp}.",
  "आपका वन टाइम पासवर्ड है: ${otp}.",
  "OTP ${otp} अब इस्तेमाल करें।",
  "आपका सिक्योरिटी कोड ${otp} है।",
  "तुरंत अपने अकाउंट के लिए कोड ${otp} डालें।",
  "कोड ${otp} का इस्तेमाल केवल आपको करना है।",
  "आपका OTP ${otp} केवल 10 मिनट के लिए वैध है।",
  "नए लॉगिन के लिए कोड ${otp}।",
  "कृपया ${otp} डालकर अपनी पहचान सत्यापित करें।",
  "आपका अस्थायी पासकोड ${otp} सक्रिय है।",
  "कोड ${otp} के साथ लॉगिन करें।",
  "OTP ${otp} आपके अकाउंट के लिए भेजा गया।",

  // ===== Hinglish OTPs =====
  "Bhai OTP aaya kya? Mera phone dead hai, forward kar na ${otp}.",
  "Use kar le ${otp}, bas 2 min ke liye valid hai.",
  "Arre ${otp} likh aur login kar jaldi.",
  "Kya ${otp} tere paas aaya? Mujhe bhej de.",
  "Bank se msg aaya: code ${otp} use kar.",
  "Apun ko mila ${otp}, shayad tera hoga.",
  "Bhai jaldi dal OTP ${otp} warna expire ho jayega.",
  "Mera code ${otp} hai, check kar le.",
  "Tujhe mila kya msg ${otp} ka?",
  "Abhi ${otp} aaya mere number pe, use kar le.",
  "OTP ${otp} daal na jaldi.",
  "Tera login code ${otp} hai.",
  "Bhai temporary PIN ${otp} use kar.",
  "Forward kar OTP ${otp}, bas 5 min valid hai.",
  "Apun ke number pe code ${otp} aaya.",
  "Login ke liye OTP ${otp} use kar le.",
  "Security code ${otp} bhej diya hai.",
  "Bhai OTP ${otp} jaldi daal.",
  "Account verification ka code ${otp} hai.",
  "OTP ${otp} ko share mat karna.",
  "Temporary PIN ${otp} activate ho gaya.",
  "Use kar login OTP ${otp}.",
  "Verification code ${otp} bhej diya.",
  "Bhai code ${otp} check kar.",
  "OTP ${otp} sirf tere liye hai.",
  "Login ke liye code ${otp} valid hai.",
  "OTP ${otp} 5 min ke liye hai.",
  "Temporary code ${otp} dal.",
  "Forward kar OTP ${otp} abhi.",
  "Security OTP ${otp} active.",
  "Tera one-time PIN ${otp}.",
  "Code ${otp} use kar login.",
  "OTP ${otp} sirf ek baar use hoga.",
  "Verification code ${otp} enter kar.",
  "Temporary OTP ${otp} sent hai.",
  "Login OTP ${otp} verify kar.",
  "OTP ${otp} daal aur proceed kar.",
  "Security PIN ${otp} sirf valid hai 5 min.",
  "Login code ${otp} abhi enter kar.",
  "OTP ${otp} automatically generate hua.",
  "Temporary code ${otp} sirf ek baar use kare.",
  "Verification PIN ${otp} active now.",
  "OTP ${otp} send ho gaya.",
  "Login code ${otp} apke liye.",
  "OTP ${otp} sirf verify ke liye.",
  "Temporary PIN ${otp} use kar abhi.",
  "OTP ${otp} confirm kar transaction.",
  "Code ${otp} login ke liye required.",
  "OTP ${otp} confidential hai.",
  "Use ${otp} for account recovery now."
];


// Store sending state
const pendingBulkQueue = []

// Parse CSV file
function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        if (data.number) {
          results.push({ jid: data.number.trim() + "@s.whatsapp.net" })
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}

// Send bulk OTPs
async function sendBulkOtpMessages(sockMap, recipients, otpValue, sessionsCount = 1) {
  const activeSessions = Object.values(sockMap)
  if (!activeSessions.length) throw new Error("No active sessions available")

  if (sessionsCount > activeSessions.length) sessionsCount = activeSessions.length
  const sessionsToUse = activeSessions.slice(0, sessionsCount)

  log(`🚀 OTP Bulk send started | Sessions: ${sessionsToUse.length} | Recipients: ${recipients.length}`)

  // Divide recipients into chunks of 100
  const chunks = []
  for (let i = 0; i < recipients.length; i += 25) {
    chunks.push(recipients.slice(i, i + 25))
  }

  // Assign chunks to sessions (round-robin)
  chunks.forEach((chunk, i) => {
    const session = sessionsToUse[i % sessionsToUse.length]
    sendChunkWithSession(session, chunk, otpValue, i % sessionsToUse.length)
  })
}
async function sendChunkWithSession(sock, recipients, otpValue, sessionIndex) {
  let sentCount = 0

  for (const recipient of recipients) {
    const pattern = otpPatterns[Math.floor(Math.random() * otpPatterns.length)]
    const message = pattern.replace("${otp}", otpValue || "000000")

    try {
      await sock.sendMessage(recipient.jid, { text: message })
      sentCount++
      log(`✅ Session ${sessionIndex + 1} | Sent to ${recipient.jid} (${sentCount}/${recipients.length})`)

      // Random delay 10s–60s
      const delay = Math.floor(Math.random() * (60000 - 15000 + 1)) + 15000
      log(`⏳ Session ${sessionIndex + 1} | Waiting ${delay / 1000}s before next message`)
      await new Promise(r => setTimeout(r, delay))

    } catch (err) {
      log(`❌ Session ${sessionIndex + 1} | Failed to send to ${recipient.jid} | ${err.message}`)
    }
  }

  log(`🎯 Session ${sessionIndex + 1} finished sending ${sentCount} messages.`)
}
module.exports = { sendBulkOtpMessages, parseCsv, pendingBulkQueue }
