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

const tailwindScoped = fs.readFileSync("./vendor/tailwind.min.css", { encoding: "utf8", flag: "r" })
let plugins = require("./plugins/plugins.js") // Plugin definitions are added to this let variable

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

const pluginInjectString = async () => {
  let definitions = {}
  for (const p of Object.keys(plugins))
    definitions[p] = await fs.promises.readFile(`${__dirname}/plugins/${p}.html`, "utf8")

  return JSON.stringify(definitions)
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

const init = (pluginsToLoad, server) => {
  wsServer = new ws.Server({ server })
  wsServer.on("connection", async (socket) => {
    console.log("New client connected")

    send(socket, "@style", "", tailwindScoped)
    send(socket, "@plugins", "", await pluginInjectString())

    // Create new session or continue an old one
    const crId = ""
    if (crId === "") {
      // TODO: Address the issue when there is crId but id doesn't match
      const newUUID = uuid.v4()
      const newUsername = haikunator.haikunate()

      users[newUUID] = newUsername

      send(socket, "@keys", "", JSON.stringify({ UUID: newUUID, username: newUsername }))

      // Send existing public data
      sendAllToClient(socket)
    }

    socket.on("message", (msg) => {
      try {
        let [, UUID, plugin, data] = msg.match(/^([@\w-]+)\|(.*)\|(.*)$/) // Spec: https://regex101.com/r/dqa4nI/4

        // For functions
        if (specialActions.includes(UUID)) return execSpecialAction[UUID](socket, JSON.parse(data))

        // For plugin data
        if (public[UUID] === undefined) public[UUID] = {}
        if (private[UUID] === undefined) private[UUID] = {}

        data = JSON.parse(data)
        data = plugins[plugin].backend.middleware["$"](
          data,
          buildSync(users[UUID], plugin),
          UUID,
          private[UUID],
          public[UUID]
        )
        Object.assign(public[UUID], { [plugin]: data })

        broadcastData(users[UUID], plugin, JSON.stringify(data))
      } catch (e) {
        console.log(`Message or action '${msg}' throws ${e}.`)
      }
    })
  })
}

const store = () => {
  public, private, users
}

module.exports = { init, store }
