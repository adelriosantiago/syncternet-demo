const port = 3091
const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const syncternet = require("syncternet")
const app = express()

app.use(express.static("static"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Init server
const server = http.createServer(app)
server.listen(port, () => {
  console.info(`Listening on http://localhost:${port}`)
})

// Init syncternet
syncternet.init(server)
