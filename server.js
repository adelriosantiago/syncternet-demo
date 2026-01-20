import express from "express"
import bodyParser from "body-parser"
import syncternet from "./dev_modules/syncternet/export.js"

const port = 3091
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
