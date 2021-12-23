import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";
import {accessSpreadSheet, updateShift, updateTask} from "../google/spreadsheet";
import {makeButtons} from "../functions";


export const employeeStepThree = new Composer<MyContext>()

employeeStepThree.hears(['Возобновить'], async (ctx) => {

    ctx.scene.session.pauseTime = Date.now() - ctx.scene.session.pauseStart
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
})


employeeStepThree.hears(['Закончить смену'], async (ctx) => {
    // await db.collection('users').doc(ctx.message.from.id.toString()).collection('workday').doc(dateNow()).update({
    //     end: Date.now()
    // })
    ctx.scene.session.pauseTime = Date.now() - ctx.scene.session.pauseStart
    await ctx.deleteMessage(ctx.scene.session.lastMessage)
    await ctx.deleteMessage(ctx.scene.session.endMessage)
    await ctx.reply('До завтра', Markup.keyboard([['Начать смену']]).resize(true))
    if (ctx.scene.session.currentTask) {
        await updateTask(ctx.message.from.id, ctx.scene.session.currentTask?.column,)
        ctx.scene.session.currentTask = null
    }
    await updateShift(ctx.message.from.id, ctx.scene.session.column)
    console.log(ctx.scene.session.pauseTime)
    return ctx.scene.leave()
})