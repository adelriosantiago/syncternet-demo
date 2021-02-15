// - Rock
// - Plastic
// -> Paper

const Vue = require("./vendor/vue.min.js")
const ReconnectingWebSocket = require("reconnecting-websocket")
const xpath = require("./vendor/xpath-micro.js")
const _get = require("lodash.get")
const _set = require("lodash.set")
const $ = require("./vendor/cash.min.js")

window.CROWWWD = {
  socket: undefined,
  ONLINE: 1,
  AWAY: 1,
  X_OFFSET: 15,
  Y_OFFSET: 15,
}

new Vue({
  el: "#crowwwd",
  data: {
    public: {
      // Realtime data, every user has a copy of this with the same contents
    },
    private: {
      UUID: "SECRET_UUID",
      username: "TESTUSER",
    }, // Local data, every user has it own data
  },
  created() {},
  mounted() {
    this.startWSClient()

    // Party plugin starts here (original code)
    document.onmouseover = (e) => {
      e = e || window.event
      const el = e.target || el.srcElement

      const rect = el.getBoundingClientRect()
      const party = {
        xpath: xpath(el),
        pos: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
        },
      }

      this.wsSend({ party })
    }
    // Party plugin ends here
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
      const specialActions = ["@keys", "@plugins"]
      const execSpecialAction = {
        "@keys": (data) => {
          this.private.UUID = data.UUID
          this.private.username = data.username
        },
        "@plugins": (data) => {
          console.log("action: _plugins DATA:::", data)

          // TODO: Inject html (and create user?)

          //this.public.party = {}
          //this.public.emoticons = {}

          //$("body").append(data.party.html)
        },
      }

      try {
        const [, username, data] = msg.match(/^([@\w-]+)\|(.*$)/) // Spec: https://regex101.com/r/dqa4nI/3

        if (specialActions.includes(username)) return execSpecialAction[username](JSON.parse(data))

        if (this.public[username] === undefined) return this.$set(this.public, username, JSON.parse(data))
        Object.assign(this.public[username], JSON.parse(data))
      } catch (e) {
        console.log(`Message or action '${msg}' throws ${e}.`)
      }
    },
    wsSend(data) {
      window.CROWWWD.socket.send(this.private.UUID + "|" + JSON.stringify(data))
    },
  },
})
