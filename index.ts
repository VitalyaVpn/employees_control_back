import express from 'express'
import {startBot} from "./bot"


const app = express()
const PORT = process.env.PORT || 8000

app.get('/user', (req, res) => {
    res.send('No users yet')
})

const arr:Array<any> = []

const start = () => {
    app.listen(PORT, ():void => {
        console.log(`Server is running at ${PORT}`)
    })
    startBot()
}

start()
