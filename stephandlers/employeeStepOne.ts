import {Composer, Markup } from "telegraf";
import {MyContext} from "../types";
import {removeKeyboard} from "telegraf/typings/markup";
import {db} from "../google/firestore";
import {accessSpreadSheet} from "../google/spreadsheet";

export const dateNow = ():string  => {
    const date:Date = new Date()
    const now:string = date.getDate().toString() + date.getMonth() + date.getFullYear()
    return now
}

export const employeeStepOne = new Composer<MyContext>()

employeeStepOne.hears('Начать смену', async (ctx) => {
    // await db.collection('users').doc(ctx.message.from.id.toString()).collection('workday').doc(dateNow()).set({
    //     start: Date.now()
    // })
    const reply = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard([
        [
            Markup.button.callback('Задача 1', '0'),
        ],
        [
            Markup.button.callback('Задача 2', '1'),
        ],
        [
            Markup.button.callback('Задача 3', '2'),
        ],
        [
            Markup.button.callback('Задача 4', '3'),
        ],
        [
            Markup.button.callback('Задача 5', '4'),
        ]
    ]))

    const message = await ctx.reply('Или закончи смену', Markup.keyboard(['Закончить смену']).resize(true))

    const column = await accessSpreadSheet('append', ctx.message.from.id, 'Смены')
    ctx.scene.session.column = column
    ctx.scene.session.endMessage = message.message_id
    ctx.scene.session.lastMessage = reply.message_id

    return ctx.wizard.next()
})
