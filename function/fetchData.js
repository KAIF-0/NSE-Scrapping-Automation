import puppeteer from "puppeteer"; 
import fs from "fs";
import path from "path";
import { uploadCSVToGoogleSheet } from "./csvUpload.js";
import { config } from "dotenv";
config();

const GOOGLE_SHEET_ID = process.env.NSE_GOOGLE_SHEET_ID;

function waitForFileToDownload(filePath, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          clearInterval(interval);
          resolve();
        }
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("Download timeout: File was not saved."));
      }
    }, 500);
  });
}

export const fetchData = async (urls) => {
  try {
    for (const singleUrlData of urls) {
      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
        ],
      });

      const page = await browser.newPage();

      const downloadPath = path.resolve("./downloads");
      const cdp = await page.target().createCDPSession();
      await cdp.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: downloadPath,
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      const { url, buttonId, fileName, sheetName } = singleUrlData;
      const filePath = path.join(downloadPath, fileName);

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      await page.waitForSelector(buttonId, { timeout: 60000 });

      // Remove old file if exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const csvUrl = await page.evaluate((btnId) => {
        const csvLink = document.querySelector(btnId);
        return csvLink ? csvLink.href : null;
      }, buttonId);

      if (csvUrl) {
        console.log(`Downloading CSV from: ${csvUrl}`);

        await page.click(buttonId);
        console.log("Waiting for download to complete...");

        await waitForFileToDownload(filePath);
        console.log("Download complete. Uploading to Google Sheets...");

        await uploadCSVToGoogleSheet(fileName, GOOGLE_SHEET_ID, sheetName);
      }

      await browser.close();
    }
  } catch (error) {
    if (error.message.includes("EAGAIN")) {
      console.log("Restarting process due to EAGAIN error...");
      process.exit(1);
    }
    throw new Error(`Error fetching CSV data: ${error.message}`);
  }
};
