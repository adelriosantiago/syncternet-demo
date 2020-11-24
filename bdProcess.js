let scope = {
  word: "sample word",
}

const action = {
  "@example": () => {
    console.log("action: @example")
  },
}

const message = (msg) => {
  console.log("msg", msg)
}

module.exports = { action, message }
