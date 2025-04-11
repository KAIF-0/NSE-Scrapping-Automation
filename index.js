import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { config } from "dotenv";
import { fetchData } from "./function/fetchData.js";
import { fetchNSEData } from "./function/fetchDatabyApi.js";

config();
const app = new Hono();
const port = process.env.PORT;
const urls = [
  {
    url: process.env.NSE_URL_ADVANCE,
    buttonId: "#Advance-download",
    fileName: "Advance.csv",
    sheetName: "ADVANCE",
  },
  {
    url: process.env.NSE_URL_DECLINE,
    buttonId: "#Decline-download",
    fileName: "Decline.csv",
    sheetName: "EQ(DECLINE)",
  },
];

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    message: "Welcome to the API",
  });
});

app.get("/fetch", async (c) => {
  await fetchData(urls);
  // await fetchNSEData();
  return c.json({
    success: true,
    message: "Data successfully scraped and saved to data.txt",
  });
});

app.onError((err, c) => {
  console.error(err.message);
  return c.json(
    {
      success: false,
      message: "Internal Server Error!",
    },
    500
  );
});

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  () => {
    console.log(`Server is running on port ${port}`);
  }
);
