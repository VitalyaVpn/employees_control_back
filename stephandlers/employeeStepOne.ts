import {Composer, Markup } from "telegraf";
import {MyContext} from "../types";
import {removeKeyboard} from "telegraf/typings/markup";
import {db} from "../firebase/firestore";

export const dateNow = ():string  => {
    const date:Date = new Date()
    const now:string = date.getDate().toString() + date.getMonth() + date.getFullYear()
    return now
}

export const employeeStepOne = new Composer<MyContext>()

employeeStepOne.hears('Начать смену', async (ctx) => {
    await db.collection('users').doc(ctx.message.from.id.toString()).collection('workday').doc(dateNow()).set({
        start: Date.now()
    })
    await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard([
        [
            Markup.button.callback('Задача 1', '1_1'),
        ],
        [
            Markup.button.callback('Задача 2', '1_2'),
        ],
        [
            Markup.button.callback('Задача 3', '1_3'),
        ],
        [
            Markup.button.callback('Задача 4', '1_4'),
        ],
        [
            Markup.button.callback('Задача 5', '1_5'),
        ]
    ]))
    const message = await ctx.reply('Или закончи смену', Markup.keyboard(['Закончить смену']).resize(true))
    ctx.scene.session.endMessage = message.message_id
    return ctx.wizard.next()
})
