import {Composer, Markup} from 'telegraf'
import {MyContext} from '../types'
import {db, getCol, getDay, getDayRef, getPause, getSessionRef, getUser} from '../google/firestore'
import {appendShift, appendTask, updateShift, updateTask} from '../google/spreadsheet'
import {dateString, getDate, makeButtons, trigger} from '../functions'
import {FieldValue} from 'firebase-admin/firestore'


export const employeeStepOne = new Composer<MyContext>()


employeeStepOne.hears('Начать смену', async (ctx) => {

    try {
        const auth = await getCol(ctx.message.from.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь сотрудником')
            return ctx.scene.leave()
        }
        const user = await getUser(ctx.message.from.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table
        ctx.scene.session.lastMessage = 0
        ctx.scene.session.taskMessage = 0
        ctx.scene.session.endMessage = 0
        ctx.scene.session.column = 0
        ctx.scene.session.currentTask = null
        ctx.scene.session.pauseStart = 0
        ctx.scene.session.pauseToString = ''
        ctx.scene.session.pauseTime = 0
        ctx.scene.session.pauseMsg = 0
        ctx.scene.session.tasks = []
        ctx.scene.session.day = ''





        const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        const {date} = getDate()
        ctx.scene.session.day = date

        const session = getSessionRef(ctx.message.from.id)
        const dayRef = getDayRef(ctx.message.from.id, ctx.scene.session.day)
        await dayRef.set({start: new Date().toLocaleTimeString(), tasks: [], end: '0'})


        const reply = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))

        const message = await ctx.reply('Или закончи смену', Markup.keyboard([['Закончить смену', 'Пауза']]).resize(true))

        const column = await appendShift(ctx.message.from.id, ctx.scene.session.name, ctx.scene.session.table)
        if (column) {
            ctx.scene.session.column = column
        }
        ctx.scene.session.endMessage = message.message_id
        ctx.scene.session.lastMessage = reply.message_id
        ctx.scene.session.pauseTime = 0
        await session.update({
            endMessage: ctx.scene.session.endMessage,
            lastMessage: ctx.scene.session.lastMessage,
            pauseTime: ctx.scene.session.pauseTime,
            column: ctx.scene.session.column,
            currentTask: ctx.scene.session.currentTask,
            pauseStart: ctx.scene.session.pauseStart,
            pauseMsg: ctx.scene.session.pauseMsg,
            pauseToString: ctx.scene.session.pauseToString,
            taskMessage: ctx.scene.session.taskMessage,
        })

        return ctx.wizard.next()
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepOne.hears('Закончить смену', async (ctx) => {

    try {
        const auth = await getCol(ctx.message.from.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь сотрудником')
            return ctx.scene.leave()
        }

        const id = ctx.message.from.id
        const {date} = getDate()
        ctx.scene.session.day = date
        const endDay = await getDay(id, ctx.scene.session.day)
        if (endDay) {
            await ctx.reply('Нужно начать новую смену')
            return ctx.scene.leave()
        }

        const session = getSessionRef(id)
        session.get().then((snap)=>{
            if(snap.data()){
                const data = snap.data()
                ctx.scene.session.lastMessage = data!.lastMessage
                ctx.scene.session.endMessage = data!.endMessage
                ctx.scene.session.column = data!.column
                ctx.scene.session.currentTask = data!.currentTask
                ctx.scene.session.pauseStart = data!.pauseStart
                ctx.scene.session.pauseToString = data!.pauseToString
                ctx.scene.session.pauseTime = data!.pauseTime
                ctx.scene.session.pauseMsg =data!.pauseMsg
                ctx.scene.session.taskMessage = data!.taskMessage
                ctx.scene.session.taskStart = data!.taskStart ? data!.taskStart.toDate() : data!.taskStart
            }
        })

        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }
        if(ctx.scene.session.endMessage){
            await ctx.deleteMessage(ctx.scene.session.endMessage)
            ctx.scene.session.endMessage = 0
        }
        if(ctx.scene.session.pauseMsg){
            await ctx.deleteMessage(ctx.scene.session.pauseMsg)
            ctx.scene.session.pauseMsg = 0
        }

        const user = await getUser(ctx.message.from.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table

        const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        const pause = dateString(ctx.scene.session.pauseTime)
        const dayRef = getDayRef(id, ctx.scene.session.day)

        await ctx.reply('До завтра', Markup.keyboard([['Начать смену']]).resize(true))
        if (ctx.scene.session.currentTask) {
            await updateTask(ctx.message.from.id, ctx.scene.session.currentTask?.column, ctx.scene.session.table,  ctx.scene.session.taskStart)

            const endTime = new Date()
            await dayRef.update('tasks', FieldValue.arrayUnion({
                end: endTime.toLocaleString().replace(/,/, ''),
                name: ctx.scene.session.currentTask.name,
                start: ctx.scene.session.taskStart.toLocaleString().replace(/,/, ''),
                time: dateString(+endTime - +ctx.scene.session.taskStart),
                pause,
            }))
            ctx.scene.session.currentTask = null
        }

        if (ctx.scene.session.pauseToString !== '') {
            await updateTask(id, ctx.scene.session.pauseToString, ctx.scene.session.table,  new Date(ctx.scene.session.pauseStart))
        }

        await updateShift(ctx.message.from.id, ctx.scene.session.column, ctx.scene.session.table, pause)


        await dayRef.update({end: new Date().toLocaleTimeString()})
        await session.update({
            lastMessage: 0,
            endMessage: 0,
            column: '',
            currentTask: null,
            pauseStart: 0,
            pauseToString: '',
            pauseTime: 0,
            pauseMsg: 0,
            taskMessage: 0,
            taskStart: 0,
        })

        return ctx.scene.leave()
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepOne.hears('Пауза', async (ctx) => {
    try {
        const auth = await getCol(ctx.message.from.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь сотрудником')
            return ctx.scene.leave()
        }

        const id = ctx.message.from.id
        const {date} = getDate()
        ctx.scene.session.day = date
        const endDay = await getDay(id, ctx.scene.session.day)
        if (endDay) {
            await ctx.reply('Нужно начать новую смену')
            return ctx.scene.leave()
        }

        const session = getSessionRef(id)
        session.get().then((snap)=>{
            if(snap.data()){
                const data = snap.data()
                ctx.scene.session.lastMessage = data!.lastMessage
                ctx.scene.session.endMessage = data!.endMessage
                ctx.scene.session.column = data!.column
                ctx.scene.session.currentTask = data!.currentTask
                ctx.scene.session.pauseStart = data!.pauseStart
                ctx.scene.session.pauseToString = data!.pauseToString
                ctx.scene.session.pauseTime = data!.pauseTime
                ctx.scene.session.pauseMsg =data!.pauseMsg
                ctx.scene.session.taskMessage = data!.taskMessage
                ctx.scene.session.taskStart = data!.taskStart ? data!.taskStart.toDate() : data!.taskStart
            }
        })

        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }
        if(ctx.scene.session.endMessage){
            await ctx.deleteMessage(ctx.scene.session.endMessage)
            ctx.scene.session.endMessage = 0
        }
        if(ctx.scene.session.pauseMsg){
            await ctx.deleteMessage(ctx.scene.session.pauseMsg)
            ctx.scene.session.pauseMsg = 0
        }
        const user = await getUser(ctx.message.from.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table

        const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        ctx.scene.session.pauseStart = Date.now()

        const column = await appendTask(id, 'Пауза', ctx.scene.session.name, ctx.scene.session.table,  new Date())
        if (column) {
            ctx.scene.session.pauseToString = column
        }

        const message = await ctx.reply('Смена на паузе', Markup.keyboard([['Закончить смену', 'Возобновить']]).resize(true))
        ctx.scene.session.lastMessage = message.message_id

        await session.update({
            endMessage: ctx.scene.session.endMessage,
            lastMessage: ctx.scene.session.lastMessage,
            pauseTime: ctx.scene.session.pauseTime,
            column: ctx.scene.session.column,
            currentTask: ctx.scene.session.currentTask,
            pauseStart: ctx.scene.session.pauseStart,
            pauseMsg: ctx.scene.session.pauseMsg,
            pauseToString: ctx.scene.session.pauseToString,
            taskMessage: ctx.scene.session.taskMessage,
            taskStart: ctx.scene.session.taskStart,
        })
        return ctx.wizard.selectStep(2)
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepOne.hears('Возобновить', async (ctx) => {
    try {
        const auth = await getCol(ctx.message.from.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь сотрудником')
            return ctx.scene.leave()
        }

        const id = ctx.message.from.id
        const {date} = getDate()
        ctx.scene.session.day = date
        const endDay = await getDay(id, ctx.scene.session.day)
        if (endDay) {
            await ctx.reply('Нужно начать новую смену')
            return ctx.scene.leave()
        }


        const session = getSessionRef(id)
        session.get().then(async (snap)=>{
            if(snap.data()){
                const data = snap.data()
                ctx.scene.session.lastMessage = data!.lastMessage
                ctx.scene.session.endMessage = data!.endMessage
                ctx.scene.session.column = data!.column
                ctx.scene.session.currentTask = data!.currentTask
                ctx.scene.session.pauseStart = data!.pauseStart
                ctx.scene.session.pauseToString = data!.pauseToString
                ctx.scene.session.pauseTime = data!.pauseTime
                ctx.scene.session.pauseMsg =data!.pauseMsg
                ctx.scene.session.taskMessage = data!.taskMessage
                ctx.scene.session.taskStart = data!.taskStart ? data!.taskStart.toDate() : data!.taskStart
            }
        })

        ctx.scene.session.pauseTime = ctx.scene.session.pauseTime + Date.now() - ctx.scene.session.pauseStart
        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }


        const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        const user = await getUser(ctx.message.from.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table

        await updateTask(id, ctx.scene.session.pauseToString, ctx.scene.session.table,  new Date(ctx.scene.session.pauseStart))
        ctx.scene.session.pauseToString = ''

        await ctx.reply('Смена возобновлена', Markup.keyboard([['Закончить смену', 'Пауза']]).resize(true))
        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))
        ctx.scene.session.lastMessage = message.message_id

        if (ctx.scene.session.currentTask) {
            const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
            ctx.scene.session.taskMessage = taskMessage.message_id
        }
        ctx.scene.session.lastMessage = message.message_id

        await session.update({
            endMessage: ctx.scene.session.endMessage,
            lastMessage: ctx.scene.session.lastMessage,
            pauseTime: ctx.scene.session.pauseTime,
            column: ctx.scene.session.column,
            currentTask: ctx.scene.session.currentTask,
            pauseStart: ctx.scene.session.pauseStart,
            pauseMsg: ctx.scene.session.pauseMsg,
            pauseToString: ctx.scene.session.pauseToString,
            taskMessage: ctx.scene.session.taskMessage,
            taskStart: ctx.scene.session.taskStart,
        })

        return ctx.wizard.selectStep(1)

    }
    catch (err) {
        console.log(err)
    }
})

employeeStepOne.on('text', async (ctx) => {
    try {
        const auth = await getCol(ctx.message.from.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь сотрудником')
            return ctx.scene.leave()
        }

        const id = ctx.message.from.id
        const {date} = getDate()
        ctx.scene.session.day = date
        const endDay = await getDay(id, ctx.scene.session.day)
        if (endDay) {
            await ctx.reply('Нужно начать новую смену')
            return ctx.scene.leave()
        }



        const session = getSessionRef(id)
        session.get().then(async (snap)=>{
            if(snap.data()){
                const data = snap.data()
                ctx.scene.session.lastMessage = data!.lastMessage
                ctx.scene.session.endMessage = data!.endMessage
                ctx.scene.session.column = data!.column
                ctx.scene.session.currentTask = data!.currentTask
                ctx.scene.session.pauseStart = data!.pauseStart
                ctx.scene.session.pauseToString = data!.pauseToString
                ctx.scene.session.pauseTime = data!.pauseTime
                ctx.scene.session.pauseMsg =data!.pauseMsg
                ctx.scene.session.taskMessage = data!.taskMessage
                ctx.scene.session.taskStart = data!.taskStart ? data!.taskStart.toDate() : data!.taskStart
            }
        })

        const isPause = await getPause(id)
        if(isPause) {
            await ctx.reply('Смена на паузе')
            return ctx.wizard.selectStep(2)
        }

        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }


        const user = await getUser(ctx.message.from.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table

        const ref = db.collection('users').doc(ctx.message.from.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))





        const dayRef = getDayRef(id, ctx.scene.session.day)
        if (ctx.scene.session.currentTask) {
            const task = ctx.message.text
            await updateTask(id, ctx.scene.session.currentTask?.column, ctx.scene.session.table, ctx.scene.session.taskStart)

            const endTime = new Date()
            await dayRef.update('tasks', FieldValue.arrayUnion({
                end: endTime.toLocaleString().replace(/,/, ''),
                name: ctx.scene.session.currentTask.name,
                start: ctx.scene.session.taskStart.toLocaleString().replace(/,/, ''),
                time: dateString(+endTime - +ctx.scene.session.taskStart)
            }))

            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name, ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }


        }
        if (!ctx.scene.session.currentTask) {
            const task = ctx.message.text
            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name, ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }
        }
        await session.update({
            endMessage: ctx.scene.session.endMessage,
            lastMessage: ctx.scene.session.lastMessage,
            pauseTime: ctx.scene.session.pauseTime,
            column: ctx.scene.session.column,
            currentTask: ctx.scene.session.currentTask,
            pauseStart: ctx.scene.session.pauseStart,
            pauseMsg: ctx.scene.session.pauseMsg,
            pauseToString: ctx.scene.session.pauseToString,
            taskMessage: ctx.scene.session.taskMessage,
            taskStart: ctx.scene.session.taskStart,
        })
        ctx.scene.session.lastMessage = message.message_id
        return ctx.wizard.selectStep(1)
    }
    catch (err) {
        console.log(err)
    }
})

employeeStepOne.action(trigger, async (ctx) => {
    try {
        const auth = await getCol(ctx.from!.id.toString())
        if (!auth) {
            await ctx.reply('Вы не являетесь сотрудником')
            return ctx.scene.leave()
        }

        const id = ctx.from!.id
        const {date} = getDate()
        ctx.scene.session.day = date
        const endDay = await getDay(id, ctx.scene.session.day)

        if (endDay) {
            await ctx.reply('Нужно начать новую смену')
            return ctx.scene.leave()
        }

        const session = getSessionRef(id)
        session.get().then(async (snap)=>{
            if(snap.data()){
                const data = snap.data()
                if(data!.pauseStart) {
                    await ctx.reply('Смена на паузе')
                    return ctx.scene.leave()
                }

                ctx.scene.session.lastMessage = data!.lastMessage
                ctx.scene.session.endMessage = data!.endMessage
                ctx.scene.session.column = data!.column
                ctx.scene.session.currentTask = data!.currentTask
                ctx.scene.session.pauseStart = data!.pauseStart
                ctx.scene.session.pauseToString = data!.pauseToString
                ctx.scene.session.pauseTime = data!.pauseTime
                ctx.scene.session.pauseMsg = data!.pauseMsg
                ctx.scene.session.taskMessage = data!.taskMessage
                ctx.scene.session.taskStart = data!.taskStart ? data!.taskStart.toDate() : data!.taskStart
            }
        })

        const isPause = await getPause(id)
        if(isPause) {
            await ctx.reply('Смена на паузе')
            return ctx.wizard.selectStep(2)
        }

        await ctx.answerCbQuery()

        if(ctx.scene.session.taskMessage){
            await ctx.deleteMessage(ctx.scene.session.taskMessage)
            ctx.scene.session.taskMessage = 0
        }
        if(ctx.scene.session.lastMessage){
            await ctx.deleteMessage(ctx.scene.session.lastMessage)
            ctx.scene.session.lastMessage = 0
        }


        const ref = db.collection('users').doc(ctx.from!.id.toString()).collection('data').doc('tasks')
        ctx.scene.session.tasks = []
        await ref.get().then(snap => {
            const data = snap.data()
            for (let key in data) {
                ctx.scene.session.tasks.push(data[key])
            }
        })

        const user = await getUser(ctx.from!.id.toString())
        ctx.scene.session.name = user.name
        ctx.scene.session.table = user.table

        const message = await ctx.reply('Выберите задачу из списка или просто напишите её сообщением', Markup.inlineKeyboard(makeButtons(ctx.scene.session.tasks)))

        const dayRef = getDayRef(id, ctx.scene.session.day)

        if (ctx.scene.session.currentTask) {

            const task = ctx.scene.session.tasks[+ctx.match[0]]

            await updateTask(id, ctx.scene.session.currentTask?.column, ctx.scene.session.table,  ctx.scene.session.taskStart)
            const endTime = new Date()
            await dayRef.update('tasks', FieldValue.arrayUnion({
                end: endTime.toLocaleString().replace(/,/, ''),
                name: ctx.scene.session.currentTask.name,
                start: ctx.scene.session.taskStart.toLocaleString().replace(/,/, ''),
                time: dateString(+endTime - +ctx.scene.session.taskStart)
            }))

            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name,ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }



        }

        if (!ctx.scene.session.currentTask) {
            const task = ctx.scene.session.tasks[+ctx.match[0]]
            ctx.scene.session.taskStart = new Date()
            const column = await appendTask(id, task, ctx.scene.session.name, ctx.scene.session.table,  ctx.scene.session.taskStart)
            if (column) {
                ctx.scene.session.currentTask = {
                    name: task,
                    column,
                }
                const taskMessage = await ctx.reply(`Сейчас выполняется задача: ${ctx.scene.session.currentTask.name}`)
                ctx.scene.session.taskMessage = taskMessage.message_id
            }


        }
        await session.update({
            endMessage: ctx.scene.session.endMessage,
            lastMessage: ctx.scene.session.lastMessage,
            pauseTime: ctx.scene.session.pauseTime,
            column: ctx.scene.session.column,
            currentTask: ctx.scene.session.currentTask,
            pauseStart: ctx.scene.session.pauseStart,
            pauseMsg: ctx.scene.session.pauseMsg,
            pauseToString: ctx.scene.session.pauseToString,
            taskMessage: ctx.scene.session.taskMessage,
            taskStart: ctx.scene.session.taskStart,
        })
        ctx.scene.session.lastMessage = message.message_id
        return ctx.wizard.selectStep(1)
    }
    catch (err) {
        console.log(err)
    }
})
