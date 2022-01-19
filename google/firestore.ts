import { initializeApp, cert  } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from "dotenv"
dotenv.config()


initializeApp({
    credential: cert('google/secret.json')
})

export const db = getFirestore()

export const getCol = (id:string):Promise<boolean> => {
    return new Promise<any>(async(res, rej) => {
        let user = false
        const collection = db.collection('users')
        const doc = await collection.get()
        if (!doc){
            rej(new Error('Collection not created'))
        }
        doc.forEach((snap)=>{
            if (snap.id === id) user = true
        })
        res(user)
    })

}

export const getDay = (id:number, day:string):Promise<boolean> => {
    return new Promise<any>(async (res, rej) => {
        let end = true
        const  dayRef = getDayRef(id, day)

        await dayRef.get().then((snap)=>{
            if (snap.data()!.end === '0') {
                end = false
            }
        }).catch((err)=>{
            rej(err)
        })
        res(end)
    })
}

export const getUser = (id:string) => {
    return new Promise<any>(async(res, rej) => {
        const document = db.collection('users').doc(id)
        const doc = await document.get()
        if (!doc) {
            rej(new Error('Сотрудника не существует'))
        }
        res(doc.data())
    })

}

export const getPause = (id:number):Promise<boolean> => {

    return new Promise(async (res, rej) => {
        let pause = false
        const session = getSessionRef(id)
        await session.get().then((snap) => {
            if (snap.data()!.pauseStart) {
                pause = true
            }
        }).catch((err) => {
            rej(err)
        })
        res(pause)
    })
}

export const getDayRef = (id:number, day: string) => {
    return db.collection('users').doc(id.toString()).collection('workingday').doc(day)
}
export const getSessionRef = (id:number) => {
    return db.collection('users').doc(id.toString()).collection('data').doc('session')
}