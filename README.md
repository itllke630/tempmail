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
- 🔌 **开放 RESTful API**，支持程序化调用
- 🌓 亮色/暗色双模式
- 🌍 12 种语言国际化
- 🔐 支持 OTP 验证码提取
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

### 自动部署 (推荐)

本项目已包含一个预先配置好的 GitHub Action 工作流，可以帮助您自动将 TempMail 应用部署到 Cloudflare。

详细步骤请参考 [GitHub Action 自动部署教程](/docs/github-action-tutorial.md)。

### 手动部署步骤

2.  **创建 Cloudflare D1 数据库**
    在 Cloudflare 控制台或使用 Wrangler CLI 创建一个 D1 数据库。

3.  **配置 `wrangler.toml`**
    将根目录下的 `wrangler.toml` 文件中的 `${...}` 占位符替换为您的 Cloudflare 和 D1 配置信息。您也可以通过 Cloudflare Pages 的环境变量来设置这些值。

4.  **构建和部署**
    ```bash
    # 构建前端应用
    pnpm run build

    # 部署到 Cloudflare
    pnpm run deploy
    ```
    Wrangler 将会自动处理前端静态资源和 Worker 的部署，并根据配置应用数据库迁移。

5.  **配置电子邮件路由**
    在您的 Cloudflare 域名管理界面，进入 `Email` -> `Email Routing` -> `Routes`，设置一个 `Catch-all` 规则，将所有发送到您域名的邮件 `Send to a Worker`，选择您刚刚部署的 Worker。

### 环境变量

在部署到 Cloudflare Pages 时，您需要配置以下环境变量：

-   `DATABASE_NAME`: 您的 D1 数据库名称。
-   `DATABASE_ID`: 您的 D1 数据库 ID。
-   `COOKIES_SECRET`: 用于签名 Cookie 的密钥。
-   `EMAIL_DOMAIN`: 您的邮箱域名，例如 `example.com,example.net`。
-   `TURNSTILE_KEY`: 您的 Turnstile 站点密钥，可选。
-   `TURNSTILE_SECRET`: 您的 Turnstile 密钥，可选。
-   `PASSWORD`: 站点访问密码（可选，同时也是管理员 API Key 生成的验证凭据）。
-   `API_RATE_LIMIT_PER_MINUTE`: API 每分钟请求限制（可选，默认 100）。
-   `SHOW_AFF`: 是否展示推广位（可选，`true` 开启，默认不展示）。
-   `ENABLE_OPENAPI`: 是否开启 OpenAPI 调用功能（可选，默认开启；设置为 `false` 时禁用 API Key 创建与 `/v1/*` 调用）。
-   `DOMAIN_TTL_CONFIG`: 按域名配置邮件保留时间（可选，格式：`domain=hours,domain=hours`，如 `premium.com=720,free.com=24`）。

## 🔨 本地运行调试

1.  **复制环境变量文件**
    ```bash
    # 此命令会创建一个本地环境变量文件，wrangler dev 会自动加载
    cp .env.example .env
    ```

2.  **填写本地环境变量**
    在 `.env` 文件中填写必要的环境变量，特别是 `D1_DATABASE_ID` 等。您需要先在 Cloudflare 创建一个 D1 数据库用于本地开发。

3.  **启动开发服务器**
    ```bash
    pnpm run dev
    ```
    该命令会同时启动前端 Vite 开发服务器和本地的 Wrangler Worker 环境。

## 📖 API 文档

TempMail 提供完整的 RESTful API，支持通过程序化方式创建临时邮箱、查询收件箱。

### 获取 API Key

使用管理员端点通过站点密码生成 API Key：

```bash
curl -X POST https://your-domain.com/api/admin/generate-key \
  -H "Content-Type: application/json" \
  -d '{"password": "your-admin-password", "name": "my-key"}'
```

> 注意：管理员端点需要站点已设置 `PASSWORD` 环境变量。

### API 端点

| 方法     | 端点                                  | 说明                   |
| -------- | ------------------------------------- | ---------------------- |
| `POST`   | `/v1/mail`                            | 创建临时邮箱           |
| `GET`    | `/v1/mail/:id`                        | 获取邮箱信息           |
| `GET`    | `/v1/mail/:id/messages`               | 获取收件箱（支持分页） |
| `GET`    | `/v1/mail/:id/messages/:messageId`    | 获取邮件详情           |
| `DELETE` | `/v1/mail/:id/messages/:messageId`    | 删除邮件               |

> 旧路径 `/api/v1/mailboxes` 仍然可用，保持向后兼容。

### 快速开始

```bash
# 1. 创建临时邮箱
curl -X POST https://your-domain.com/v1/mail \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# 响应: { "data": { "id": "abc123", "address": "random@domain.com", ... } }

# 2. 查询收件箱
curl https://your-domain.com/v1/mail/abc123/messages \
  -H "X-API-Key: your-api-key"

# 3. 获取邮件详情
curl https://your-domain.com/v1/mail/abc123/messages/msg_001 \
  -H "X-API-Key: your-api-key"
```

## 📝 License

GNU General Public License v3.0
