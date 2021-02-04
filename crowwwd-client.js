// - Rock
// - Plastic
// -> Paper

const Vue = require("./vendor/vue.min.js")
const ReconnectingWebSocket = require("reconnecting-websocket")

window.CROWWWD = {
  ONLINE: 1,
  AWAY: 1,
  X_OFFSET: 15,
  Y_OFFSET: 15,
}

new Vue({
  el: "#crowwwd-partyon",
  data: {
    users: {
      self: {
        pic: "https://via.placeholder.com/150",
        name: "user-abc",
        status: CROWWWD.ONLINE,
        pos: { path: "", x: 10, y: 10 },
      },
      others: [
        {
          pic: "https://via.placeholder.com/150",
          name: "user-qwe123",
          status: CROWWWD.AWAY,
          pos: { path: "", x: 50, y: 40 },
        },
      ],
    },
  },
  created() {},
  mounted() {
    socket = new ReconnectingWebSocket(`ws://${window.location.host}`)

    let scope = {}

    const specialActions = {
      "@init": (data) => {
        console.log("init with data:", data)
      },
      "@refresh": () => {
        //
      },
    }

    // Socket events
    socket.onopen = () => {
      console.log("WebSocket open")
    }
    socket.onerror = (error) => {
      console.log(`WebSocket error: ${error}`)
    }
    socket.onmessage = (msg) => {
      msg = msg.data

      console.log(">>>>", msg)
      // For special actions
      if (msg[0] === "@") {
        const match = (msg.match(/@\w+\|/) || [])[0]
        try {
          specialActions[match.slice(0, -1)](msg.substr(match.length))
        } catch (e) {
          console.log("Action received but handler not found or throws error", e)
        }
        return
      }

      // For normal commands
      try {
        msg = JSON.parse(msg)
      } catch (e) {
        console.log("Invalid message", e)
      }
    }

    // Old mounted

    $("body *").mouseenter((ev) => {
      // Update and send xpath
      const path = xpath(ev.target)
      this.users.self.pos.path = path

      // Update self icon position
      const rect = ev.target.getBoundingClientRect()
      const coords = {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      }

      this.users.self.pos.x = coords.x
      this.users.self.pos.y = coords.y
    })

    /*// Debug user movement
    setTimeout(() => {
      this.users.others[789].pos.x += 100
      this.users.others[789].status = ONLINE
    }, 2000)*/
  },
  methods: {},
})
