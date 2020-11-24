const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const ws = require("ws")
const _get = require("lodash.get")
const _set = require("lodash.set")
const iterate = require("./iterate.js")
const onObjectLeafGetSet = require("./onObjectLeafGetSet.js")
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
  number: "0",
  list: ["q", "P", "3"],
  items: [
    { todo: "get milk", amt: 5 },
    { todo: "buy meat", amt: 3 },
    { todo: "exercise", amt: 1 },
  ],
  data: {
    name: "John Doe",
    address: "Main St. 2240",
  },
}

let _scope = onObjectLeafGetSet(scope, {
  beforeSet: (p, v) => {
    setTimeout(() => {
      wsServer.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) client.send(JSON.stringify({ p, v })) // ENH: A path cache can be implemented to avoid `split`'after each message
      })
    }, 0)
    return v
  },
  afterSet: (p, v) => {
    console.log("afterSet", p, v)
  },
})

/*setInterval(() => {
  scope.number = String(Math.round(Math.random() * 999))
}, 1000)*/

// Set WS server
const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket) => {
  console.log("connection")

  // Send the client all values from scope
  iterate.onLeaf((p, v) => socket.send(JSON.stringify({ p, v })))
  iterate.onParent((p, v) => socket.send(JSON.stringify({ p, v, t: "p" })))
  iterate.run(scope)
  socket.send("@refresh")

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
