let scope = {
  word: "sample word",
}

const action = {
  "@sendAll": (socket) => {
    Object.entries(scope).forEach((e) => {
      socket.send(JSON.stringify({ p: e[0], v: e[1] }))
    })
  },
  "@example": (socket) => {
    console.log("action: @example")
  },
}

const message = (socket, msg) => {
  scope[msg.p] = msg.v
}

module.exports = { action, message }
