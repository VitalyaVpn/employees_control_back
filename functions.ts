import {Markup} from "telegraf";
import {DateObject} from "./types";

export const makeButtons = (tasks:Array<string>) => {
        if (tasks.length<=20) {
            return tasks.map((task, index) => {
                    return [Markup.button.callback(task, (index).toString())]
                })
        }
        const temp = Array((Math.trunc(tasks.length/2) + Math.trunc(tasks.length%2)))
        return [...temp].map((item, i) => {

            return tasks[i * 2 + 1] ? [Markup.button.callback(tasks[2 * i], (2 * i).toString()), Markup.button.callback(tasks[2 * i + 1], (2 * i + 1).toString())] : [Markup.button.callback(tasks[2 * i], (2 * i).toString())]

        })

}

export const trigger = [...Array(40)].map((e, i) => i.toString())

export const dateString = (time:number):string => {
    time = Math.trunc(time/1000)
    const tempHours = Math.trunc(time/3600)
    const tempMinutes = Math.trunc(time%3600/60)
    const tempSeconds = time%3600%60
    const hours = tempHours < 10 ? '0'+tempHours : tempHours.toString()
    const minutes = tempMinutes < 10 ? '0'+tempMinutes : tempMinutes.toString()
    const seconds = tempSeconds < 10 ? '0'+tempSeconds : tempSeconds.toString()
    return `${hours}:${minutes}:${seconds}`
}

export const getDate = ():DateObject => {
    const dateTime = new Date()
    const date: string = dateTime.toLocaleDateString()
    const dateArr:Array<string> = date.split('.')
    dateArr.shift()
    const month = dateArr.join('.')
    return {
        month,
        date
    }
}