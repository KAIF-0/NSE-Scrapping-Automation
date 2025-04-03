import puppeteer from "puppeteer-core";
import chromium from "chromium";
import fs from "fs";

export const scrapeData = async (url) => {
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


    //bypass bot detection/
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    await page.waitForSelector("#table-Advance tbody tr", { timeout: 30_000 });

    const tableData = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tr");
      let data = [];

      rows.forEach((row) => {
        const columns = row.querySelectorAll("td, th");
        let rowData = [];
        columns.forEach((col) => rowData.push(col.innerText.trim()));
        if (rowData.length) data.push(rowData.join("\t"));
      });

      return data;
    });

    console.log(`Data: ${tableData}`);

    if (tableData.length !== 0) {
      fs.writeFileSync("data.txt", tableData.join("\n"), "utf-8");
      console.log("Data saved to data.txt!");
    }

    await browser.close();
  } catch (error) {
    throw new Error(`Error scraping data: ${error.message}`);
  }
};
