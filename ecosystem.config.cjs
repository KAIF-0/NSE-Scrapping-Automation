module.exports = {
  apps: [
    {
      name: "NSE-Automation",
      script: "./index.js",
      instances: 1,
      // cron_restart: "0 */3 * * *",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
