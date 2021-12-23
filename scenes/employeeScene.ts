import {Scenes} from "telegraf";
import {employeeStepOne} from "../stephandlers/employeeStepOne";
import {employeeStepTwo} from "../stephandlers/employeeStepTwo";
import {employeeStepThree} from "../stephandlers/employeeStepThree";

export const employeeWizardScene = new Scenes.WizardScene(
    'employee-wizard',
    employeeStepOne,
    employeeStepTwo,
    employeeStepThree

)