import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";
import { appendTask, updateShift, updateTask} from "../google/spreadsheet";
import {dateString, makeButtons, trigger} from "../functions";

export const employeeStepTwo = new Composer<MyContext>()


employeeStepTwo.action(trigger, async (ctx) => {
    try {
        await ctx.answerCbQuery()
        await ctx.deleteMessage()
        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
        }

        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))


        const id = message.chat.id
        if (ctx.scene.session.currentTask) {

            const task = ctx.scene.session.tasks[+ctx.match[0]]

            await updateTask(id, ctx.scene.session.currentTask?.column, ctx.scene.session.table,  ctx.scene.session.taskStart)
            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name,ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }

        }
        if (!ctx.scene.session.currentTask) {
            const task = ctx.scene.session.tasks[+ctx.match[0]]
            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name, ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }

        }

        ctx.scene.session.lastMessage = message.message_id
        return ctx.wizard.selectStep(1)
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepTwo.hears(['Закончить смену'], async (ctx) => {
    try {
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

employeeStepTwo.hears(['Пауза'], async (ctx) => {
    try {
        ctx.scene.session.pauseStart = Date.now()
        await ctx.deleteMessage(ctx.scene.session.lastMessage)
        const message = await ctx.reply('Смена на паузе', Markup.keyboard([['Закончить смену', 'Возобновить']]).resize(true))
        ctx.scene.session.lastMessage = message.message_id
        return ctx.wizard.selectStep(2)
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepTwo.on('text', async (ctx) => {
    try {
        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
        }
        await ctx.deleteMessage(ctx.scene.session.lastMessage)
        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))

        const id = message.chat.id
        if (ctx.scene.session.currentTask) {
            const task = ctx.message.text
            await updateTask(id, ctx.scene.session.currentTask?.column, ctx.scene.session.table, ctx.scene.session.taskStart)
            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name, ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }

        }
        if (!ctx.scene.session.currentTask) {
            const task = ctx.message.text
            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name, ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }

        }

        ctx.scene.session.lastMessage = message.message_id
        return ctx.wizard.selectStep(1)
    }
    catch (err) {
        console.log(err)
    }

})

