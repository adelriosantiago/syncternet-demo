const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const ws = require("ws")
const _get = require("lodash.get")
const _set = require("lodash.set")
const utils = require("./utils.js")
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

const iterateAllScope = (onLeaf) => {
  utils.iterate(scope, "", onLeaf)
}

let scope = {
  thing: "here is a thing",
  word: "starting word",
  bool: false,
  number: "0",
  data: {
    name: "John Doe",
    address: "Main St. 2240",
  },
}

let _scope = {} // Flat scope which holds scope's real values

iterateAllScope((p, v) => {
  const prePath = p.split(">")
  const leaf = prePath.pop()

  _scope[p] = v // Set initial value in flat scope

  const obj = prePath.length ? _get(scope, prePath) : scope
  Object.defineProperty(obj, leaf, {
    set: (v) => {
      _scope[p] = v
      setTimeout(() => {
        wsServer.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) client.send(JSON.stringify({ p, v })) // ENH: A path cache can be implemented to avoid `split`'after each message
        })
      }, 0)
    },
    get: () => {
      return _scope[p]
    },
  })
})

setInterval(() => {
  scope.number = String(Math.round(Math.random() * 999))
}, 1000)

// Set WS server
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("connection")

  // Send the client all values from scope
  iterateAllScope((p, v) => {
    socket.send(JSON.stringify({ p, v }))
  })

  socket.on("message", (msg) => {
    msg = JSON.parse(msg)

    //msg.v = msg.v.toUpperCase() // ENH: Implement middleware

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
