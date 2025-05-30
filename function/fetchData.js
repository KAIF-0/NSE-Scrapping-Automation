import puppeteer from "puppeteer-core";
import chromium from "chromium";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { uploadCSVToGoogleSheet } from "./csvUpload.js";
import { config } from "dotenv";
config();

const GOOGLE_SHEET_ID = process.env.NSE_GOOGLE_SHEET_ID;

const filterCSVData = async (rows, fileName) => {
  // console.log(rows, fileName);
  if (fileName.split(".")[0].toLowerCase().includes("decline")) {
    return await rows.filter((row) => {
      const change = parseFloat(row["%chng "]);
      const series = row["Series "];
      return series.includes("EQ") && change < -8;
    });
  }

  if (fileName.split(".")[0].toLowerCase().includes("advance")) {
    return await rows.filter((row) => {
      const change = parseFloat(row["%chng "]);
      const series = row["Series "];
      if (!change || isNaN(change)) return false;

      return (
        (series === "EQ" && change > 4) ||
        (["BE", "SM", "ST"].includes(series) && change > 4)
      );
    });
  }

  return rows;
};

export const fetchData = async (urls) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: chromium.path,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      protocolTimeout: 300000,
    });

    const page = await browser.newPage();

    const downloadPath = path.resolve("./downloads");
    await page._client().send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    //clearing files to prevent
    await clearCsvFiles();

    for (const singleUrlData of urls) {
      const { url, buttonId, fileName, sheetName } = singleUrlData;

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      await page.waitForSelector(`${buttonId}`, { timeout: 60000 });

      const csvUrl = await page.evaluate((btnId) => {
        const csvLink = document.querySelector(`${btnId}`);
        return csvLink ? csvLink.href : null;
      }, buttonId);
      if (csvUrl) {
        console.log(`Downloading CSV from: ${csvUrl}`);
        await page.click(`${buttonId}`);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const filePath = path.join(downloadPath, fileName);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
        });

        const filteredData = await filterCSVData(records, fileName);
        // console.log(filteredData);

        //writing filtered data back to file
        if (filteredData.length !== 0) {
          if (fileName.split(".")[0] === "Advance") {
            for (const name of sheetName) {
              const data = await filteredData.filter((row) => {
                const change = parseFloat(row["%chng "]);
                const series = row["Series "];
                if (!change || isNaN(change)) return false;

                return name.includes("EQ")
                  ? series === "EQ" && change > 4
                  : ["BE", "SM", "ST"].includes(series) && change > 4;
              });
              const headers = Object.keys(data[0]);
              const values = data.map((row) => headers.map((key) => row[key]));

              const finalData = [headers, ...values];
              await uploadCSVToGoogleSheet(finalData, GOOGLE_SHEET_ID, name);
            }
          } else {
            const headers = Object.keys(filteredData[0]);
            const values = filteredData.map((row) =>
              headers.map((key) => row[key])
            );

            const finalData = [headers, ...values];
            await uploadCSVToGoogleSheet(finalData, GOOGLE_SHEET_ID, sheetName);
          }
        }
      }
    }
    await browser.close();
  } catch (error) {
    throw new Error(`Error fetching CSV data: ${error.message}`);
  }
};

const clearCsvFiles = async () => {
  const downloadPath = path.join(process.cwd(), "downloads");

  try {
    const files = fs.readdirSync(downloadPath);
    // console.log(files);

    for (const file of files) {
      if (file.endsWith(".csv")) {
        const filePath = path.join(downloadPath, file);
        fs.writeFileSync(filePath, "", "utf-8");
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
