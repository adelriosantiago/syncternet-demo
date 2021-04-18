const getDirectories = require("./getDirectories.js")
const plugins = getDirectories("./plugins")

let backendExport = { plugins: {} }
for (const p of plugins) {
  backendExport.plugins[p] = {
    middleware: require(`./${p}/backend.js`),
  }
}

module.exports = backendExport
