import {Markup, Scenes} from "telegraf";
import {employeeStepOne} from "../stephandlers/employeeStepOne";
import {employeeStepTwo} from "../stephandlers/employeeStepTwo";

export const adminWizardScene = new Scenes.WizardScene(
    'admin-wizard',
    async (ctx) => {
        await ctx.reply(
            'Привет, админ!',
            Markup.keyboard([
                'Изменить команды'
            ])
        )
        return ctx.wizard.next()

    },
    employeeStepOne,
    employeeStepTwo,

)