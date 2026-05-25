<div align="center">
  <a href="https://trendshift.io/repositories/8681" target="_blank"><img src="https://trendshift.io/api/badge/repositories/8681" alt="yesmore%2Fvmail | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
  <h1>TempMail</h1>
  <p><a href="/docs/github-action-tutorial.md">部署教程</a>  ·  <a href="/docs/ai-deploy.md">AI帮你部署</a>
  <p>使用 Cloudflare Email Worker 实现的临时电子邮件服务</p>
</div>

## 特点

- 🎯 隐私友好，无需注册，开箱即用
- ✈️ 支持邮件收发
- ✨ 支持保存密码，找回邮箱
- 😄 支持多域名后缀，支持按域名独立配置 TTL
- 🌓 亮色/暗色双模式
- 🌍 12 种语言国际化
- 🔐 支持 OTP 验证码提取
- 🤖 支持 Telegram Bot 新邮件通知
- 🚀 快速部署，纯 Cloudflare 方案，无需服务器

原理：

- Email worker 接收电子邮件
- 前端 (Vite + React) 显示电子邮件
- 邮件存储 (Cloudflare D1)
- 发信使用 MailChannels API

## 👋 自部署教程

本项目已完全基于 Cloudflare Pages 和 Cloudflare D1 构建，大大简化了部署流程。您只需要一个托管在 Cloudflare 上的域名即可。

### 准备工作

- [Cloudflare](https://dash.cloudflare.com/) 账户与托管在 Cloudflare 上的域名
- 本地安装 [Node.js](https://nodejs.org) 环境 (版本 >= 18.x) 和 [pnpm](https://pnpm.io/installation)
- 安装 Wrangler CLI: `npm install -g wrangler`

### Cloudflare 设置细节

#### 1. 域名 DNS 配置

确保你的域名在 Cloudflare DNS 中，并开启代理（橙色云朵图标）。需要在 DNS 中添加以下记录：

| 类型  | 名称 | 内容               | 代理状态 |
| ----- | ---- | ------------------ | -------- |
| A     | @    | 192.0.2.1          | 开启     |
| AAAA  | @    | 100::              | 开启     |
| MX    | @    | 你的域名           | 仅 DNS   |

> **注意**: MX 记录必须存在才能接收邮件。如果使用子域名（如 `mail.example.com`），子域名也需要配置 MX 记录指向自身。

#### 2. 创建 Cloudflare D1 数据库

**方式一：通过 Cloudflare 控制台**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `Workers & Pages` → `D1`
3. 点击 `Create database`，填写数据库名称（如 `tempmail`）
4. 创建后记下 **Database ID**（格式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

**方式二：通过 Wrangler CLI**
```bash
wrangler d1 create tempmail
```
命令输出会返回 `database_id` 和 `database_name`，记录下来。

#### 3. 配置 Email Routing

这是最关键的一步，配置错误将无法接收邮件：

1. 登录 Cloudflare 控制台
2. 选择你的域名，进入 `Email` → `Email Routing`
3. 如果尚未启用 Email Routing，先开启（需要验证 DNS 记录，Cloudflare 会自动添加）
4. 进入 `Routes`，设置 Catch-all 规则：
   - 点击 `Create address`
   - Action 选择 `Send to a Worker`
   - Worker 选择你部署的 `tempmail` Worker
5. **重要**: 确保 MX 记录指向 Cloudflare 的邮件服务器（开启 Email Routing 时通常自动添加）

#### 4. Turnstile 验证配置（可选）

如果要启用人机验证：
1. 进入 `Turnstile` 页面
2. 添加站点，选择 Widget 类型为"托管"
3. 记录 `Site Key` 和 `Secret Key`

#### 5. Telegram Bot 配置（可选）

如果要启用 Telegram 新邮件通知：
1. 在 Telegram 中与 [@BotFather](https://t.me/BotFather) 对话
2. 发送 `/newbot` 创建机器人，记录获得的 **Bot Token**
3. 设置 Bot Username（如 `your_tempmail_bot`）
4. 部署后，通过管理员接口注册 Webhook：
```bash
curl -X POST https://your-domain.com/api/admin/telegram/setup-webhook \
  -H "Content-Type: application/json" \
  -d '{"password": "your-admin-password"}'
```

### 自动部署 (推荐)

本项目已包含一个预先配置好的 GitHub Action 工作流，可以帮助您自动将 TempMail 应用部署到 Cloudflare。

详细步骤请参考 [GitHub Action 自动部署教程](/docs/github-action-tutorial.md)。

### 手动部署步骤

1. **克隆项目并安装依赖**
   ```bash
   git clone https://github.com/oiov/vmail.git tempmail
   cd tempmail
   pnpm install
   ```

2. **创建 Cloudflare D1 数据库**
   参考上文"创建 Cloudflare D1 数据库"部分。完成后记下数据库名称和 ID。

3. **执行数据库迁移**
   ```bash
   # 本地开发: 将迁移应用到本地 D1
   wrangler d1 migrations apply tempmail --local

   # 生产环境: 将迁移应用到远程 D1
   wrangler d1 migrations apply tempmail --remote
   ```

4. **配置 `wrangler.toml`**
   将根目录下的 `wrangler.toml` 文件中的 `${...}` 占位符替换为实际值。或者通过环境变量设置（推荐在 CI/CD 中使用 GitHub Secrets）。

   本地开发可以创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```
   然后编辑 `.env` 填入必要的环境变量。

5. **构建和部署**
   ```bash
   # 构建前端应用
   pnpm run build

   # 部署到 Cloudflare
   pnpm run deploy
   ```
   Wrangler 将会自动处理前端静态资源和 Worker 的部署，并根据配置应用数据库迁移。

6. **配置电子邮件路由**
   参考上文"配置 Email Routing"部分，确保 Catch-all 规则已设置。

7. **验证部署**
   部署成功后，访问你的域名，应该能看到 TempMail 的主页。
   - 测试收邮件: 向 `anything@your-domain.com` 发送邮件，应在主页中收到
   - 检查配置: 访问 `https://your-domain.com/config` 查看配置是否正确
   - 检查统计: 访问 `https://your-domain.com/api/stats` 查看统计数据

### 全部环境变量

| 变量名                     | 必填 | 说明                                                                                     | 示例值                                              |
| -------------------------- | ---- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `EMAIL_DOMAIN`             | 是   | 邮箱域名，多个域名用逗号分隔                                                             | `tempmail.dev,example.com`                          |
| `COOKIES_SECRET`           | 是   | 用于签名 Cookie 的密钥，建议 32+ 位随机字符串                                            | `your-strong-random-secret-string`                  |
| `D1_DATABASE_NAME`         | 是   | D1 数据库名称                                                                            | `tempmail`                                          |
| `D1_DATABASE_ID`           | 是   | D1 数据库 ID                                                                             | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`              |
| `TURNSTILE_KEY`            | 否   | Turnstile 站点密钥 (Site Key)                                                            | `1x00000000000000000000AA`                          |
| `TURNSTILE_SECRET`         | 否   | Turnstile 密钥 (Secret Key)                                                              | `1x0000000000000000000000000000000AA`               |
| `PASSWORD`                 | 否   | 站点访问密码，设置后首页需要密码解锁。同时也是管理员 API Key 生成的验证凭据              | `my-secret-password`                                |
| `API_RATE_LIMIT_PER_MINUTE`| 否   | API 每分钟请求限制，默认为 `100`                                                         | `100`                                               |
| `ENABLE_OPENAPI`           | 否   | 是否开启 OpenAPI 调用功能，默认开启。设置为 `false` 时禁用 API Key 创建与 `/v1/*` 调用   | `true` / `false`                                    |
| `SHOW_AFF`                 | 否   | 是否展示推广位，设置为 `true` 开启                                                       | `true` / `false`                                    |
| `DOMAIN_TTL_CONFIG`        | 否   | 按域名配置邮件保留时间（小时），格式: `domain=hours,domain=hours`。未配置的域名默认 24 小时 | `premium.com=720,free.com=24`                       |
| `TEAM_DOMAINS`             | 否   | 团队专属域名，逗号分隔。这些域名不会在公开域名列表中显示                                 | `internal.company.com`                              |
| `TELEGRAM_BOT_TOKEN`       | 否   | Telegram Bot Token（从 @BotFather 获取）                                                 | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`        |
| `TELEGRAM_BOT_USERNAME`    | 否   | Telegram Bot 用户名（不含 @）                                                            | `your_tempmail_bot`                                 |
| `TELEGRAM_WEBHOOK_SECRET`  | 否   | Telegram Webhook 密钥，用于验证来自 Telegram 的请求                                      | `random-secret-webhook-token`                       |
| `AD_TOP_HTML`              | 否   | 页面顶部广告 HTML 代码                                                                   | `<div>...</div>`                                    |
| `AD_LEFT_HTML`             | 否   | 页面左侧广告 HTML 代码                                                                   | `<div>...</div>`                                    |
| `AD_RIGHT_HTML`            | 否   | 页面右侧广告 HTML 代码                                                                   | `<div>...</div>`                                    |
| `AD_INFEED_HTML`           | 否   | 信息流中广告 HTML 代码                                                                   | `<div>...</div>`                                    |

#### 环境变量行为说明

- **Turnstile**: 当 `TURNSTILE_KEY` 和 `TURNSTILE_SECRET` 任一缺失时，前后端都自动进入"无需人机验证"模式。
- **站点密码**: `PASSWORD` 为空时，前端不会出现站点解锁门禁；有值时需要先解锁站点。
- **API 限速**: `API_RATE_LIMIT_PER_MINUTE` 按"每个 API Key、每分钟固定窗口"限流。超过限制返回 `429`。
- **OpenAPI 开关**: 当 `ENABLE_OPENAPI=false` 时，`/api/api-keys` 和 `/v1/*` 统一返回 `403 OPENAPI_DISABLED`。
- **域名 TTL**: `DOMAIN_TTL_CONFIG` 允许不同域名设置不同的邮件保留时间。未配置的域名默认保留 24 小时。
- **Telegram Bot**: 仅配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_BOT_USERNAME` 后，用户才能在域名邮箱页面看到 Telegram 通知订阅选项。Webhook 需要部署后通过管理接口注册。

## 🔨 本地运行调试

1. **复制环境变量文件**
   ```bash
   cp .env.example .env
   ```

2. **填写本地环境变量**
   在 `.env` 文件中填写必要的环境变量。你需要先在 Cloudflare 创建一个 D1 数据库用于本地开发，然后在本地执行迁移：
   ```bash
   wrangler d1 migrations apply tempmail --local
   ```

3. **启动开发服务器**
   ```bash
   pnpm run dev
   ```
   该命令会同时启动：
   - 前端 Vite 开发服务器 (默认 `http://localhost:5173`)
   - 本地 Wrangler Worker 环境 (默认 `http://127.0.0.1:8787`)

   前端会自动代理 `/api` 和 `/config` 请求到本地 Worker。

## 📁 项目结构

```
tempmail/
├── worker/                 # Cloudflare Worker (后端)
│   ├── src/
│   │   ├── index.ts        # Worker 主入口
│   │   ├── api/v1/         # RESTful API 路由
│   │   ├── database/       # D1 数据库层 (Drizzle ORM)
│   │   ├── telegram/       # Telegram Bot 逻辑
│   │   ├── openapi.ts      # OpenAPI 开关控制
│   │   └── utils.ts        # 加解密工具
│   └── drizzle/            # D1 数据库迁移文件
├── frontend/               # 前端 (Vite + React + TailwindCSS)
│   └── src/
│       ├── components/     # UI 组件
│       ├── pages/          # 页面
│       ├── services/       # API 服务层
│       └── lib/            # 工具库
├── wrangler.toml           # Cloudflare 部署配置
├── pnpm-workspace.yaml     # pnpm monorepo 配置
├── Dockerfile              # Docker 构建文件
└── .github/workflows/      # GitHub Actions CI/CD
```

## 🗄️ 数据库

项目使用 Cloudflare D1 作为数据库，通过 Drizzle ORM 管理。

数据库表：
- `emails` — 邮件数据，按 `(message_to, created_at)` 建立索引
- `api_keys` — API 密钥管理
- `mailboxes` — 邮箱记录
- `site_stats` — 站点累计统计数据
- `daily_stats` — 每日统计数据
- `api_rate_limits` — API 速率限制，复合主键 `(api_key_id, window_start_epoch_sec)`
- `telegram_subscriptions` — Telegram 通知订阅

### 定时清理

Worker 配置了每小时运行的 Cron 任务 (`0 * * * *`)，自动清理过期邮件。清理逻辑根据 `DOMAIN_TTL_CONFIG` 按域名分别处理，未配置的域名默认保留 24 小时。

## ❓ 常见问题

**Q: 部署后无法接收邮件？**
A: 检查以下项目：
1. DNS 中 MX 记录是否存在且指向 Cloudflare 邮件服务器
2. Email Routing 是否已开启
3. Catch-all 路由是否正确设置到 `tempmail` Worker
4. Worker 日志中是否有错误信息 (`wrangler tail`)

**Q: 站点一直锁定/无法解锁？**
A: 检查 `PASSWORD` 环境变量是否设置。浏览器 Cookie 被清除后需要重新解锁。

**Q: 数据库迁移失败？**
A: 检查:
1. `wrangler.toml` 中的 `D1_DATABASE_ID` 是否正确
2. `migrations_dir` 路径是否指向 `worker/drizzle`
3. 迁移文件是否完整（必须包含所有增量 SQL 文件）

**Q: 前端构建后页面 404？**
A: 检查 `wrangler.toml` 中 `assets.directory` 是否指向 `frontend/build/client`，以及 `vite.config.ts` 中 `outDir` 是否一致。

**Q: 如何回滚？**
A:
1. 回滚 Worker: 在 Cloudflare Dashboard → Workers & Pages → tempmail → Deployments 中选择旧版本回滚
2. 回滚数据库: D1 不支持自动回滚，需要通过逆向迁移 SQL 或恢复 D1 备份

**Q: Telegram Bot 不发送通知？**
A:
1. 确保 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_BOT_USERNAME` 已设置
2. 部署后调用 `/api/admin/telegram/setup-webhook` 注册 Webhook
3. 用户需要在 Bot 中发送 `/start email@domain.com` 订阅

## 📝 License

GNU General Public License v3.0
