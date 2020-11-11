const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const ws = require("ws")
const _set = require("lodash.set")
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
  thing: "here is a thing",
  word: "starting word",
  bool: false,
  number: 4,
  data: {
    name: "John Doe",
    /*"qwe.zxc": "with dot",
    "abc[2]": "with brackets",
    address: "74 Henry Road",*/
  },
}

const sendAllScope = (socket) => {
  const iterate = (root, path = "") => {
    Object.entries(root).forEach((e) => {
      const p = `${path}>${e[0]}`

      if (Object.prototype.toString.call(e[1]) === "[object Object]") {
        iterate(e[1], p)
      } else if (Object.prototype.toString.call(e[1]) === "[object Array]") {
        iterate({ ...e[1] }, p)
      } else {
        socket.send(JSON.stringify({ p: p.substr(1), v: e[1] }))
      }
    })
  }
  iterate(scope)
}

// Set WS server
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("connection")

  sendAllScope(socket)

  socket.on("message", (msg) => {
    msg = JSON.parse(msg)

    wsServer.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) client.send(JSON.stringify(msg))
    })
    // ENH: A path cache can be implemented to avoid `split`'after each message
    _set(scope, msg.p.split(">"), msg.v)
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
