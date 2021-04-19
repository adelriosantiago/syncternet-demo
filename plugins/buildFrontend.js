const fs = require("fs")
const getDirectories = require("../vendor/getDirectories.js")

const tailwindScoped = fs.readFileSync("./vendor/tailwind.min.css", { encoding: "utf8", flag: "r" })
const plugins = getDirectories("./plugins")

let frontendExport = {
  style: tailwindScoped,
  plugins: {},
}
for (const p of plugins) {
  frontendExport.plugins[p] = {
    html: fs.readFileSync(`./plugins/${p}/template.html`, "utf8"),
    middleware: {},
    script: fs.readFileSync(`./plugins/${p}/frontend.js`, "utf8"),
  }
  fs.writeFileSync("./exports/frontendExport.js", `module.exports = ${JSON.stringify(frontendExport)}`)
}
