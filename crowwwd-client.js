// - Rock
// -> Plastic
// - Paper

const Vue = require("./vendor/vue.min.js")
const ReconnectingWebSocket = require("reconnecting-websocket")
const xpath = require("./vendor/xpath-micro.js")
const _get = require("lodash.get")
const _set = require("lodash.set")
const $ = require("./vendor/cash.min.js")

window.CROWWWD = {
  socket: undefined,
  ONLINE: 1,
  AWAY: 0,
  X_OFFSET: 15,
  Y_OFFSET: 15,
  specialActions: ["@keys", "@style", "@plugins"],
}

// Append style and plugin templates

const frontendExport = require("./plugins/frontendExport.js")
const plugins = Object.keys(frontendExport.plugins)

if (!$("style.crowwwd").length) $("body").append(`<style class="crowwwd">${frontendExport.style}</style>`) // Append crowwwd style
if (!$("div#crowwwd").length) {
  $("body").append("<div id='crowwwd'></div>")

  for (const p of plugins) {
    $("div#crowwwd").append(
      `<div v-for="(C, username) in public" :key="username">${frontendExport.plugins[p].html}</div>`
    )
  }
}

// Initialize crowwwd engine
new Vue({
  el: "div#crowwwd",
  data: {
    // Realtime data, every user has a copy of this with the same contents
    public: {},
    // Local data, every user has it own data
    private: {
      UUID: "",
      username: "",
    },
  },
  created() {},
  mounted() {
    this.startWSClient()
    for (s of plugins.map((p) => frontendExport.plugins[p].script)) eval(s) // Run all plugins scripts
  },
  computed: {
    execSpecialAction() {
      return {
        "@keys": (data) => {
          data = JSON.parse(data)
          this.private.UUID = data.UUID
          this.private.username = data.username
          window.localStorage.setItem("crId", data.UUID)
        },
      }
    },
  },
  methods: {
    startWSClient() {
      // Check for previous auth data
      const crId = window.localStorage.getItem("crId") || ""

      // Init socket connection
      window.CROWWWD.socket = new ReconnectingWebSocket(`ws://${window.location.host}/crId=${crId}`)
      window.CROWWWD.socket.onopen = () => this.onWSOpen
      window.CROWWWD.socket.onerror = (err) => this.onWSError(err)
      window.CROWWWD.socket.onmessage = (msg) => this.onWSMessage(msg.data)
    },
    onWSOpen() {
      console.log("WebSocket open")
    },
    onWSError() {
      console.log(`WebSocket error: ${err}`)
    },
    onWSMessage(msg) {
      // TODO: Move this middleware POC into frontendExports
      const mid = {
        $: (data, username, myself) => {
          return data // TODO: Move to right place
        },
      }

      let [, username, plugin, data] = msg.match(/^([@\w-]+)\|(\w+|)\|(.*)$/) // Spec: https://regex101.com/r/QMH6lD/1
      if (!username) return
      if (window.CROWWWD.specialActions.includes(username)) return this.execSpecialAction[username](data)
      data = JSON.parse(data)

      // For plugin data
      data = mid["$"](data, username, username === this.private.username)
      if (this.public[username] === undefined) return this.$set(this.public, username, { [plugin]: data })
      Object.assign(this.public[username][plugin], data)
    },
    wsSend(plugin, data) {
      if (!this.private.UUID) return
      window.CROWWWD.socket.send(this.private.UUID + "|" + plugin + "|" + JSON.stringify(data))
    },
  },
})
