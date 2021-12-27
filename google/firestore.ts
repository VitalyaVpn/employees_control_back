import { initializeApp, cert  } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from "dotenv"
dotenv.config()


initializeApp({
    credential: cert('google/secret.json')
})

export const db = getFirestore()


export const getData = () => {
    return new Promise<any>(async(res, rej) => {
        const document = db.collection('users').doc('193793853').collection('buttons')
        const doc = await document.get()

        res(doc)
    })

}

export const getCol = (id:string):Promise<boolean> => {
    return new Promise<any>(async(res, rej) => {
        let user = false
        const collection = db.collection('users')
        const doc = await collection.get()
        doc.forEach((snap)=>{
            if (snap.id === id) user = true
        })
        res(user)
    })

}

export const getUser = (id:string) => {
    return new Promise<any>(async(res, rej) => {
        const document = db.collection('users').doc(id)
        const doc = await document.get()

        res(doc.data())
    })

}