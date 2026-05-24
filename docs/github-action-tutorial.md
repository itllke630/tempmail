# GitHub Action 自动部署教程

本项目已包含一个预先配置好的 GitHub Action 工作流文件 (`.github/workflows/deploy.yml`)，可以帮助您自动将 TempMail 应用部署到 Cloudflare Workers。

## 准备工作

在开始之前，请确保您已经完成了 Cloudflare 和 D1 的配置。

## 配置 GitHub Secrets

为了让 GitHub Actions 能够安全地访问您的 Cloudflare 和数据库账户，您需要将以下敏感信息配置为 GitHub 仓库的 Secrets。

前往您的 GitHub 仓库页面，点击 `Settings` -> `Secrets and variables` -> `Actions`，然后添加以下 `Repository secrets`：

| Secret Name        | 说明                                                                                               | 示例值                                 |
| :----------------- | :------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `CF_API_TOKEN`     | Cloudflare API Token，用于授权 Wrangler 操作。请确保该 Token 具有编辑 Workers 和 D1 数据库的权限。 | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`     |
| `CF_ACCOUNT_ID`    | 您的 Cloudflare 账户 ID，可以在 Cloudflare 控制台主页的右侧找到。                                  | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`     |
| `D1_DATABASE_ID`   | 您的 D1 数据库 ID。                                                                                | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `D1_DATABASE_NAME` | 您的 D1 数据库名称。                                                                               | `tempmail`                             |
| `EMAIL_DOMAIN`     | 您的邮箱域名，如果多个域名请用逗号隔开。                                                           | `tempmail.dev,example.com`             |
| `COOKIES_SECRET`   | 用于加密 Cookie 的密钥，请设置为一个随机且足够复杂的字符串。                                       | `a-very-strong-and-random-secret`      |
| `TURNSTILE_KEY`    | 可选，Cloudflare Turnstile 网站密钥 (Site Key)。                                                    | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`       |
| `TURNSTILE_SECRET` | 可选，Cloudflare Turnstile 密钥 (Secret Key)。                                                      | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`       |
| `PASSWORD`         | 可选，用于访问 TempMail 网站的密码。                                                               | `password`                             |
| `API_RATE_LIMIT_PER_MINUTE` | 可选，API 每分钟请求限制，默认为 `100`。                                                      | `100`                                  |
| `ENABLE_OPENAPI`   | 可选，是否开启 OpenAPI 调用功能；默认为开启，设置为 `false` 时禁用 API Key 创建和 `/v1/*`。         | `false`                                |
| `SHOW_AFF`         | 可选，是否展示推广位；设置为 `true` 开启。                                                         | `true`                                 |
| `DOMAIN_TTL_CONFIG`| 可选，按域名配置邮件保留时间（小时）。格式：`domain=hours,domain=hours`。                           | `premium.com=720,free.com=24`          |

## 触发自动部署

配置好以上 Secrets 后，每当您向 `main` 分支推送（push）代码时，GitHub Action 都会自动触发，执行以下步骤：

1.  **检查凭据**：确认 `CF_API_TOKEN` 和 `CF_ACCOUNT_ID` 是否已设置。
2.  **安装与构建**：安装 pnpm 依赖并构建前端和 Worker 应用。
3.  **数据库迁移**：自动应用 `worker/drizzle` 目录下的数据库迁移脚本到您的 D1 数据库。
4.  **部署应用**：将构建好的应用部署到 Cloudflare。

您也可以在 GitHub 仓库的 `Actions` 标签页手动触发部署。

## 注意事项

- 工作流文件 (`.github/workflows/deploy.yml`) 会自动从您的 Secrets 中读取配置并应用到 `wrangler.toml` 文件中，**请勿**直接将敏感信息写入 `wrangler.toml` 文件。
- 如果您的数据库结构有变更（例如，修改了 `worker/src/database/schema.ts`），请记得生成新的迁移文件并提交到代码库中，GitHub Action 会自动帮您应用更新。
- 如需使用多域名独立 TTL 功能，请配置 `DOMAIN_TTL_CONFIG` 环境变量，格式为 `domain=hours`，多域名用逗号分隔。
