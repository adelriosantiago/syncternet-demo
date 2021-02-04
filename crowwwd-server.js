// -> Rock
// - Plastic
// - Paper

const ws = require("ws")
const boydogEngine = require("./boydogEngine.js")

const init = (scope, server) => {
  const wsServer = new ws.Server({ server })
  wsServer.on("connection", (socket) => {
    console.log("New client connected")

    boydogEngine.action["@init"](socket)

    socket.on("message", (msg) => {
      // For special actions
      if (msg[0] === "@") {
        const match = (msg.match(/@\w+\|/) || [])[0]
        try {
          boydogEngine.action[match.slice(0, -1)](socket, msg.substr(match.length))
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
      boydogEngine.message(socket, msg)
    })
  })

  boydogEngine.init(wsServer, scope) // Action and message engine
}

module.exports = { init }
