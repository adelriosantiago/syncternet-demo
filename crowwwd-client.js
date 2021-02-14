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
      party: {
        TESTUSER: {
          pic: "https://via.placeholder.com/150",
          status: CROWWWD.ONLINE,
          xpath: "",
          pos: { x: 10, y: 10 },
        },
        "user-qwe123": {
          pic: "https://via.placeholder.com/150",
          status: CROWWWD.AWAY,
          xpath: "",
          pos: { x: 50, y: 40 },
        },
      },
    }, // Realtime data, every user has a copy of this with the same contents
    private: {
      UUID: "SECRET_UUID",
      username: "TESTUSER",
    }, // Local data, every user has it own data
  },
  created() {},
  mounted() {
    this.startWSClient()

    // Party plugin (original code)
    document.onmouseover = (e) => {
      e = e || window.event
      const el = e.target || el.srcElement

      // TODO: Add pos to newData
      /*const targetUser = this.users.others[this.private.username]
      // Update and send xpath
      const path = xpath(el)
      targetUser.pos.path = path
      // Update self icon position
      const rect = el.getBoundingClientRect()
      const coords = {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      }
      targetUser.pos.x = coords.x
      targetUser.pos.y = coords.y*/

      const rect = el.getBoundingClientRect()
      const newData = {
        xpath: xpath(el),
        pos: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
        },
      }

      this.wsSend("party", this.private.UUID, newData)
    }
  },
  methods: {
    startWSClient() {
      // Check for previous auth data
      const crId = window.localStorage.getItem("crId") || ""

      // Init socket connection
      //window.CROWWWD.socket = new ReconnectingWebSocket(`ws://${window.location.host}/crId=${crId}`)
      window.CROWWWD.socket = new ReconnectingWebSocket(`ws://${window.location.host}`)
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
      const specialActions = ["_keys", "_plugins"]
      const execSpecialAction = {
        _keys: (username, data) => {
          console.log("+++++++++++++action: _keys", username, data)
          this.private.UUID = data.UUID
          this.private.username = data.username
        },
        _plugins: (username, data) => {
          console.log("action: _plugins DATA:::", data)

          //this.public.party = {}
          //this.public.emoticons = {}

          //$("body").append(data.party.html)
        },
      }

      try {
        const [, plugin, username, data] = msg.match(/^(\w+)\|([\w-]+)\|(.*$)/) // Spec: https://regex101.com/r/YLyEmo/1

        console.log(">>>", plugin, username, data)

        if (specialActions.includes(plugin)) return execSpecialAction[plugin](username, JSON.parse(data))

        //this.public[plugin][username] = JSON.parse(data) // TODO: Use merge/assign

        this.$set(this.public[plugin], username, JSON.parse(data))
        //_set(this.public[plugin], username, JSON.parse(data))

        console.log("+++++++++++", this.public)
      } catch (e) {
        console.log(`Message or action '${msg}' throws ${e}.`)
      }
    },
    wsSend(plugin, UUID, data) {
      console.log("sending", plugin, UUID, data, window.CROWWWD.socket)
      window.CROWWWD.socket.send(plugin + "|" + UUID + "|" + JSON.stringify(data))
    },
  },
})
