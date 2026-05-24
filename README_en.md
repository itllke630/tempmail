<div align="center">
  <h1>TempMail</h1>
  <p>Temporary email service built with Cloudflare Email Worker.</p>
</div>

## Features

- 🎯 Privacy-friendly, no registration required, out-of-the-box
- ✈️ Support email sending and receiving
- ✨ Support saving passwords and retrieving email addresses
- 😄 Support multiple domain name suffixes with per-domain TTL
- 🔌 **Open RESTful API**, support programmatic access
- 🌓 Light/Dark mode
- 🌍 12 languages i18n
- 🔐 OTP verification code extraction
- 🚀 100% open source, quick deployment, pure Cloudflare solution, no server required

Principles:

- Receiving emails (Cloudflare Email Worker)
- Display email (Vite + React on Cloudflare Pages)
- Mail Storage (Cloudflare D1)
- Send email using MailChannels API

## 📖 API Documentation

TempMail provides a complete RESTful API for programmatic access to create temporary mailboxes and query inboxes.

### Get API Key

You can generate an API Key via the admin endpoint using the site password:

```bash
curl -X POST https://your-domain.com/api/admin/generate-key \
  -H "Content-Type: application/json" \
  -d '{"password": "your-admin-password", "name": "my-key"}'
```

> Note: The admin endpoint requires the `PASSWORD` environment variable to be set.

### API Endpoints

| Method   | Endpoint                              | Description              |
| -------- | ------------------------------------- | ------------------------ |
| `POST`   | `/v1/mail`                            | Create temporary mailbox |
| `GET`    | `/v1/mail/:id`                        | Get mailbox information  |
| `GET`    | `/v1/mail/:id/messages`               | Get inbox (paginated)    |
| `GET`    | `/v1/mail/:id/messages/:messageId`    | Get message details      |
| `DELETE` | `/v1/mail/:id/messages/:messageId`    | Delete message           |

> Legacy path `/api/v1/mailboxes` is still supported for backward compatibility.

### Quick Start

```bash
# 1. Create temporary mailbox
curl -X POST https://your-domain.com/v1/mail \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# Response: { "data": { "id": "abc123", "address": "random@domain.com", ... } }

# 2. Query inbox
curl https://your-domain.com/v1/mail/abc123/messages \
  -H "X-API-Key: your-api-key"

# 3. Get message details
curl https://your-domain.com/v1/mail/abc123/messages/msg_001 \
  -H "X-API-Key: your-api-key"
```

## Self-hosted Tutorial

This project is now fully based on Cloudflare Pages and Cloudflare D1, which greatly simplifies the deployment process. All you need is a domain name hosted on Cloudflare.

### Requirements

- [Cloudflare](https://dash.cloudflare.com/) account and a domain name hosted on Cloudflare
- Local installation of [Node.js](https://nodejs.org) (version >= 18.x) and [pnpm](https://pnpm.io/installation)

### Automatic Deployment (Recommended)

This project includes a pre-configured GitHub Action workflow to help you automatically deploy the TempMail application to Cloudflare.

For detailed steps, please refer to the [GitHub Action Auto-Deployment Tutorial](/docs/github-action-tutorial.md).

### Manual Deployment Steps

2.  **Create a Cloudflare D1 Database**
    Create a D1 database in the Cloudflare dashboard or using the Wrangler CLI.

3.  **Configure `wrangler.toml`**
    Replace the `${...}` placeholders in the `wrangler.toml` file in the root directory with your Cloudflare and D1 configuration information. You can also set these values through environment variables in Cloudflare Pages.

4.  **Build and Deploy**
    ```bash
    # Build the frontend application
    pnpm run build

    # Deploy to Cloudflare
    pnpm run deploy
    ```
    Wrangler will automatically handle the deployment of frontend static assets and the Worker, and apply database migrations according to the configuration.

5.  **Configure Email Routing Rules**
    In your Cloudflare domain management interface, go to `Email` -> `Email Routing` -> `Routes`, set up a `Catch-all` rule, and set the action to `Send to a Worker`, selecting the Worker you just deployed.

## Local development

1.  **Copy the environment variable file**
    ```bash
    # This command creates a local environment variable file that wrangler dev will load automatically
    cp .env.example .env
    ```

2.  **Fill in local environment variables**
    Fill in the necessary environment variables in the `.env` file, especially `D1_DATABASE_ID`, etc. You need to create a D1 database in Cloudflare for local development first.

3.  **Start the development server**
    ```bash
    pnpm run dev
    ```
    This command starts both the frontend Vite development server and the local Wrangler Worker environment at the same time.

### Environment Variables

When deploying to Cloudflare Pages, you need to configure the following environment variables:

-   `DATABASE_NAME`: Your D1 database name.
-   `DATABASE_ID`: Your D1 database ID.
-   `COOKIES_SECRET`: A secret used to sign cookies.
-   `EMAIL_DOMAIN`: Your email domain, e.g. `example.com,example.net`.
-   `TURNSTILE_KEY`: Your Turnstile site key (optional).
-   `TURNSTILE_SECRET`: Your Turnstile secret key (optional).
-   `PASSWORD`: Site access password (optional, also used for admin API key generation).
-   `API_RATE_LIMIT_PER_MINUTE`: API rate limit per minute (optional, default 100).
-   `SHOW_AFF`: Show promotional placements (optional, `true` to enable, hidden by default).
-   `ENABLE_OPENAPI`: Whether to enable OpenAPI access (optional, enabled by default; set to `false` to disable API key creation and `/v1/*` access).
-   `DOMAIN_TTL_CONFIG`: Per-domain mail retention time in hours (optional, format: `domain=hours,domain=hours`, e.g. `premium.com=720,free.com=24`).

## License

GNU General Public License v3.0
