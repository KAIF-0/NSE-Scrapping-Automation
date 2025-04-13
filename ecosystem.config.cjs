module.exports = {
  apps: [
    {
      name: "NSE-Automation",
      script: "./index.js",
      instances: 2,
      cron_restart: "0 */2 * * *",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
