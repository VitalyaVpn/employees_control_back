import { initializeApp, cert  } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {ServiceAccount} from "firebase-admin";
import * as dotenv from "dotenv"
dotenv.config()

console.log(process.env.PROJECT_ID)

const secret = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY!.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
} as ServiceAccount

initializeApp({
    credential: cert(secret)
})

export const db = getFirestore()


export const getData = async () => {
    const document = db.collection('users').doc('12121').collection('workday')
    const doc = await document.get()
    doc.forEach(dt => {
        console.log(dt.data())
    })

}