// - Rock
// -> Plastic
// - Paper

const ws = require("ws")
const _pick = require("lodash.pick")
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

const specialActions = ["@specialActionA"]
const execSpecialAction = {
  "@specialAction": (socket, data) => {
    console.log("@specialAction")
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

    socket.send(`@plugins|${JSON.stringify(pluginInject())}`) // Send plugins to inject

    // Create new session or continue an old one
    const crId = "" // TODO: Get from url, a, b, c
    if (crId === "") {
      // TODO: Address the issue when there is crId but id doesn't match
      const newUUID = uuid.v4()
      const newUsername = haikunator.haikunate()

      users[newUUID] = newUsername
      socket.send(`@keys|${JSON.stringify({ UUID: newUUID, username: newUsername })}`)
    }

    socket.on("message", (msg) => {
      try {
        const [, UUID, data] = msg.match(/^([@\w-]+)\|(.*$)/) // Spec: https://regex101.com/r/dqa4nI/3
        if (specialActions.includes(UUID)) return execSpecialAction[UUID](socket, JSON.parse(data))

        if (public[UUID] === undefined) public[UUID] = {}
        Object.assign(public[UUID], JSON.parse(data))

        // Broadcast new information
        wsServer.clients.forEach((client) => {
          //if (client === socket) return // To skip sender (currently we broadcast to everyone)
          if (client.readyState === WS_OPEN) client.send(users[UUID] + "|" + data) // TODO: If a middleware is ever implemented this needs to come from public, not from the same data that arrived
        })
      } catch (e) {
        console.log(`Message or action '${msg}' throws ${e}.`)
      }
    })
  })
}

module.exports = { init }
