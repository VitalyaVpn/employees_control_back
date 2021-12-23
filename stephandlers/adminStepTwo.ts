import {Composer, Markup} from "telegraf";
import {MyContext} from "../types";

type User = {
    name: string
    id: string
}

const userArr:Array<User> = [{name: 'Володя', id: '12321321'},{name: 'Андрей', id: '1245421321'}, {name: 'Серёжа', id: '123219798'}]

export const adminStepTwo = new Composer<MyContext>()

adminStepTwo.action('0', async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage(ctx.scene.session.lastMessage)

    const message = await ctx.reply('Выберите пользователя', Markup.inlineKeyboard(userArr.map((item, index) => {
      return  [
            Markup.button.callback(item.name, index.toString())
        ]
    })))

    ctx.scene.session.lastMessage = message.message_id
    return ctx.wizard.next()

})

adminStepTwo.action('1',async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage(ctx.scene.session.lastMessage)

    const message = await ctx.reply('Выберите пользователя', Markup.inlineKeyboard(userArr.map((item, index) => {
        return  [
            Markup.button.callback(item.name, `2_${index.toString()}`)
        ]
    })))

    ctx.scene.session.lastMessage = message.message_id
    return ctx.wizard.next()
})

adminStepTwo.action('2', async (ctx) => {
    await ctx.answerCbQuery()



})

adminStepTwo.on('text', (ctx) => {
    const arr:Array<string> = ctx.message.text.split('\n')
    console.log(arr)
})