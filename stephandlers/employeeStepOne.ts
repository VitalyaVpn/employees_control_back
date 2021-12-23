import {Composer, Markup, Types} from "telegraf";
import {MyContext} from "../types";
import {removeKeyboard} from "telegraf/typings/markup";
import InlineKeyboardMarkup from 'typegram'
import {db} from "../google/firestore";
import {appendShift} from "../google/spreadsheet";
import {makeButtons} from "../functions";

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

    const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
    ctx.scene.session.tasks = []
    await ref.get().then(snap => {
        const data = snap.data()
        if(!data) {
            ctx.reply('Вы не зарегистрированы')
            return ctx.scene.leave()
        }
        for (let key in data) {
            ctx.scene.session.tasks.push(data[key])
        }
    })

    const reply = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))

    const message = await ctx.reply('Или закончи смену', Markup.keyboard([['Закончить смену', 'Пауза']]).resize(true))

    const column = await appendShift(ctx.message.from.id)
    if (column) {
        ctx.scene.session.column = column
    }
    ctx.scene.session.endMessage = message.message_id
    ctx.scene.session.lastMessage = reply.message_id
    ctx.scene.session.pauseTime = 0

    return ctx.wizard.next()
})
