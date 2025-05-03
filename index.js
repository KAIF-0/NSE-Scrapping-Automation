import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { config } from "dotenv";
import { fetchData } from "./function/fetchData.js";
import { urlData } from "./function/getUrlData.js";

config();
const app = new Hono();
const port = process.env.PORT;

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    message: "Welcome to the API",
  });
});

app.get("/fetch", async (c) => {
  const day = new Date().toLocaleString("en-US", { weekday: "long" });
  const urls = await urlData(day);
  console.log(urls);
  if (day === "Saturday" || day === "Sunday") {
    return c.json({
      success: false,
      message: "Data is not available on weekends",
    });
  }
  await fetchData(urls).catch((err) => {
    console.log(err.message);
    process.exit(1);
  });
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
