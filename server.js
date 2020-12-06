const port = 3091
const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const ws = require("ws")
const bdProcess = require("./bdProcess.js")

const app = express()
app.use(express.static("static"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/exampleGetScope", (req, res) => {
  return res.json(scope)
})

// Init server
const server = http.createServer(app)

// wsEngine
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("New client")

  bdProcess.action["@init"](socket)

  socket.on("message", (msg) => {
    // For special actions
    const match = msg.match(/@\w+\|/)[0]
    if (msg[0] === "@") {
      try {
        bdProcess.action[match.slice(0, -1)](socket, msg.substr(match.length))
      } catch (e) {
        console.log("Action received but handler not found", e)
      }
      return
    }

    try {
      msg = JSON.parse(msg)
    } catch (e) {
      console.log("Invalid message", e)
    }
    bdProcess.message(socket, msg)
  })
})

server
  .listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
  })
  .on("upgrade", (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket) => {
      wsServer.emit("connection", socket, request)
    })
  })
