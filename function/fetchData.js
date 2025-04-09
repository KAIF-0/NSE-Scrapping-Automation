import puppeteer from "puppeteer-core";
import chromium from "chromium";
import fs from "fs";
import path from "path";
import { uploadCSVToGoogleSheet } from "./csvUpload.js";
import { config } from "dotenv";
config();

const GOOGLE_SHEET_ID = process.env.NSE_GOOGLE_SHEET_ID;

export const fetchData = async (urls) => {
  try {
    for (const singleUrlData of urls) {
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

      //alllow download in download folder
      const downloadPath = path.resolve("./downloads");
      await page._client().send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: downloadPath,
      });

      //bypassing bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      const { url, buttonId, fileName, sheetName } = singleUrlData;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      await page.waitForSelector(`${buttonId}`, { timeout: 60000 });

      //download URL
      const csvUrl = await page.evaluate((btnId) => {
        const csvLink = document.querySelector(`${btnId}`);
        return csvLink ? csvLink.href : null;
      }, buttonId);

      if (csvUrl) {
        console.log(`Downloading CSV from: ${csvUrl}`);

        //click on download button
        await page.click(`${buttonId}`);

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 5000);
        });

        // const path = `./downloads/Advance.csv`;

        await uploadCSVToGoogleSheet(fileName, GOOGLE_SHEET_ID, sheetName);

        //copy the csv file to the data.txt file
        // const csvContent = fs.readFileSync(`./downloads/${fileName}`, "utf-8");
        // console.log(csvContent);
        // fs.appendFileSync("./data.txt", `Data from ${url}:\n${csvContent}\n\n`, "utf-8");
      }

      await browser.close();
    }
  } catch (error) {
    throw new Error(`Error fetching CSV data: ${error.message}`);
  }
};
