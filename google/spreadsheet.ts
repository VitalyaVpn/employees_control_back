import {google, sheets_v4, Auth} from 'googleapis'


export const accessSpreadSheet = async (type: string, id: number, range: string, task?:string, column?: number | string) => {
    const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
        keyFile: 'google/credentials.json',
        scopes: 'https://www.googleapis.com/auth/spreadsheets'
    })

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


    // const metaData = await sheet.spreadsheets.get({
    //     auth,
    //     spreadsheetId: process.env.SPREADSHEET_ID
    //
    // })

    // const getRows = await sheet.spreadsheets.values.get({
    //     auth,
    //     spreadsheetId: process.env.SPREADSHEET_ID,
    //     range: 'Смены'
    // })






}

