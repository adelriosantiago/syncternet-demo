const fs = require("fs")
const tailwindScoped = fs.readFileSync("./vendor/tailwind.min.css", { encoding: "utf8", flag: "r" })
const listdirs = require("listdirs")

listdirs(
  "./plugins",
  (callback = (err, plugins) => {
    if (err) return console.info("Unable to list plugins to build", plugins)

    plugins = plugins.slice(1).map((f) => f.match(/\w+$/g)[0])

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
  })
)
