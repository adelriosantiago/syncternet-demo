const getDirectories = require("../vendor/getDirectories.js")
const plugins = getDirectories("./plugins")

let backendExport = { plugins: {} }
for (const p of plugins) {
  backendExport.plugins[p] = {
    middleware: require(`../plugins/${p}/backend.js`),
  }
}

module.exports = backendExport
