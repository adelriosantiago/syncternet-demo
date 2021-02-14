// - Rock
// -> Plastic
// - Paper

const WS_CONNECTING = 0
const WS_OPEN = 1
const WS_CLOSING = 2
const WS_CLOSED = 3

let wsServer

let public = {}
let users = {}

const action = {
  _new: (socket, UUID, msg) => {
    console.log("action: @init")
    socket.send(`@init|${JSON.stringify(public)}`)
  },
  _connection: (socket, UUID, msg) => {
    console.log("action: @example")
  },
}

const init = (_wsServer, _public) => {
  wsServer = _wsServer
  public = _public
}

module.exports = { action, message, init }
