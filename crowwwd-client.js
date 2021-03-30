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
}

const initVue = () => {
  return new Vue({
    el: "div#crowwwd",
    data: {
      public: {
        // Realtime data, every user has a copy of this with the same contents
      },
      private: {
        UUID: "",
        username: "",
      }, // Local data, every user has it own data
    },
    created() {},
    mounted() {
      this.startWSClient()
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
        const specialActions = ["@keys", "@style", "@plugins"]
        const execSpecialAction = {
          "@keys": (data) => {
            this.private.UUID = data.UUID
            this.private.username = data.username
          },
          "@style": (data) => {
            if ($("style.crowwwd").length) return // Bailout when style is already there
            $("body").append(`<style class="crowwwd">${data}</style>`) // Append tailwind
          },
          "@plugins": (data) => {
            if ($("div#crowwwd").length) return // Bailout when #crowwwd is already there

            $("body").append("<div id='crowwwd'></div>")
            Object.entries(JSON.parse(data)).forEach((e) => {
              const ob = $(e[1]).filter((i, el) => el.nodeName != "#text") // Will result in HTML in ob[0] and JS in ob[1]
              const html = `<div v-for="(C, username) in public" :key="username">${ob[0].outerHTML}</div>`
              const js = ob[1].innerHTML
              $("div#crowwwd").append(html)
              eval(js)
            })
            initVue() // Restart now that #crowwwd exists
          },
        }

        try {
          const [, username, plugin, data] = msg.match(/^([@\w-]+)\|(\w+|)\|(.*)$/) // Spec: https://regex101.com/r/QMH6lD/1

          if (specialActions.includes(username)) return execSpecialAction[username](data)

          if (this.public[username] === undefined)
            return this.$set(this.public, username, { [plugin]: JSON.parse(data) })
          Object.assign(this.public[username][plugin], JSON.parse(data))
        } catch (e) {
          console.log(`Message or action '${msg}' throws ${e}.`)
        }
      },
      wsSend(plugin, data) {
        window.CROWWWD.socket.send(this.private.UUID + "|" + plugin + "|" + JSON.stringify(data))
      },
    },
  })
}

initVue() // Start fake init
