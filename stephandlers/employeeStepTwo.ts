import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";
import {db} from "../google/firestore";
import {dateNow} from "./employeeStepOne";
import {accessSpreadSheet} from "../google/spreadsheet";
import {tasks} from "../tasks";

export const employeeStepTwo = new Composer<MyContext>()


employeeStepTwo.action(['0', '1', '2', '3', '4'], async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard([
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


    const id = message.chat.id
    if (ctx.scene.session.currentTask) {
        const task = tasks[+ctx.match[0]]
        await accessSpreadSheet('update', id, 'Задачи', task, ctx.scene.session.currentTask?.column,)
        const column = await accessSpreadSheet('append', id, 'Задачи', task)

        ctx.scene.session.currentTask = {
            name: task,
            column,
        }
    }

    if (!ctx.scene.session.currentTask) {
        const task = tasks[+ctx.match[0]]
        const column = await accessSpreadSheet('append', id, 'Задачи', task)
        ctx.scene.session.currentTask = {
            name: task,
            column,
        }


    }


    ctx.scene.session.lastMessage = message.message_id
    return ctx.wizard.selectStep(1)
})

employeeStepTwo.hears(['Закончить смену'], async (ctx) => {
    // await db.collection('users').doc(ctx.message.from.id.toString()).collection('workday').doc(dateNow()).update({
    //     end: Date.now()
    // })

    await ctx.deleteMessage(ctx.scene.session.lastMessage)
    await ctx.deleteMessage(ctx.scene.session.endMessage)
    await ctx.reply('До завтра', Markup.keyboard([['Начать смену']]).resize(true))
    if (ctx.scene.session.currentTask) {
        await accessSpreadSheet('update', ctx.message.from.id, 'Задачи', undefined, ctx.scene.session.currentTask?.column,)
        ctx.scene.session.currentTask = null
    }
    await accessSpreadSheet('update', ctx.message.from.id, 'Смены', undefined, ctx.scene.session.column)
    return ctx.scene.leave()
})