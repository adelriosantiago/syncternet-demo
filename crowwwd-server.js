// - Rock
// -> Plastic
// - Paper

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

const specialActions = ["@specialActionA"]
const execSpecialAction = {
  "@specialAction": (socket, data) => {
    console.log("@specialAction")
  },
}

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
  wsServer.on(WS_CONNECTION, async (socket) => {
    console.log("New client connected")

    // Create new session or continue an old one
    const crId = "" // TODO: Obtain from URL
    if (crId === "") {
      // TODO: Address the issue when there is crId but id doesn't match
      const newUUID = uuid.v4()
      const newUsername = haikunator.haikunate()

      users[newUUID] = newUsername

      send(socket, "@keys", "", JSON.stringify({ UUID: newUUID, username: newUsername }))

      // Send existing public data
      sendAllToClient(socket)
    }

    socket.on(WS_MESSAGE, (msg) => {
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
    })
  })
}

const store = () => {
  public, private, users
}

module.exports = { init, store }
