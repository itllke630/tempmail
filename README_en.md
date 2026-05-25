<div align="center">
  <h1>TempMail</h1>
  <p>Temporary email service built with Cloudflare Email Worker.</p>
</div>

## Features

- 🎯 Privacy-friendly, no registration required, out-of-the-box
- ✈️ Support email sending and receiving
- ✨ Support saving passwords and retrieving email addresses
- 😄 Support multiple domain name suffixes with per-domain TTL
- 🌓 Light/Dark mode
- 🌍 12 languages i18n
- 🔐 OTP verification code extraction
- 🤖 Telegram Bot notifications for new emails
- 🚀 100% open source, quick deployment, pure Cloudflare solution, no server required

Principles:

- Receiving emails (Cloudflare Email Worker)
- Display email (Vite + React on Cloudflare Pages)
- Mail Storage (Cloudflare D1)
- Send email using MailChannels API

## Self-hosted Tutorial

This project is now fully based on Cloudflare Pages and Cloudflare D1, which greatly simplifies the deployment process. All you need is a domain name hosted on Cloudflare.

### Requirements

- [Cloudflare](https://dash.cloudflare.com/) account and a domain name hosted on Cloudflare
- Local installation of [Node.js](https://nodejs.org) (version >= 18.x) and [pnpm](https://pnpm.io/installation)
- Install Wrangler CLI: `npm install -g wrangler`

### Cloudflare Setup Details

#### 1. Domain DNS Configuration

Ensure your domain is in Cloudflare DNS with proxying enabled (orange cloud icon). Add the following DNS records:

| Type  | Name | Content           | Proxy Status |
| ----- | ---- | ----------------- | ------------ |
| A     | @    | 192.0.2.1         | Proxied      |
| AAAA  | @    | 100::             | Proxied      |
| MX    | @    | your-domain       | DNS Only     |

> **Note**: MX records are required for receiving emails. If using a subdomain (e.g. `mail.example.com`), the subdomain also needs an MX record pointing to itself.

#### 2. Create a Cloudflare D1 Database

**Option A: Via Cloudflare Dashboard**
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to `Workers & Pages` → `D1`
3. Click `Create database`, enter a name (e.g. `tempmail`)
4. After creation, note down the **Database ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Option B: Via Wrangler CLI**
```bash
wrangler d1 create tempmail
```
The output will include `database_id` and `database_name` — record these values.

#### 3. Configure Email Routing

This is the most critical step — misconfiguration will prevent email reception:

1. Log in to Cloudflare Dashboard
2. Select your domain, go to `Email` → `Email Routing`
3. If Email Routing is not enabled, enable it (Cloudflare will auto-verify DNS records)
4. Go to `Routes`, set up a Catch-all rule:
   - Click `Create address`
   - Set Action to `Send to a Worker`
   - Select the deployed `tempmail` Worker
5. **Important**: Ensure MX records point to Cloudflare's mail servers (usually auto-added when enabling Email Routing)

#### 4. Turnstile Configuration (Optional)

To enable CAPTCHA verification:
1. Go to the `Turnstile` page in Cloudflare Dashboard
2. Add a site, select "Managed" widget type
3. Record the `Site Key` and `Secret Key`

#### 5. Telegram Bot Configuration (Optional)

To enable Telegram new-email notifications:
1. Chat with [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot` to create a bot, record the **Bot Token**
3. Set a Bot Username (e.g. `your_tempmail_bot`)
4. After deployment, register the webhook via the admin endpoint:
```bash
curl -X POST https://your-domain.com/api/admin/telegram/setup-webhook \
  -H "Content-Type: application/json" \
  -d '{"password": "your-admin-password"}'
```

### Automatic Deployment (Recommended)

This project includes a pre-configured GitHub Action workflow to help you automatically deploy the TempMail application to Cloudflare.

For detailed steps, please refer to the [GitHub Action Auto-Deployment Tutorial](/docs/github-action-tutorial.md).

### Manual Deployment Steps

1. **Clone the project and install dependencies**
   ```bash
   git clone https://github.com/oiov/vmail.git tempmail
   cd tempmail
   pnpm install
   ```

2. **Create a Cloudflare D1 Database**
   See "Create a Cloudflare D1 Database" section above. Record the database name and ID.

3. **Apply Database Migrations**
   ```bash
   # Local development: apply migrations to local D1
   wrangler d1 migrations apply tempmail --local

   # Production: apply migrations to remote D1
   wrangler d1 migrations apply tempmail --remote
   ```

4. **Configure `wrangler.toml`**
   Replace the `${...}` placeholders in the `wrangler.toml` file with your actual values. Or set them via environment variables (recommended for CI/CD with GitHub Secrets).

   For local development, create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with the required environment variables.

5. **Build and Deploy**
   ```bash
   # Build the frontend application
   pnpm run build

   # Deploy to Cloudflare
   pnpm run deploy
   ```
   Wrangler will automatically handle the deployment of frontend static assets and the Worker, and apply database migrations according to the configuration.

6. **Configure Email Routing Rules**
   See "Configure Email Routing" section above. Ensure the Catch-all rule is set up correctly.

7. **Verify Deployment**
   After deployment, visit your domain — you should see the TempMail homepage.
   - Test receiving: send an email to `anything@your-domain.com`, it should appear on the homepage
   - Check config: visit `https://your-domain.com/config`
   - Check stats: visit `https://your-domain.com/api/stats`

### All Environment Variables

| Variable                   | Required | Description                                                                                          | Example Value                                       |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `EMAIL_DOMAIN`             | Yes      | Email domain, comma-separated for multiple domains                                                   | `tempmail.dev,example.com`                          |
| `COOKIES_SECRET`           | Yes      | Secret for signing cookies, recommended 32+ random characters                                        | `your-strong-random-secret-string`                  |
| `D1_DATABASE_NAME`         | Yes      | D1 database name                                                                                     | `tempmail`                                          |
| `D1_DATABASE_ID`           | Yes      | D1 database ID                                                                                       | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`              |
| `TURNSTILE_KEY`            | No       | Turnstile site key                                                                                   | `1x00000000000000000000AA`                          |
| `TURNSTILE_SECRET`         | No       | Turnstile secret key                                                                                 | `1x0000000000000000000000000000000AA`               |
| `PASSWORD`                 | No       | Site access password. When set, homepage requires unlock. Also used as admin credential for API Key generation. | `my-secret-password`                                |
| `API_RATE_LIMIT_PER_MINUTE`| No       | API rate limit per minute, defaults to `100`                                                         | `100`                                               |
| `ENABLE_OPENAPI`           | No       | Whether to enable OpenAPI access. Defaults to enabled. Set to `false` to disable API Key creation and `/v1/*` access. | `true` / `false`                                    |
| `SHOW_AFF`                 | No       | Show promotional placements. Set to `true` to enable.                                                | `true` / `false`                                    |
| `DOMAIN_TTL_CONFIG`        | No       | Per-domain mail retention time in hours. Format: `domain=hours,domain=hours`. Unconfigured domains default to 24 hours. | `premium.com=720,free.com=24`                       |
| `TEAM_DOMAINS`             | No       | Team-only domains, comma-separated. These won't be shown in the public domain list.                  | `internal.company.com`                              |
| `TELEGRAM_BOT_TOKEN`       | No       | Telegram Bot Token (from @BotFather)                                                                 | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`        |
| `TELEGRAM_BOT_USERNAME`    | No       | Telegram Bot username (without @)                                                                    | `your_tempmail_bot`                                 |
| `TELEGRAM_WEBHOOK_SECRET`  | No       | Telegram Webhook secret for validating incoming requests from Telegram                                | `random-secret-webhook-token`                       |
| `AD_TOP_HTML`              | No       | Top banner ad HTML code                                                                              | `<div>...</div>`                                    |
| `AD_LEFT_HTML`             | No       | Left sidebar ad HTML code                                                                            | `<div>...</div>`                                    |
| `AD_RIGHT_HTML`            | No       | Right sidebar ad HTML code                                                                           | `<div>...</div>`                                    |
| `AD_INFEED_HTML`           | No       | In-feed ad HTML code                                                                                 | `<div>...</div>`                                    |

#### Environment Variable Behavior Notes

- **Turnstile**: When either `TURNSTILE_KEY` or `TURNSTILE_SECRET` is missing, both frontend and backend automatically skip CAPTCHA verification.
- **Site Password**: When `PASSWORD` is empty, the site is fully public. When set, users must unlock the site first.
- **API Rate Limiting**: `API_RATE_LIMIT_PER_MINUTE` applies per API Key, per-minute fixed window. Returns `429` when exceeded.
- **OpenAPI Toggle**: When `ENABLE_OPENAPI=false`, both `/api/api-keys` and `/v1/*` return `403 OPENAPI_DISABLED`.
- **Domain TTL**: `DOMAIN_TTL_CONFIG` allows per-domain mail retention settings. Unconfigured domains default to 24 hours.
- **Telegram Bot**: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` must both be set for Telegram subscription options to appear. Webhook registration requires a post-deployment admin API call.

## Local development

1. **Copy the environment variable file**
   ```bash
   cp .env.example .env
   ```

2. **Fill in local environment variables**
   Fill in the necessary environment variables in the `.env` file. Create a D1 database in Cloudflare for local development first, then apply migrations locally:
   ```bash
   wrangler d1 migrations apply tempmail --local
   ```

3. **Start the development server**
   ```bash
   pnpm run dev
   ```
   This command starts both:
   - Frontend Vite dev server (default `http://localhost:5173`)
   - Local Wrangler Worker environment (default `http://127.0.0.1:8787`)

   The frontend auto-proxies `/api` and `/config` requests to the local Worker.

## Project Structure

```
tempmail/
├── worker/                 # Cloudflare Worker (backend)
│   ├── src/
│   │   ├── index.ts        # Worker main entry point
│   │   ├── api/v1/         # RESTful API routes
│   │   ├── database/       # D1 database layer (Drizzle ORM)
│   │   ├── telegram/       # Telegram Bot logic
│   │   ├── openapi.ts      # OpenAPI enable/disable control
│   │   └── utils.ts        # Encryption/decryption utilities
│   └── drizzle/            # D1 database migration files
├── frontend/               # Frontend (Vite + React + TailwindCSS)
│   └── src/
│       ├── components/     # UI components
│       ├── pages/          # Pages
│       ├── services/       # API service layer
│       └── lib/            # Utility library
├── wrangler.toml           # Cloudflare deployment configuration
├── pnpm-workspace.yaml     # pnpm monorepo configuration
├── Dockerfile              # Docker build file
└── .github/workflows/      # GitHub Actions CI/CD
```

## Database

The project uses Cloudflare D1 as the database, managed through Drizzle ORM.

Tables:
- `emails` — email data, indexed on `(message_to, created_at)`
- `api_keys` — API key management
- `mailboxes` — mailbox records
- `site_stats` — cumulative site statistics
- `daily_stats` — daily statistics
- `api_rate_limits` — API rate limiting, composite primary key `(api_key_id, window_start_epoch_sec)`
- `telegram_subscriptions` — Telegram notification subscriptions

### Scheduled Cleanup

The Worker runs a Cron job every hour (`0 * * * *`) to automatically clean up expired emails. Cleanup logic respects `DOMAIN_TTL_CONFIG` per domain, with unconfigured domains defaulting to 24 hours retention.

## Troubleshooting

**Q: Emails are not received after deployment?**
A: Check the following:
1. Whether MX records exist in DNS and point to Cloudflare mail servers
2. Whether Email Routing is enabled
3. Whether the Catch-all route is correctly set to the `tempmail` Worker
4. Worker logs for errors (`wrangler tail`)

**Q: Site is always locked / cannot unlock?**
A: Check if the `PASSWORD` environment variable is set. Browser cookies are cleared after reset — re-unlock will be needed.

**Q: Database migration fails?**
A: Check:
1. `D1_DATABASE_ID` in `wrangler.toml` is correct
2. `migrations_dir` points to `worker/drizzle`
3. Migration files are complete (all incremental SQL files must be present)

**Q: Frontend shows 404 after build?**
A: Verify that `assets.directory` in `wrangler.toml` points to `frontend/build/client` and that `outDir` in `vite.config.ts` matches.

**Q: How to rollback?**
A:
1. Rollback Worker: Cloudflare Dashboard → Workers & Pages → tempmail → Deployments, select and rollback to a previous version
2. Rollback database: D1 does not support automatic rollback. Create a reverse migration SQL or restore a D1 backup.

**Q: Telegram Bot doesn't send notifications?**
A:
1. Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` are both set
2. Call `/api/admin/telegram/setup-webhook` after deployment to register the webhook
3. Users must send `/start email@domain.com` in the bot to subscribe

## License

GNU General Public License v3.0
