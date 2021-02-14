// - Rock
// -> Plastic
// - Paper

const port = 3091
const http = require("http")
const express = require("express")
const bodyParser = require("body-parser")
const crowwwdServer = require("./crowwwd-server.js") // TODO: Make module
const app = express()

app.use(express.static("static"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/debug", (req, res) => {
  return res.json({ users, public })
})

// Init server
const server = http.createServer(app)
server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})

// Init crowwwd TODO: Extract public and users data
crowwwdServer.init(["party", "emoticons"], server)
