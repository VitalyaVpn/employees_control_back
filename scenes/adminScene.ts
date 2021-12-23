import {Scenes} from "telegraf";
import {adminStepOne} from "../stephandlers/adminStepOne";
import {adminStepTwo} from "../stephandlers/adminStepTwo";

export const adminWizardScene = new Scenes.WizardScene(
    'admin-wizard',
    adminStepOne,
    adminStepTwo,

)