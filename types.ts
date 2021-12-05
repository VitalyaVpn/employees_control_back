import {Context, Scenes} from "telegraf"

export interface MyWizardSession extends Scenes.WizardSessionData {
    // will be available under `ctx.scene.session.myWizardSessionProp`
    lastMessage: number
    endMessage: number
    column: number | string | undefined
    currentTask: Task | null
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
    name?: string
    column?: string | number | undefined
}