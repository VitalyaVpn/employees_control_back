import {google, sheets_v4, Auth} from 'googleapis'
import {log} from "util";

const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
    keyFile: 'google/credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
})

export const accessSpreadSheet = async (type: string, id: number, range: string, task?:string, column?: number | string) => {

    const client = await auth.getClient()

    const sheet: sheets_v4.Sheets = google.sheets({
        version: 'v4',
        auth: client,
    })

    const query:Array<string|number|Date|undefined> = range === 'Задачи' ? [id, task, new Date().toLocaleString()] : [id, new Date().toLocaleString()]

    if (type === 'update') {
        const update = await sheet.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SPREADSHEET_ID,
            valueInputOption: 'USER_ENTERED',
            range: range === 'Смены' ? `Смены!C${column}` : `Задачи!D${column}`,
            requestBody: {
                majorDimension: "ROWS",
                values: [
                    [new Date().toLocaleString()]
                ]
            }
        })
        const col:string|undefined = range === 'Смены' ? update.data.updatedRange?.split(':C').pop() : update.data.updatedRange?.split(':D').pop()
        return col
    }

    if (type === 'append') {
        const row = await sheet.spreadsheets.values.append({
            auth,
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: range === 'Смены' ? 'Смены!A:C' :'Задачи!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    query
                ]
            }
        })

        const col:string|undefined = range === 'Смены' ? row.data.updates?.updatedRange?.split(':B').pop() : row.data.updates?.updatedRange?.split(':C').pop()
        return col
    }



}

export const appendTask = async (id: number, task:string) => {

    const client = await auth.getClient()

    const sheet: sheets_v4.Sheets = google.sheets({
        version: 'v4',
        auth: client,
    })

    const query:Array<string|number|Date|undefined> = [id, task, new Date().toLocaleString()]

    const row = await sheet.spreadsheets.values.append({
        auth,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Задачи!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [
                query
            ]
        }
    })

    const col:string|undefined = row.data.updates?.updatedRange?.split(':C').pop()
    return col

}

export const updateTask = async (id: number, column: number | string) => {


    const client = await auth.getClient()

    const sheet: sheets_v4.Sheets = google.sheets({
        version: 'v4',
        auth: client,
    })

    const update = await sheet.spreadsheets.values.update({
        auth,
        spreadsheetId: process.env.SPREADSHEET_ID,
        valueInputOption: 'USER_ENTERED',
        range: `Задачи!D${column}`,
        requestBody: {
            majorDimension: "ROWS",
            values: [
                [new Date().toLocaleString()]
            ]
        }
    })

    const col:string|undefined = update.data.updatedRange?.split(':D').pop()
    return col

}

export const appendShift = async (id: number) => {


    const client = await auth.getClient()

    const sheet: sheets_v4.Sheets = google.sheets({
        version: 'v4',
        auth: client,
    })
    const query:Array<string|number|Date|undefined> = [id, new Date().toLocaleString()]

    const row = await sheet.spreadsheets.values.append({
        auth,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Смены!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [
                query
            ]
        }
    })

    const col:string|undefined = row.data.updates?.updatedRange?.split(':B').pop()
    return col

}

export const updateShift = async (id: number, column: number | string) => {

    const client = await auth.getClient()

    const sheet: sheets_v4.Sheets = google.sheets({
        version: 'v4',
        auth: client,
    })

    const update = await sheet.spreadsheets.values.update({
        auth,
        spreadsheetId: process.env.SPREADSHEET_ID,
        valueInputOption: 'USER_ENTERED',
        range: `Смены!C${column}`,
        requestBody: {
            majorDimension: "ROWS",
            values: [
                [new Date().toLocaleString()]
            ]
        }
    })
    const col:string|undefined = update.data.updatedRange?.split(':C').pop()
    return col

}


