// utils/logger.js
const fs = require("fs")
const path = require("path")

const logDir = path.join(__dirname, "../logs")
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const logFile = path.join(logDir, "bulk.log")

function log(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`
  fs.appendFileSync(logFile, logMessage, "utf8")
  console.log(logMessage.trim())
}

module.exports = log
