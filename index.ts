import express from 'express'
import {startBot} from "./bot"
import {getData} from "./google/firestore";

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
    // getData().then((res) => {
    //     res.forEach((dt:any) => {
    //         arr.push(dt.data())
    //     })
    //     console.log(arr)
    // })
}

start()
