import {google, sheets_v4, Auth} from 'googleapis'
import {dateString, getDate} from "../functions";

const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
    keyFile: 'google/credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
})

export const appendTask = async (id: number, task:string, name:string, table:string, time: Date) => {

    try {

        const client = await auth.getClient()
        const {month, date} = getDate()
        const sheet: sheets_v4.Sheets = google.sheets({
            version: 'v4',
            auth: client,
        })

        const query:Array<string|number|Date|undefined> = [id, name, task, month, date, time.toLocaleString().replace(/,/, '')]

        const row = await sheet.spreadsheets.values.append({
            auth,
            spreadsheetId: table,
            range: 'Задачи!A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    query
                ]
            }
        })
        const col:string|undefined = row.data.updates?.updatedRange?.split(':F').pop()
        return col
    }
    catch (err) {
        console.log(err)
    }
}

export const updateTask = async (id: number, column: number | string, table:string, time:Date) => {

    try {
        const client = await auth.getClient()

        const sheet: sheets_v4.Sheets = google.sheets({
            version: 'v4',
            auth: client,
        })
        const endTime = new Date()
        const update = await sheet.spreadsheets.values.update({
            auth,
            spreadsheetId: table,
            valueInputOption: 'USER_ENTERED',
            range: `Задачи!G${column}:H${column}`,
            requestBody: {
                majorDimension: "ROWS",
                values: [
                    [endTime.toLocaleString().replace(/,/, ''), dateString(+endTime-+time)]
                ]
            }
        })

        const col:string|undefined = update.data.updatedRange?.split(':H').pop()
        return col
    }
    catch (err) {
        console.log(err)
    }

}

export const appendShift = async (id: number, name:string, table:string) => {

    try {
        const client = await auth.getClient()
        const {month, date} = getDate()
        const sheet: sheets_v4.Sheets = google.sheets({
            version: 'v4',
            auth: client,
        })
        const query:Array<string|number|Date|undefined> = [id, name, month, date, new Date().toLocaleString().replace(/,/, '')]

        const row = await sheet.spreadsheets.values.append({
            auth,
            spreadsheetId: table,
            range: 'Смены!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    query
                ]
            }
        })

        const col:string|undefined = row.data.updates?.updatedRange?.split(':E').pop()
        return col
    }
    catch (err) {
        console.log(err)
    }

}

export const updateShift = async (id: number, column: number | string, table:string, time:string) => {

    try {
        const client = await auth.getClient()

        const sheet: sheets_v4.Sheets = google.sheets({
            version: 'v4',
            auth: client,
        })

        const update = await sheet.spreadsheets.values.update({
            auth,
            spreadsheetId: table,
            valueInputOption: 'USER_ENTERED',
            range: `Смены!F${column}:G${column}`,
            requestBody: {
                majorDimension: "ROWS",
                values: [
                    [new Date().toLocaleString().replace(/,/, ''), time]
                ]
            }
        })
        const col:string|undefined = update.data.updatedRange?.split(':G').pop()
        return col
    }
    catch (err) {
        console.log(err)
    }
}


