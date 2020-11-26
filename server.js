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

// Set WS server
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("New client")

  bdProcess.action["@sendAll"](socket)
  socket.send("@connection")

  socket.on("message", (msg) => {
    // For special actions
    if (msg[0] === "@") {
      try {
        bdProcess.action[msg](socket)
      } catch (e) {
        // Action not found
      }
      return
    }

    try {
      msg = JSON.parse(msg)
    } catch (e) {
      // Invalid message
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
