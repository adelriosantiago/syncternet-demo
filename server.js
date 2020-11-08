const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const ws = require("ws")
const port = 3080

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
  thing: "red bold",
  word: "starting word",
  bool: false,
  number: 4,
  data: {
    name: "John Doe",
    "qwe.zxc": "with dot",
    "abc[2]": "with brackets",
    address: "74 Henry Road",
  },
}

const sendAllScope = (socket) => {
  let e = Object.entries(scope)
  e.forEach((f) => {
    socket.send(JSON.stringify({ p: f[0], v: f[1] }))
  })
}

// Set WS server
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("connection")

  sendAllScope(socket)

  socket.on("message", (msg) => {
    msg = JSON.parse(msg)

    scope[msg.p] = msg.v // Update scope

    wsServer.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) client.send(JSON.stringify(msg))
    })
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
