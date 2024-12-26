const Vue = require("./vendor/vue.min.js")
const xpath = require("./vendor/xpath-micro.js")
const _get = require("lodash.get")
const _set = require("lodash.set")
const $ = require("./vendor/cash.min.js")
const initialization = require("./initialization.js")

const plugins = initialization.run(window)

// Initialize crowwwd engine
new Vue({
  el: "div#crowwwd",
  data: {
    settings: {
      menu: {
        open: false,
        newUsername: "",
      },
    },
    auth: {
      UUID: "",
      username: "",
    },
    // Realtime data, this object contains all user's public information
    public: {},
    // Local data, every user has it own data for each plugin. This object contains only this user's information
    private: {},
    // Middleware
    middleware: { $: [] },
  },
  created() {},
  mounted() {
    this.startWSClient()
  },
  computed: {
    self() {
      return this.public[this.auth.username]
    },
    execSpecialAction() {
      return {
        "@keys": (data) => {
          data = JSON.parse(data)
          this.auth.UUID = data.UUID
          this.auth.username = data.username
          this.$set(this.public, data.username, {})
          window.localStorage.setItem("crowwwd:UUID", data.UUID)
          window.localStorage.setItem("crowwwd:username", data.username)
          this.onKeysReceived()
        },
      }
    },
  },
  methods: {
    ...initialization.wsFunctions,
    onWSMessage(msg) {
      try {
        msg = msg.toString()
        
        let [, username, plugin, data] = msg.match(/^([@\w-]+)\|(\w+|)\|(.*)$/) // Spec: https://regex101.com/r/QMH6lD/1
        if (!username) return
        if (window.CROWWWD.specialActions.includes(username)) return this.execSpecialAction[username](data)
        data = JSON.parse(data)

        // For plugin data
        data = this.middleware[plugin](data, username, this.auth.username) // Plugin middleware
        for (rootMiddleware of this.middleware["$"]) data = rootMiddleware(data, username, this.auth.username) // Root $ middleware

        if (this.public[username] === undefined) return this.$set(this.public, username, { [plugin]: data }) // When a new user connects and it still doesn't exist in our public

        this.$set(this.public[username], plugin, data)
      } catch (e) {
        console.log("Invalid message", e) // Ignore faulty messages
      }
    },
    onKeysReceived() {
      for (p of Object.entries(plugins)) {
        const obj = eval(p[1])

        // Create plugin data placeholder
        this.$set(this.public[this.auth.username], p[0], {})
        this.$set(this.private, p[0], obj.private)

        // Populate middleware
        this.middleware["$"].push(obj.middleware["$"])
        delete obj.middleware["$"]
        Object.assign(this.middleware, obj.middleware)

        // Init plugin
        obj.init()
      }
    },
    sync(plugin, replace) {
      if (!plugin) {
        Object.keys(plugins).forEach((p) => this.sync(p))
        return
      }
      this.send(plugin, this.self[plugin])
    },
    send(plugin, data) {
      if (!this.auth.UUID) return
      window.CROWWWD.socket.send(this.auth.UUID + "|" + plugin + "|" + JSON.stringify(data))
    },
    raw(a, b, c) {
      window.CROWWWD.socket.send(a + "|" + b + "|" + c)
    },
    setUsername() {
      if (!this.settings.menu.newUsername) return // TODO: Show an error message?
      this.raw(
        "@changeUsername",
        "",
        JSON.stringify({ newUsername: this.settings.menu.newUsername, UUID: this.auth.UUID })
      )
    },
  },
})
