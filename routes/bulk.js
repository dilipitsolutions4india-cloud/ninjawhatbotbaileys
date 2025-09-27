const express = require("express")
const multer = require("multer")
const { sendBulkOtpMessages, parseCsv, pendingBulkQueue } = require("../controllers/bulkController")
const { sessions } = require("../controllers/sessionsController")

const router = express.Router()
const upload = multer({ dest: "uploads/" })

// Show OTP form
router.get("/", (req, res) => {
  const activeSessions = Object.keys(sessions).length
  res.send(`
    <h2>Bulk OTP Sender</h2>
    <p>Registered Sessions: ${Object.keys(sessions).length}</p>
    <p>Active Sessions: ${activeSessions}</p>
    <form action="/bulk/send" method="post" enctype="multipart/form-data">
      <label>Manual Numbers (comma separated):</label><br>
      <textarea name="numbers" rows="3" cols="50"></textarea><br><br>

      <label>Or Upload CSV:</label><br>
      <input type="file" name="csv"><br><br>

      <label>OTP Value:</label><br>
      <input type="text" name="otpValue" required><br><br>

      <label>Sessions to Use:</label><br>
      <input type="number" name="sessionsCount" value="${activeSessions}" min="1" max="${activeSessions}"><br><br>

      <button type="submit">Send OTP Messages</button>
    </form>

    <h3>Sending Progress</h3>
    <pre id="log">${pendingBulkQueue.length} messages queued...</pre>
  `)
})

// Handle sending
router.post("/send", upload.single("csv"), async (req, res) => {
  try {
    let recipients = []

    if (req.body.numbers) {
      recipients = req.body.numbers.split(",").map(n => ({ jid: n.trim() + "@s.whatsapp.net" }))
    } else if (req.file) {
      recipients = await parseCsv(req.file.path)
    }

    if (!recipients.length) return res.status(400).send("❌ No recipients provided")

    await sendBulkOtpMessages(
      sessions,
      recipients,
      req.body.otpValue,
      Number(req.body.sessionsCount)
    )

    res.send("✅ OTP bulk messages queued successfully")
  } catch (err) {
    console.error(err)
    res.status(500).send("❌ Failed to send OTP messages")
  }
})

module.exports = router
