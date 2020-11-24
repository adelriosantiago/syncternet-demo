let scope = {
  word: "sample word",
}

const specialActions = {
  "@example": () => {
    console.log("specialActions: @example")
  },
}

const message = (msg) => {
  console.log("msg", msg)
}

module.exports = { specialActions, message }
