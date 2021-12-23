import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";

export const adminStepThree = new Composer<MyContext>()

adminStepThree.action(['0', '1', '2', '3', '4', '5', '6'], async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage(ctx.scene.session.lastMessage)

    const reply = await ctx.reply('Выберите действие', Markup.inlineKeyboard([
        [Markup.button.callback('Добавить кнопки', '0')],
        [Markup.button.callback('Удалить кнопки', '1')]
    ]))

    ctx.scene.session.lastMessage = reply.message_id
    return ctx.wizard.next()
})

adminStepThree.action(['2_0', '2_1', '2_2', '2_3', '2_4', '2_5', '2_6'], async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage(ctx.scene.session.lastMessage)

    const reply = await ctx.reply('Вы уверены?', Markup.inlineKeyboard([
        [Markup.button.callback('Да', '3_0')],
        [Markup.button.callback('Нет', '3_1')]
    ]))

    ctx.scene.session.lastMessage = reply.message_id
    return ctx.wizard.next()
})