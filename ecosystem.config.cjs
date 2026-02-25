// PM2 Process Manager Configuration
// Used to manage Backend and Next.js processes on VPS
// Usage:
//   Start:   pm2 start ecosystem.config.cjs --env production
//   Reload:  pm2 reload all --update-env
//   Status:  pm2 list
//   Logs:    pm2 logs

module.exports = {
  apps: [
    // ── Backend API ────────────────────────────────────────
    {
      name: "backend",
      script: "server.js",
      cwd: "/var/www/zevio/backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/backend-error.log",
      out_file: "/var/log/pm2/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },

    // ── Next.js User App ───────────────────────────────────
    {
      name: "nextjs",
      script: "node_modules/.bin/next",
      args: "start --port 8000",
      cwd: "/var/www/zevio/nextjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/nextjs-error.log",
      out_file: "/var/log/pm2/nextjs-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env_production: {
        NODE_ENV: "production",
        PORT: 8000,
      },
    },
  ],
};
