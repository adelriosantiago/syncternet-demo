const fs = require("fs")
const ws = require("ws")
const _pick = require("lodash.pick")
const _get = require("lodash.get")
const _set = require("lodash.set")
const _toPath = require("lodash.topath")
const uuid = require("uuid")
const uptill = require("uptill")
const haikunator = new (require("haikunator"))({
  defaults: {
    tokenLength: 6,
  },
})

const backendExport = require("./exports/backendExport.js")

const WS_MESSAGE = "message"
const WS_CONNECTION = "connection"
const WS_CONNECTING = 0
const WS_OPEN = 1
const WS_CLOSING = 2
const WS_CLOSED = 3

let wsServer = undefined
let users = {}
let public = {}
let private = {}

const execSpecialAction = {
  "@changeUsername": (socket, data) => {
    data = JSON.parse(data)
    users[data.UUID] = data.newUsername // TODO: Check that it doesn't exists
    send(socket, "@keys", "", JSON.stringify({ UUID: data.UUID, username: data.newUsername }))
  },
}
const specialActions = Object.keys(execSpecialAction)

const send = (socket, username, plugin, data) => {
  if (socket.readyState === WS_OPEN) socket.send(username + "|" + plugin + "|" + data)
}

const broadcastData = (username, plugin, data) => {
  wsServer.clients.forEach((socket) => send(socket, username, plugin, data))
}

const sendAllToClient = (socket) => {
  Object.keys(public).forEach((UUID) => {
    Object.keys(public[UUID]).forEach((plugin) => {
      send(socket, users[UUID], plugin, JSON.stringify(public[UUID][plugin]))
    })
  })
}

const buildSync = (username, plugin) => {
  return (data) => {
    broadcastData(username, plugin, JSON.stringify(data))
  }
}

const init = (server) => {
  wsServer = new ws.Server({ server })
  wsServer.on(WS_CONNECTION, async (socket, req) => {
    let [, UUID, username] = req.url.match(/^\/\?UUID=(.*)&username=(.*)$/) // Spec: https://regex101.com/r/yZO0av/1

    // Create new session or continue an old one

    if (!UUID || !username || !(users[UUID] === username)) {
      // Non authenticated user, generate keys
      UUID = uuid.v4()
      username = haikunator.haikunate()
      users[UUID] = username
    }

    send(socket, "@keys", "", JSON.stringify({ UUID, username }))
    sendAllToClient(socket) // Send all existing public data at the beginning

    socket.on(WS_MESSAGE, (msg) => {
      try {
        msg = msg.toString()

        let [, UUID, plugin, data] = msg.match(/^([@\w-]+)\|(\w+|)\|(.*)$/) // Spec: https://regex101.com/r/QMH6lD/1
        if (!UUID) return
        if (specialActions.includes(UUID)) return execSpecialAction[UUID](socket, data) // Special functions
        data = JSON.parse(data)

        // For plugin data
        if (public[UUID] === undefined) public[UUID] = {}
        if (private[UUID] === undefined) private[UUID] = {}
        data = backendExport.plugins[plugin].middleware["$"](
          data,
          buildSync(users[UUID], plugin),
          UUID,
          private[UUID],
          public[UUID]
        )
        Object.assign(public[UUID], { [plugin]: data })

        broadcastData(users[UUID], plugin, JSON.stringify(data))
      } catch (e) {
        console.log("Invalid message", e) // Ignore faulty messages
      }
    })
  })
}

const store = () => {
  public, private, users
}

module.exports = { init, store }
