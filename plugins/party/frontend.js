new Object({
  private: {
    newUsername: "",
  },
  init: () => {
    this.send("party", {
      xpath: "/html/body",
      status: window.CROWWWD.ONLINE,
      pic: "https://via.placeholder.com/150", // TODO: Improve so that it is not sent everytime
    })

    document.onmouseover = (e) => {
      try {
        e = e || window.event
        const el = e.target || el.srcElement

        const rect = el.getBoundingClientRect()
        this.self.party.xpath = xpath(el)
        this.self.party.status = window.CROWWWD.ONLINE

        clearTimeout(this.awayTimeout)
        this.awayTimeout = setTimeout(() => {
          this.self.party.status = window.CROWWWD.AWAY
          this.sync("party")
        }, 5000)

        this.sync("party")
      } catch (e) {
        console.log("Party error", e) // Ignore faulty messages
      }
    }
  },
  middleware: {
    $: (data, username, isSelf) => {
      return data
    },
    party: (data, username, isSelf) => {
      let rect

      try {
        rect = xpath(data.xpath).getBoundingClientRect()
      } catch (e) {
        rect = { x: 0, y: 0 }
      }

      data.pos = {
        x: Math.round(rect.x + document.documentElement.scrollLeft),
        y: Math.round(rect.y + document.documentElement.scrollTop),
      }

      if (data.pos.y > scrollY + innerHeight) {
        data.wayOut = "DOWN"
        data.pos.y = scrollY + innerHeight - 40
      } else if (data.pos.y < scrollY) {
        data.wayOut = "UP"
        data.pos.y = scrollY
      } else {
        data.wayOut = undefined
      }

      return data
    },
  },
})
