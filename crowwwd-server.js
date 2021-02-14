// - Rock
// -> Plastic
// - Paper

const ws = require("ws")
//const boydogEngine = require("./boydogEngine.js")
//const url = require("url")
//const _pick = require("lodash.pick")
const _get = require("lodash.get")
const _set = require("lodash.set")
const uuid = require("uuid")
const haikunator = new (require("haikunator"))({
  defaults: {
    tokenLength: 6,
  },
})

const WS_CONNECTING = 0
const WS_OPEN = 1
const WS_CLOSING = 2
const WS_CLOSED = 3

let public = {}
let users = {}
let plugins = {
  party: {
    html: "<div>party plugin</div>",
  },
  emoticons: {
    html: "<div>emoticons plugin</div>",
  },
}

const specialActions = ["_new", "_connection"]
const execSpecialAction = {
  _new: (socket, UUID, data) => {
    console.log("action: _new")
  },
  _connection: (socket, UUID, data) => {
    console.log("action: _connection")
  },
}

const pluginInject = () => {
  return `<div id="crowwwd">${Object.values(plugins)
    .map((p) => p.html)
    .join("")}</div>`
}

const init = (pluginsToLoad, server) => {
  const wsServer = new ws.Server({ server })
  wsServer.on("connection", (socket) => {
    console.log("New client connected")

    socket.send(`_plugins|undefined|${JSON.stringify(pluginInject())}`) // Send plugins to inject

    // Create new session or continue an old one
    const crId = "" // TODO: Get from url, a, b, c
    if (crId === "") {
      // TODO: Address the issue when there is crId but id doesn't match
      const newUUID = uuid.v4()
      const newUsername = haikunator.haikunate()

      users[newUUID] = newUsername
      socket.send(`_keys|undefined|${JSON.stringify({ UUID: newUUID, username: newUsername })}`)
    }

    socket.on("message", (msg) => {
      console.log("msg rx", msg)

      try {
        const [, plugin, UUID, data] = msg.match(/^(\w+)\|([\w-]+)\|(.*$)/) // Spec: https://regex101.com/r/YLyEmo/1
        if (specialActions.includes(plugin)) return execSpecialAction[plugin](socket, UUID, JSON.parse(data))

        //public[plugin][UUID] = JSON.parse(data) // TODO: Use _.set so that the settings is created if it doesn't exists
        _set(public, UUID, JSON.parse(data))

        // Broadcast new information
        wsServer.clients.forEach((client) => {
          //if (client === socket) return
          if (client.readyState === WS_OPEN) client.send(`${plugin}|${users[UUID]}|${data}`)
        })
      } catch (e) {
        console.log(`Message or action '${msg}' throws ${e}.`)
      }
    })
  })

  //boydogEngine.init(wsServer) // Action and message engine
}

module.exports = { init }
