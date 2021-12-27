import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";
import {db, getCol, getUser} from "../google/firestore";
import {appendShift} from "../google/spreadsheet";
import {makeButtons} from "../functions";



export const dateNow = ():string  => {
    const date:Date = new Date()
    const now:string = date.getDate().toString() + date.getMonth() + date.getFullYear()
    return now
}

export const employeeStepOne = new Composer<MyContext>()


employeeStepOne.hears('Начать смену', async (ctx) => {

    try {
        const auth = await getCol(ctx.message.from.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь работников')
            return ctx.scene.leave()
        }
        const user = await getUser(ctx.message.from.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table

        const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        const reply = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))

        const message = await ctx.reply('Или закончи смену', Markup.keyboard([['Закончить смену', 'Пауза']]).resize(true))

        const column = await appendShift(ctx.message.from.id, ctx.scene.session.name, ctx.scene.session.table)
        if (column) {
            ctx.scene.session.column = column
        }
        ctx.scene.session.endMessage = message.message_id
        ctx.scene.session.lastMessage = reply.message_id
        ctx.scene.session.pauseTime = 0

        return ctx.wizard.next()
    }
    catch (err) {
        console.log(err)
    }
})
