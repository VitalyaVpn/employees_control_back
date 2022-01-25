import {Composer, Markup} from 'telegraf'
import {MyContext} from '../types'
import { updateShift, updateTask} from '../google/spreadsheet'
import {dateString, makeButtons, trigger} from '../functions'
import {getDayRef, getSessionRef} from '../google/firestore'
import {FieldValue} from 'firebase-admin/firestore'


export const employeeStepThree = new Composer<MyContext>()

employeeStepThree.hears(['Возобновить'], async (ctx) => {
    try {
        console.log(ctx.message.from.id, ctx.message.text, ctx.wizard.cursor)
        ctx.scene.session.pauseTime = ctx.scene.session.pauseTime + Date.now() - ctx.scene.session.pauseStart
        ctx.scene.session.pauseStart = 0
        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }

        await ctx.reply('Смена возобновлена', Markup.keyboard([['Закончить смену', 'Пауза']]).resize(true))
        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))
        ctx.scene.session.lastMessage = message.message_id
        if (ctx.scene.session.currentTask) {
            const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
            ctx.scene.session.taskMessage = taskMessage.message_id
        }

        const id = ctx.message.from.id
        const sessionRef = getSessionRef(id)

        await updateTask(id, ctx.scene.session.pauseToString, ctx.scene.session.table, new Date(ctx.scene.session.pauseStart))
        ctx.scene.session.pauseToString = ''

        await sessionRef.update({
            endMessage: ctx.scene.session.endMessage,
            lastMessage: ctx.scene.session.lastMessage,
            pauseTime: ctx.scene.session.pauseTime,
            column: ctx.scene.session.column,
            currentTask: ctx.scene.session.currentTask,
            pauseStart: ctx.scene.session.pauseStart,
            pauseMsg: ctx.scene.session.pauseMsg,
            pauseToString: ctx.scene.session.pauseToString,
            taskMessage: ctx.scene.session.taskMessage,
            taskStart: ctx.scene.session.taskStart ? ctx.scene.session.taskStart : new Date(),
        })

        return ctx.wizard.selectStep(1)
    }
    catch (err) {
        console.log(err)
    }
})


employeeStepThree.hears(['Закончить смену'], async (ctx) => {
    try {
        console.log(ctx.message.from.id, ctx.message.text, ctx.wizard.cursor)
        ctx.scene.session.pauseTime = Date.now() - ctx.scene.session.pauseStart
        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }
        if(ctx.scene.session.endMessage){
            await ctx.deleteMessage(ctx.scene.session.endMessage)
            ctx.scene.session.endMessage = 0
        }


        const pause = dateString(ctx.scene.session.pauseTime)
        const id = ctx.message.from.id
        const dayRef = getDayRef(id, ctx.scene.session.day)
        const sessionRef = getSessionRef(id)

        await ctx.reply('До завтра', Markup.keyboard([['Начать смену']]).resize(true))
        if (ctx.scene.session.currentTask) {
            await updateTask(ctx.message.from.id, ctx.scene.session.currentTask?.column, ctx.scene.session.table,  ctx.scene.session.taskStart)

            const endTime = new Date()
            await dayRef.update('tasks', FieldValue.arrayUnion({
                end: endTime.toLocaleString().replace(/,/, ''),
                name: ctx.scene.session.currentTask.name,
                start: ctx.scene.session.taskStart.toLocaleString().replace(/,/, ''),
                time: dateString(+endTime - +ctx.scene.session.taskStart),
                pause,
            }))
            ctx.scene.session.currentTask = null
        }

        if (ctx.scene.session.pauseToString !== '') {
            await updateTask(id, ctx.scene.session.pauseToString, ctx.scene.session.table,  new Date(ctx.scene.session.pauseStart))
        }
        await updateShift(ctx.message.from.id, ctx.scene.session.column, ctx.scene.session.table, pause)
        await dayRef.update({end: new Date().toLocaleTimeString()})
        await sessionRef.update({
            lastMessage: 0,
            endMessage: 0,
            column: '',
            currentTask: null,
            pauseStart: 0,
            pauseToString: '',
            pauseTime: 0,
            pauseMsg: 0,
            taskMessage: 0,
            taskStart: 0,
        })

        return ctx.scene.leave()
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepThree.on('text', async (ctx) => {
    console.log(ctx.message.from.id, ctx.message.text, ctx.wizard.cursor)
    await ctx.reply('Смена на паузе')
    return ctx.wizard.selectStep(2)
})

employeeStepThree.action(trigger, async (ctx) => {
    console.log(ctx.from!.id, ctx.match[0], ctx.scene.session.tasks[+ctx.match[0]], ctx.wizard.cursor)
    await ctx.reply('Смена на паузе')
    return ctx.wizard.selectStep(2)
})