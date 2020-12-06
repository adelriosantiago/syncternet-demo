let scope = {
  word: "123",
  "items>0>todo": "get milk",
  "items>0>amt": "5",
  "items>1>todo": "buy meat",
  "items>1>amt": "3",
  "items>2>todo": "exercise",
  "items>2>amt": "1",
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
