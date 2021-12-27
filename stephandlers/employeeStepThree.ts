import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";
import { updateShift, updateTask} from "../google/spreadsheet";
import {dateString, makeButtons} from "../functions";


export const employeeStepThree = new Composer<MyContext>()

employeeStepThree.hears(['Возобновить'], async (ctx) => {
    try {
        ctx.scene.session.pauseTime = ctx.scene.session.pauseTime + Date.now() - ctx.scene.session.pauseStart
        await ctx.deleteMessage(ctx.scene.session.lastMessage)
        await ctx.reply('Смена возобновлена', Markup.keyboard([['Закончить смену', 'Пауза']]).resize(true))
        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))
        ctx.scene.session.lastMessage = message.message_id
        if (ctx.scene.session.currentTask) {
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
            ctx.scene.session.taskMessage = taskMessage.message_id
        }
        return ctx.wizard.selectStep(1)
    }
    catch (err) {
        console.log(err)
    }
})


employeeStepThree.hears(['Закончить смену'], async (ctx) => {
    try {
        ctx.scene.session.pauseTime = Date.now() - ctx.scene.session.pauseStart
        await ctx.deleteMessage(ctx.scene.session.lastMessage)
        await ctx.deleteMessage(ctx.scene.session.endMessage)
        await ctx.reply('До завтра', Markup.keyboard([['Начать смену']]).resize(true))
        if (ctx.scene.session.currentTask) {
            await updateTask(ctx.message.from.id, ctx.scene.session.currentTask?.column, ctx.scene.session.table,  ctx.scene.session.taskStart)
            ctx.scene.session.currentTask = null
        }
        const pause = dateString(ctx.scene.session.pauseTime)
        await updateShift(ctx.message.from.id, ctx.scene.session.column, ctx.scene.session.table, pause)
        return ctx.scene.leave()
    }
    catch (err) {
        console.log(err)
    }
})