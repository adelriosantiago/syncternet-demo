// - Rock
// -> Plastic
// - Paper

const ReconnectingWebSocket = require("reconnecting-websocket")
const frontendExport = require("./exports/frontendExport.js")

const run = () => {
  CROWWWD = {
    socket: undefined,
    ONLINE: 1,
    AWAY: 0,
    X_OFFSET: 15,
    Y_OFFSET: 15,
    specialActions: ["@keys", "@style", "@plugins"],
  }

  // Append style and plugin templates
  if (!$("style.crowwwd").length) $("body").append(`<style class="crowwwd">${frontendExport.style}</style>`) // Append crowwwd style
  if (!$("div#crowwwd").length) {
    $("body").append("<div id='crowwwd'></div>")

    // Append name change menu
    $("div#crowwwd").append(`
      <div class="fixed bottom-20 left-0">
        <span><input placeholder="Set new username" v-model="settings.menu.newUsername" /></span>
        <i class="fas fa-save" style="position: relative; color: black; left: -25px; top: 1px;" @click="setUsername()"></i>
      </div>
    `)

    // Append plugins
    $("div#crowwwd").append(`
      <div v-for="(P, username) in public">
        ${Object.values(frontendExport.plugins)
          .map((p) => p.html)
          .join("")}
      </div>
    `)
  }
  return Object.entries(frontendExport.plugins).reduce((a, c) => {
    a[c[0]] = c[1].script
    return a
  }, {})
}

const wsFunctions = {
  startWSClient() {
    // Check for previous auth data
    const UUID = window.localStorage.getItem("crowwwd:UUID") || ""
    const username = window.localStorage.getItem("crowwwd:username") || ""

    // Init socket connection
    window.CROWWWD.socket = new ReconnectingWebSocket(`ws://3.213.61.7:7777/?UUID=${UUID}&username=${username}`)
    window.CROWWWD.socket.onopen = () => this.onWSOpen
    window.CROWWWD.socket.onerror = (err) => this.onWSError(err)
    window.CROWWWD.socket.onmessage = (msg) => this.onWSMessage(msg.data)
  },
  onWSOpen() {
    console.log("WebSocket open")
  },
  onWSError(err) {
    console.log("WebSocket error", err)
  },
}

module.exports = { run, wsFunctions }
