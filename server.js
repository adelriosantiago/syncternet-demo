const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const ws = require("ws")
const port = 3091

const app = express()
app.use(express.static("static"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/exampleGetScope", (req, res) => {
  return res.json(scope)
})

// Init server
const server = http.createServer(app)

let scope = {
  word: "sample word",
}

const specialActions = {
  "@example": () => {
    console.log("specialActions: @example")
  },
}

// Set WS server
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("New client")
  socket.send("@connection")

  socket.on("message", (msg) => {
    // For special actions
    if (msg[0] === "@") {
      try {
        specialActions[msg]()
      } catch (e) {
        // Action not found
      }
      return
    }

    msg = JSON.parse(msg)
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
