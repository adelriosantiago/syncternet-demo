const port = 3091
const express = require("express")
const bodyParser = require("body-parser")
const syncternet = require("syncternet")
const app = express()

app.use(express.static("static"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Init server
const server = app.listen(port, () => {
  console.info(`Listening on http://localhost:${port}`)
})

// Init syncternet
syncternet.init(server, app)
