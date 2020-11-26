let scope = {
  word: "sample word",
}

const action = {
  "@sendAll": (socket) => {
    console.log("action: @example")
  },
  "@example": (socket) => {
    console.log("action: @example")
  },
}

const message = (socket, msg) => {
  scope[msg.p] = msg.v
}

module.exports = { action, message }
