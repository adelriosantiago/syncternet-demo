let scope = {
  word: "123",
  "items>0>todo": "get milk",
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
}

module.exports = { action, message }
