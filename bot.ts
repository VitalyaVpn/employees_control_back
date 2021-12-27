import { Telegraf, session, Scenes, Markup } from 'telegraf'
import {MyContext} from './types'
import * as dotenv from "dotenv"
import {employeeWizardScene} from "./scenes/employeeScene";
import {adminWizardScene} from "./scenes/adminScene";


dotenv.config()
export const startBot = () => {
    try {
        const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!)
        const stage = new Scenes.Stage<MyContext>([employeeWizardScene, adminWizardScene])
        bot.use(session())

        bot.use((ctx, next) => {
            ctx.myContextProp = ''
            return next()
        })
        bot.use(stage.middleware())

        bot.on(['text'], async (ctx) => {
            switch (ctx.message.text) {
                case 'Начать смену' :
                    ctx.scene.enter('employee-wizard')
                    break
                case 'Админ' :
                    //ctx.scene.enter('admin-wizard')
                    break
                case '/start' :
                    await ctx.reply(
                        'Привет!',
                        Markup.keyboard([
                            'Начать смену'
                        ]).resize(true)
                    )
                    break
            }
        } )

        bot.launch().then(()=> {
            console.log('bot running')
        })
    }
    catch (err) {
        console.log(err)
    }
}