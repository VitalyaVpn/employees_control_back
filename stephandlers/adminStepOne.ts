import {Composer, Markup } from "telegraf";
import {MyContext} from "../types";


// export const dateNow = ():string  => {
//     const date:Date = new Date()
//     const now:string = date.getDate().toString() + date.getMonth() + date.getFullYear()
//     return now
// }

export const adminStepOne = new Composer<MyContext>()

adminStepOne.hears('Админ', async (ctx) => {

    const greet = await ctx.reply('Выберите комманду', Markup.inlineKeyboard([
        [
            Markup.button.callback('Редактировать пользователей', '0'),
        ],
        [
            Markup.button.callback('Удалить пользователя', '1'),
        ],
    ]))


    ctx.scene.session.lastMessage = greet.message_id

    return ctx.wizard.next()
})
