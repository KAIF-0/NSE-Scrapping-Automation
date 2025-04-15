import { google, sheets_v4 } from "googleapis";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { config } from "dotenv";
config();

const CREDENTIALS = JSON.parse(process.env.NSE_GOOGLE_SPREADSHEET_CREDENTIALS);
// console.log(CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function uploadCSVToGoogleSheet(
  records,
  spreadsheetId,
  sheetName
) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    console.log(records.length, sheetName);

    const symbols = records
      .slice(1)
      .map((record) => record[0])
      .join(", ");

    //clearing old data
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: await getSheetIdByName(
                  sheets,
                  spreadsheetId,
                  sheetName
                ),
              },
              fields: "*",
            },
          },
        ],
      },
    });

    //all symbols with seperated with commas
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!I1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[symbols]],
      },
    });

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: chunk },
      });
    }

    console.log("CSV Uploaded to Google Sheet successfully!");
  } catch (error) {
    console.error("Error uploading CSV to Google Sheet:", error.message);
  }
}

async function getSheetIdByName(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets.find((s) => s.properties.title === sheetName);
  // console.log(sheet?.properties?.sheetId);
  return sheet?.properties?.sheetId;
}
