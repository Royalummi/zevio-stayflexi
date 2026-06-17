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

        // ── Channel Manager (StayFlexi XML Integration) ─────
        // Set these values on the VPS before running pm2 start.
        // Do NOT commit real secrets to the repository.
        //
        // CHANNEL_MANAGER_ENABLED        — master on/off switch (true | false)
        // CHANNEL_MANAGER_ALLOWED_PROVIDERS — comma-separated list of active provider keys
        // CHANNEL_MANAGER_ALLOWED_IPS    — comma-separated StayFlexi IP allowlist; leave
        //                                  empty ("") to skip the IP check during onboarding
        // CHANNEL_MANAGER_DEFAULT_TIMEOUT_MS — outbound HTTP timeout in ms (default 10000)
        //
        // Per-provider settings (replace STAYFLEXI token as needed):
        // CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENABLED         — enable this provider
        // CHANNEL_MANAGER_PROVIDER_STAYFLEXI_SHARED_SECRET   — inbound webhook shared secret
        //                                                       (provided by StayFlexi)
        // CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENDPOINT        — StayFlexi PushBooking URL
        //                                                       (provided by StayFlexi)
        // CHANNEL_MANAGER_PROVIDER_STAYFLEXI_USERNAME        — HTTP Basic username (if used)
        // CHANNEL_MANAGER_PROVIDER_STAYFLEXI_PASSWORD        — HTTP Basic password (if used)
        // CHANNEL_MANAGER_PROVIDER_STAYFLEXI_OUTBOUND_ENABLED— enable outbound PushBooking

        CHANNEL_MANAGER_ENABLED: "true",
        CHANNEL_MANAGER_ALLOWED_PROVIDERS: "stayflexi",
        CHANNEL_MANAGER_ALLOWED_IPS: "",
        CHANNEL_MANAGER_DEFAULT_TIMEOUT_MS: "10000",

        CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENABLED: "true",
        CHANNEL_MANAGER_PROVIDER_STAYFLEXI_SHARED_SECRET:
          "REPLACE_WITH_STAYFLEXI_INBOUND_SECRET",
        CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENDPOINT:
          "REPLACE_WITH_STAYFLEXI_PUSH_BOOKING_URL",
        CHANNEL_MANAGER_PROVIDER_STAYFLEXI_USERNAME: "",
        CHANNEL_MANAGER_PROVIDER_STAYFLEXI_PASSWORD: "",
        CHANNEL_MANAGER_PROVIDER_STAYFLEXI_OUTBOUND_ENABLED: "true",

        ENABLE_CRON_JOBS: "true",
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
