// - Rock
// -> Plastic
// - Paper

const ReconnectingWebSocket = require("reconnecting-websocket")
const frontendExport = require("./exports/frontendExport.js")

const run = () => {
  let scripts = {}

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

    for (const p of Object.entries(frontendExport.plugins)) {
      // TODO: Move to a variable the next part
      $("div#crowwwd").append(`
        <div style="position: fixed; bottom: 10px; left: 0px; padding: 10px;">
          <span><input placeholder="Set new username" v-model="private.party.newUsername" /></span>
          <i class="fas fa-save" style="position: relative; color: black; left: -25px; top: 1px;" @click="private.party.setUsername"></i>
        </div>
        <div v-for="(P, username) in public">${p[1].html}</div>`)
      scripts[p[0]] = p[1].script
    }
  }

  return scripts
}

const wsFunctions = {
  startWSClient() {
    // Check for previous auth data
    const UUID = window.localStorage.getItem("crowwwd:UUID") || ""
    const username = window.localStorage.getItem("crowwwd:username") || ""

    // Init socket connection
    window.CROWWWD.socket = new ReconnectingWebSocket(`ws://${window.location.host}/?UUID=${UUID}&username=${username}`)
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
}

module.exports = { run, wsFunctions }
