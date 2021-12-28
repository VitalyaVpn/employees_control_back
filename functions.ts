import {Markup} from "telegraf";
import {DateObject} from "./types";

export const makeButtons = (tasks:Array<string>) => {
        if (tasks.length<=20) {
            const buttons = tasks.map((task, index)=> {
                return [Markup.button.callback(task, (index).toString())]
            })

                return buttons
        }
        const temp = Array((Math.trunc(tasks.length/2) + Math.trunc(tasks.length%2)))
        const buttons1 = [...temp].map((item, i)=>{

            return tasks[i*2+1] ? [Markup.button.callback(tasks[2*i], (2*i).toString()), Markup.button.callback(tasks[2*i+1], (2*i+1).toString())] : [Markup.button.callback(tasks[2*i], (2*i).toString())]

        })
        return buttons1

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
    const day = dateTime.getDate() < 10 ? `0${dateTime.getDate().toString()}` : dateTime.getDate().toString()
    const month = dateTime.getMonth() + 1 < 10 ? `0${(dateTime.getDate() + 1).toString()}` : (dateTime.getDate() + 1).toString()
    const year = dateTime.getFullYear().toString()
    return {
        month: month + '.' + year,
        date: day + '.' + month + '.' + year
    }
}