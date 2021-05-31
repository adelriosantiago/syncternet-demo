new Object({
  init: () => {
    window.addEventListener("keypress", (e) => {
      e = e || window.event
      const el = e.target || el.srcElement

      if (["TEXTAREA", "INPUT"].includes(el.tagName)) return // Bailout when we do want to write

      const timestamp = new Date().getTime()
      this.self.shout[timestamp] = e.key
      this.sync("shout")

      setTimeout(() => {
        delete this.self.shout[timestamp]
        this.sync("shout")
      }, 5000)
    })
  },
  middleware: {
    $: (data, username, isSelf) => {
      return data
    },
    shout: (data, username, isSelf) => {
      return data
    },
  },
})
