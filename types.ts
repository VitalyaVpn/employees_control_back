import {Context, Scenes} from "telegraf"

export interface MyWizardSession extends Scenes.WizardSessionData {
    // will be available under `ctx.scene.session.myWizardSessionProp`
    lastMessage: number
    endMessage: number
    column: number | string
    currentTask: Task | null
    pauseStart: number
    pauseToString: string
    pauseTime: number
    pauseMsg: number
    tasks: Array<string>
    taskMessage: number
    table: string
    name: string
    taskStart: Date
}


export interface MySession extends Scenes.WizardSession<MyWizardSession> {
    // will be available under `ctx.session.mySessionProp`
    mySessionProp: number
}

export interface MyContext extends Context {
    myContextProp: string
    session: MySession
    scene: Scenes.SceneContextScene<MyContext, MyWizardSession>
    wizard: Scenes.WizardContextWizard<MyContext>
}

export interface Task {
    name: string
    column: string | number
}