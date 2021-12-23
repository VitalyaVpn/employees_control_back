import {Markup} from "telegraf";

export const makeButtons = (tasks:Array<string>) => {
    const buttons = tasks.map((task, index)=> {
        return [Markup.button.callback(task, (index).toString())]
    })
    return buttons
}

export const trigger = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20']