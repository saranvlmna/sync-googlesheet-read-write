const express = require('express');
const fs = require('fs');
const { google } = require('googleapis');
const app = express();

const TOKEN_PATH = './key-files/token.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

auth = () => {
    const credentials = require('./key-files/credentials.json');
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    return oAuth2Client;
}

getAuthUrl = (oAuth2Client) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    })
    console.log('Authorize this app by visiting this url:', authUrl);
    return;
}

getNewToken = async (code) => {
    const oAuth2Client = await auth()
    oAuth2Client.getToken(code, async (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token', err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
        await listSheetData(oAuth2Client);
    });
}

getSheetData = async () => {
    const AuthClient = await auth();
    fs.readFile(TOKEN_PATH, async (err, token) => {
        if (err) return getAuthUrl(AuthClient);
        AuthClient.setCredentials(JSON.parse(token));
        await listSheetData(AuthClient);
    });
}

listSheetData = (auth) => {
    const sheets = google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({
        spreadsheetId: '1CiTuTDgMPZGXRNwuZFVdoWQ0kahmnIV0F5_Fkfr5FsQ',
        range: 'sheet1',
    },async (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            const result = await convertToJSON(rows);
            console.log(result);

        } else {
            console.log('No data found.');
        }
    });
}

convertToJSON = (array) => {
    var first = array[0].join()
    var headers = first.split(',');

    var jsonData = [];
    for (var i = 1, length = array.length; i < length; i++) {
        var myRow = array[i].join();
        var row = myRow.split(',');
        var data = {};
        for (var x = 0; x < row.length; x++) {
            data[headers[x]] = row[x];
        }
        jsonData.push(data);
    }
    return jsonData;
};

getSheetData()

app.get('/oauth2/callback', async (req, res,) => {
    const code = req.query.code
    await getNewToken(code)
})

const port = 4578

app.listen(port, () => {
    console.log(`Server is running on port ${'http://localhost:' + port}`);
})