const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const db = {} // TODO use mongoDb? https://www.npmjs.com/package/mongodb

// http POST localhost:8080/ausgeschaenkt glasId=3 lokalId=2 bierId=89

app.post('/ausgeschaenkt', (req, res) => {
    const glasId = req.body.glasId
    const lokalId = req.body.lokalId
    const bierId = req.body.bierId

    // FIXME db[glasId] = {lokalId, bierId}
    
    res.end()
})

app.post('/gesammelt', (req, res) => {
    const glasId = req.body.glasId
    
    // TODO increase counter for glas in DB

    res.end()
})

app.get('/sammelpass', (req, res) => {
    // TODO read from DB: 3 x Beer in bar Z, 4 x Bier in bar X
    const sammelpass = {bar1: 3, bar2: 1, bar3: 99}

    res.send(sammelpass)
})

app.listen(8080, () => console.log('App started listening on 8080'))