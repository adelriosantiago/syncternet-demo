// - Rock
// -> Plastic
// - Paper

const Vue = require("./vendor/vue.min.js")
const xpath = require("./vendor/xpath-micro.js")
const _get = require("lodash.get")
const _set = require("lodash.set")
const $ = require("./vendor/cash.min.js")
const initialization = require("./initialization.js")

const scripts = initialization.run(window)

// Initialize crowwwd engine
new Vue({
  el: "div#crowwwd",
  data: {
    // Realtime data, every user has a copy of this with the same contents
    public: {},
    // Local data, every user has it own data
    private: {
      UUID: "",
      username: "",
    },
    // Middleware
    middleware: { $: [] },
  },
  created() {},
  mounted() {
    this.startWSClient()

    for (s of scripts) {
      const obj = eval(s)

      obj.init()
      this.middleware["$"].push(obj.middleware["$"])
      delete obj.middleware["$"]
      Object.assign(this.middleware, obj.middleware)
    }

    for (init of this.middleware["$"]) init()
  },
  computed: {
    execSpecialAction() {
      return {
        "@keys": (data) => {
          data = JSON.parse(data)
          this.private.UUID = data.UUID
          this.private.username = data.username
          window.localStorage.setItem("crId", data.UUID)
        },
      }
    },
  },
  methods: {
    ...initialization.wsFunctions,
    onWSMessage(msg) {
      try {
        let [, username, plugin, data] = msg.match(/^([@\w-]+)\|(\w+|)\|(.*)$/) // Spec: https://regex101.com/r/QMH6lD/1
        if (!username) return
        if (window.CROWWWD.specialActions.includes(username)) return this.execSpecialAction[username](data)
        data = JSON.parse(data)

        // For plugin data
        data = this.middleware[plugin](data, username, this.private.username) // Plugin middleware
        for (init of this.middleware["$"]) data = init(data, username, this.private.username) // Root $ middleware

        if (this.public[username] === undefined) return this.$set(this.public, username, { [plugin]: data })
        if (this.public[username][plugin] === undefined) return this.$set(this.public[username], plugin, data)

        const merged = { ...this.public[username][plugin], ...data }
        this.$set(this.public[username], plugin, merged)
      } catch (e) {
        console.log("Invalid message", e) // Ignore faulty messages
      }
    },
    wsSend(plugin, data) {
      if (!this.private.UUID) return
      window.CROWWWD.socket.send(this.private.UUID + "|" + plugin + "|" + JSON.stringify(data))
    },
  },
})
