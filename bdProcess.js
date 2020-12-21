// - Rock
// -> Plastic
// - Paper

let ws, wsServer

let scope = {
  word: "123",
  "items>0>todo": "buy milk",
  "items>1>todo": "buy meat",
  "items>2>todo": "fix car",
}

const action = {
  "@init": (socket, data) => {
    console.log("action: @init")
    socket.send(`@init|${JSON.stringify(scope)}`)
  },
  "@example": (socket, data) => {
    console.log("action: @example")
  },
}

const message = (socket, msg) => {
  console.log("msg", msg)
  scope[msg.p] = msg.v

  // Send to clients
  setTimeout(() => {
    wsServer.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) client.send(JSON.stringify({ p: msg.p, v: msg.v }))
    })
  }, 0)
}

const init = (_ws, _wsServer) => {
  ws = _ws
  wsServer = _wsServer
}

module.exports = { action, message, init }
