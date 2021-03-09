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
const haikunator = new (require("haikunator"))({
  defaults: {
    tokenLength: 6,
  },
})

const tailwindScoped = fs.readFileSync("./vendor/tailwind.min.css", { encoding: "utf8", flag: "r" })

const WS_CONNECTING = 0
const WS_OPEN = 1
const WS_CLOSING = 2
const WS_CLOSED = 3

let wsServer = undefined
let users = {}
let public = {}
let private = {}

let plugins = {
  party: {
    frontend: {
      html: `
      <div
        class="absolute z-50"
        style="pointer-events: none"
        :style="{'left': C.party.pos.x + 'px', 'top': C.party.pos.y + 'px' }"
      >
        <img class="inline-block object-cover w-12 h-12 rounded-full" :src="C.party.pic" :alt="username" />
        <span
          class="absolute bottom-0 left-0 inline-block w-3 h-3 border border-white rounded-full"
          :class="{'bg-green-600': C.party.status === CROWWWD.ONLINE, 'bg-yellow-600': C.party.status === CROWWWD.AWAY, 'bg-gray-600': C.party.status === undefined}"
        ></span>
        <span class="text-sm text-white" style="background-color: rgba(0, 0, 0, 0.5)">{{username}}</span>
      </div>`,
      middleware: {},
    },
    backend: {
      middleware: {
        $: (data, sync, UUID, userPrivate) => {
          // TODO: Make the middleware smart enough to know if changing $ (or root), party.pos or party.pos.x, or even otherPlugin.a.b.c.d, etc
          data.status = 1

          clearTimeout(userPrivate.timer)
          userPrivate.timer = setTimeout(() => {
            data.status = 0
            sync(data)
          }, 3000)

          return data
        },
      },
    },
  },
  emoticons: {
    frontend: {
      html: "<div>emoticons plugin</div>",
      middleware: {}, // TODO
    },
    backend: {
      middleware: {},
    },
  },
}

const specialActions = ["@specialActionA"]
const execSpecialAction = {
  "@specialAction": (socket, data) => {
    console.log("@specialAction")
  },
}

const pluginInject = () => {
  return `
  <style>
    ${tailwindScoped}
  </style>
  <div id="crowwwd">
    <div v-for="(C, username) in public" :key="username">
      ${Object.values(plugins)
        .map((p) => p.frontend.html)
        .join("")}
    </div>
  </div>`
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
  wsServer.on("connection", (socket) => {
    console.log("New client connected")

    send(socket, "@plugins", "", JSON.stringify(pluginInject()))

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
