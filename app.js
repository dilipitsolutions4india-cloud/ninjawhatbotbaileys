const express = require("express")
const http = require("http")
const path = require("path")
const bodyParser = require("body-parser")
const socketio = require("socket.io")

// Routes
const sessionRoutes = require("./routes/sessions")
const messageRoutes = require("./routes/messages")
const automationRoutes = require("./routes/automation")
const bulkRoutes = require("./routes/bulk")

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

// Socket.IO middleware to share io globally
app.use((req, res, next) => {
  req.io = io
  next()
})

// Mount routes
app.use("/sessions", sessionRoutes)
app.use("/messages", messageRoutes)
app.use("/automation", automationRoutes)

app.use("/bulk", bulkRoutes)
// Home redirect to sessions page
app.get("/", (req, res) => {
  res.redirect("/sessions")
})

const PORT = 3000
server.listen(PORT, () => console.log(`🚀 Dashboard running at http://localhost:${PORT}`))
