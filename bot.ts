import { Telegraf, session, Scenes, Markup } from 'telegraf'
import {MyContext} from './types'
import * as dotenv from "dotenv"
import {employeeWizardScene} from "./scenes/employeeScene";
import {trigger} from "./functions";


dotenv.config()
export const startBot = () => {
    try {
        const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!)
        const stage = new Scenes.Stage<MyContext>([employeeWizardScene])
        bot.use(session())

        bot.use((ctx, next) => {
            ctx.myContextProp = ''
            return next()
        })
        bot.use(stage.middleware())

        bot.on(['text'], async (ctx) => {

            switch (ctx.message.text) {
                case '/start' :
                    await ctx.reply(
                        'Привет!',
                        Markup.keyboard([
                            'Начать смену'
                        ]).resize(true)
                    )
                    break
                default:
                    ctx.scene.enter('employee-wizard')
                    break
            }
        } )
        bot.action(trigger, async (ctx) => {
            console.log('here')
            ctx.scene.enter('employee-wizard')
        })
        bot.launch().then(()=> {
            console.log('bot running')
        })
    }
    catch (err) {
        console.log(err)
    }
}