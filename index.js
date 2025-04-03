import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { config } from "dotenv";
import { scrapeData } from "./function/scrapeData.js";

config();
const app = new Hono();
const port = process.env.PORT;
const url = process.env.NSE_URL;

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    message: "Welcome to the API",
  });
});

app.get("/fetch", async (c) => {
  await scrapeData(url);
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
