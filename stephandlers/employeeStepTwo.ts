import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";
import {db} from "../firebase/firestore";
import {dateNow} from "./employeeStepOne";

export const employeeStepTwo = new Composer<MyContext>()


employeeStepTwo.action(['1_1', '1_2', '1_3', '1_4', '1_5'], async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard([
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
    ctx.scene.session.lastMessage = message.message_id
    return ctx.wizard.selectStep(1)
})

employeeStepTwo.hears(['Закончить смену'], async (ctx) => {
    await db.collection('users').doc(ctx.message.from.id.toString()).collection('workday').doc(dateNow()).update({
        end: Date.now()
    })
    await ctx.deleteMessage(ctx.scene.session.lastMessage)
    await ctx.deleteMessage(ctx.scene.session.endMessage)
    await ctx.reply('До завтра', Markup.keyboard([['Начать смену']]).resize(true))
    return ctx.scene.leave()
})