import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';
// 导入数据库相关的模块
import { deleteEmails, findEmailById, getEmailsByMessageTo, insertEmail, deleteExpiredEmailsByDomain, insertApiKey, getSiteStats, incrementEmailsReceived, incrementApiKeysCreated, incrementAddressesCreated, incrementDailyAddressesCreated, incrementDailyEmailsReceived, incrementDailyApiKeysCreated, getMailboxMetaByAddress } from './database/dao';
import { getD1DB } from './database/db';
import { InsertEmail, insertEmailSchema } from './database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';
// 导入加解密工具函数
import { decrypt } from './utils';
// 导入 v1 API
import v1Api from './api/v1';
import { isOpenApiEnabled, requireOpenApi } from './openapi';


// 定义 Cloudflare 绑定和环境变量的类型
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;

  // 从 wrangler.toml 中传入的环境变量
  EMAIL_DOMAIN: string;
  DOMAIN_TTL_CONFIG?: string;
  COOKIES_SECRET: string;
  TURNSTILE_KEY: string;
  TURNSTILE_SECRET: string;
  PASSWORD?: string;
  API_RATE_LIMIT_PER_MINUTE?: string;
  SHOW_AFF?: string;
  ENABLE_OPENAPI?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TEAM_DOMAINS?: string;
  AD_TOP_HTML?: string;
}

// 初始化 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// 配置 CORS
app.use('/api/*', cors());
app.use('/v1/*', cors());

const SITE_AUTH_COOKIE = 'vmail_site_auth';

function isTurnstileEnabled(env: Env): boolean {
  return Boolean(env.TURNSTILE_KEY && env.TURNSTILE_SECRET);
}

function parseRateLimitPerMinute(env: Env): number {
  const parsed = Number.parseInt(env.API_RATE_LIMIT_PER_MINUTE ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 100;
  }
  return parsed;
}

function parseDomainTtlConfig(env: Env): Map<string, number> {
  const map = new Map<string, number>();
  if (!env.DOMAIN_TTL_CONFIG) return map;
  for (const pair of env.DOMAIN_TTL_CONFIG.split(',')) {
    const [domain, hours] = pair.split('=').map(s => s.trim());
    if (domain && hours) {
      const n = Number.parseInt(hours, 10);
      if (Number.isFinite(n) && n > 0) {
        map.set(domain, n);
      }
    }
  }
  return map;
}

function isSiteUnlocked(request: Request, env: Env): boolean {
  if (!env.PASSWORD) {
    return true;
  }

  const cookie = request.headers.get('cookie') ?? '';
  return cookie.split(';').some((part) => {
    const [key, value] = part.trim().split('=');
    return key === SITE_AUTH_COOKIE && value === '1';
  });
}


// fix: 增强请求体验证逻辑。
// 此前的实现方式在请求体解析失败时会静默处理，导致后续处理流程因缺少数据而返回一个模糊的400错误。
// 新的实现方式会严格校验请求体，如果解析为JSON失败（例如请求体为空或格式错误），将立即返回一个明确的400错误，从而阻止无效请求继续执行。
const turnstile = async (c, next) => {
  if (!isTurnstileEnabled(c.env)) {
    c.set('parsedBody', {});
    await next();
    return;
  }

  let body: any;
  try {
    // 尝试将请求体解析为JSON。如果失败，将抛出异常。
    body = await c.req.json();
  } catch (e) {
    // 捕获异常，记录错误日志，并返回一个清晰的错误响应。
    console.error("请求体解析为JSON时出错:", e);
    return c.json({ message: '错误的请求：请求体无效或为空。' }, 400);
  }

  // 将解析后的 body 存入上下文，以便下游处理器直接使用，避免重复解析。
  c.set('parsedBody', body);

  const token = body.token || c.req.header('cf-turnstile-token');
  const ip = c.req.header('CF-Connecting-IP');

  if (!token) {
    return c.json({ message: '缺少 turnstile token' }, 400);
  }

  // fix: 切换到 application/x-www-form-urlencoded 格式来发送验证请求。
  // 这可以提高兼容性，并可能解决由 FormData 编码引起的边界问题。
  const params = new URLSearchParams();
  params.append('secret', c.env.TURNSTILE_SECRET);
  params.append('response', token);
  if (ip) {
    params.append('remoteip', ip);
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!data.success) {
    // feat: 增加详细的错误日志，方便调试
    console.error("Turnstile 验证失败:", data['error-codes']);
    return c.json({ message: 'token 无效' }, 400);
  }

  await next();
};

// API 路由组
const api = app.basePath('/api');

// feat: 新增一个专门用于人机验证的接口。
// 前端应在生成邮箱地址前先调用此接口。
api.post('/verify', turnstile, async (c) => {
  if (!isTurnstileEnabled(c.env)) {
    const db = getD1DB(c.env.DB);
    await incrementAddressesCreated(db);
    await incrementDailyAddressesCreated(db);
    return c.json({ success: true, bypassed: true });
  }

  // turnstile 中间件已经完成了验证工作。
  // 如果代码能执行到这里，说明验证成功。
  // 增加邮箱创建计数（前端验证成功后会创建邮箱地址）
  const db = getD1DB(c.env.DB);
  await incrementAddressesCreated(db);
  await incrementDailyAddressesCreated(db);
  return c.json({ success: true });
});

// 生成 API Key 的函数
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'TempMail_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// 创建 API Key 接口（需要 Turnstile 验证）
api.post('/api-keys', requireOpenApi, turnstile, async (c) => {
  const db = getD1DB(c.env.DB);
  const body = c.get('parsedBody') as { name?: string };

  const now = new Date();
  const apiKey = generateApiKey();
  const keyPrefix = apiKey.substring(0, 12) + '...';

  const newApiKey = {
    id: nanoid(),
    key: apiKey,
    keyPrefix: keyPrefix,
    name: body?.name || null,
    rateLimit: 100,
    isActive: true,
    lastUsedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertApiKey(db, newApiKey);
    // 增加 API Key 创建计数
    await incrementApiKeysCreated(db);
    await incrementDailyApiKeysCreated(db);
    // 只返回一次完整的 API Key，之后无法再获取
    return c.json({
      data: {
        id: newApiKey.id,
        key: apiKey,  // 完整的 API Key，只展示这一次
        keyPrefix: keyPrefix,
        name: newApiKey.name,
        createdAt: now.toISOString(),
      },
      message: 'API Key created successfully. Please save it now, it will not be shown again!'
    }, 201);
  } catch (e: any) {
    console.error('Create API Key error:', e);
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API Key',
      }
    }, 500);
  }
});

// fix: 移除获取邮件列表接口的 turnstile 验证。
// 这个接口现在是公开的，刷新收件箱时可以直接调用，不再需要重复验证。
api.post('/emails', async (c) => {
  const db = getD1DB(c.env.DB);
  let body: any;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ message: '错误的请求：请求体无效或为空。' }, 400);
  }
  const address = body?.address;
  const limit = Number.parseInt(body?.limit ?? '', 10);

  if (!address) {
    return c.json({ message: 'address is required' }, 400);
  }
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50;
  const emails = await getEmailsByMessageTo(db, address as string, safeLimit);
  return c.json(emails);
});

api.post('/emails/meta', async (c) => {
  const db = getD1DB(c.env.DB);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: '错误的请求：请求体无效或为空。' }, 400);
  }

  const address = body?.address;
  if (!address) {
    return c.json({ message: 'address is required' }, 400);
  }

  const meta = await getMailboxMetaByAddress(db, address as string);
  return c.json(meta);
});


// 获取单封邮件详情
api.get('/emails/:id', async (c) => {
  const db = getD1DB(c.env.DB);
  const { id } = c.req.param();
  // 函数调用修正：使用 findEmailById 函数
  const email = await findEmailById(db, id);
  if (!email) {
    return c.json({ message: 'Email not found'}, 404);
  }
  return c.json(email);
});

// fix: 删除邮件接口不再需要 turnstile 验证，因为通常这是在已知邮箱上下文中操作的。
api.post('/delete-emails', async (c) => {
    const db = getD1DB(c.env.DB);
    const body = await c.req.json();
    const ids = body?.ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.json({ message: 'ids are required' }, 400);
    }
    const result = await deleteEmails(db, ids as string[]);
    return c.json(result);
});

// 团队登录：验证密码是否匹配 PASSWORD 环境变量
api.post('/team/login', async (c) => {
  if (!c.env.PASSWORD) {
    return c.json({ message: 'Team login is not enabled' }, 403);
  }

  let body: { password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid request body' }, 400);
  }

  if (!body.password || body.password !== c.env.PASSWORD) {
    return c.json({ message: 'Invalid password' }, 401);
  }

  const teamDomains = c.env.TEAM_DOMAINS ? c.env.TEAM_DOMAINS.split(',').map(d => d.trim()) : [];

  return c.json({
    success: true,
    teamDomains,
  });
});

// 修复：移除登录接口的 turnstile 中间件，使其不再需要人机验证。
api.post('/login', async (c) => {
  // const db = getD1DB(c.env.DB); // 数据库连接不再需要用于验证
  // 修复：由于移除了 turnstile 中间件，现在需要在此处直接解析请求体。
  const body = await c.req.json();
  const password = body?.password;

  if (!password) {
    return c.json({ message: 'Password is required' }, 400);
  }

  try {
    // 解密密码以获取邮箱地址
    const address = decrypt(password, c.env.COOKIES_SECRET);
    
    // **核心修复**：移除数据库邮件检查逻辑
    // 不再需要查询数据库中是否存在该地址的邮件
    // const emails = await getEmailsByMessageTo(db, address);
    // if (emails.length === 0) {
      // 如果该地址从未收到过邮件，则视为无效密码
      // return c.json({ message: 'Invalid password' }, 404);
    // }

    // 可选：添加一个简单的邮箱地址格式校验，增加健壮性
    // 例如，检查是否包含 '@' 符号
    if (!address || typeof address !== 'string' || !address.includes('@')) {
        console.error("解密后的地址格式无效:", address);
        return c.json({ message: 'Invalid password' }, 400); // 地址格式不对也视为密码无效
    }

    // 登录成功，返回邮箱地址
    return c.json({ address });
  } catch (e) {
    console.error("Login error:", e);
    // 如果解密失败或发生其他错误，返回无效密码错误
    return c.json({ message: 'Invalid password' }, 400);
  }
});


// 前端配置接口
app.get('/config', (c) => {
  // feat: 将 emailDomain 拆分为数组以支持多域名
  const emailDomain = c.env.EMAIL_DOMAIN ? c.env.EMAIL_DOMAIN.split(',').map(d => d.trim()) : [];
  const teamDomains = c.env.TEAM_DOMAINS ? c.env.TEAM_DOMAINS.split(',').map(d => d.trim()) : [];
  const publicDomains = emailDomain.filter(d => !teamDomains.includes(d));
  const turnstileEnabled = isTurnstileEnabled(c.env);
  const openApiEnabled = isOpenApiEnabled(c.env);

  const responseData: Record<string, unknown> = {
    emailDomain: publicDomains,
    domainTtlConfig: Object.fromEntries(parseDomainTtlConfig(c.env)),
    teamDomains,
    turnstileKey: c.env.TURNSTILE_KEY,
    turnstileEnabled,
    sitePasswordEnabled: Boolean(c.env.PASSWORD),
    apiRateLimitPerMinute: parseRateLimitPerMinute(c.env),
    openApiEnabled,
    showAff: c.env.SHOW_AFF === 'true',
  };
  return new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});

// 站点统计数据接口（公开）
api.get('/stats', async (c) => {
  const cache = caches.default;
  const cacheKey = new Request(c.req.url, c.req.raw);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const db = getD1DB(c.env.DB);
  const stats = await getSiteStats(db);

  const totals = {
    totalAddressesCreated: stats?.totalAddressesCreated ?? 0,
    totalEmailsReceived: stats?.totalEmailsReceived ?? 0,
    totalApiCalls: stats?.totalApiCalls ?? 0,
    totalApiKeysCreated: stats?.totalApiKeysCreated ?? 0,
  };

  const response = c.json({
    totals,
  });

  response.headers.set('Cache-Control', 'public, max-age=300');
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

app.post('/auth/unlock', async (c) => {
  if (!c.env.PASSWORD) {
    return c.json({ success: true, bypassed: true });
  }

  let body: { password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid request body' }, 400);
  }

  if (body.password !== c.env.PASSWORD) {
    return c.json({ message: 'Invalid password' }, 401);
  }

  c.header(
    'Set-Cookie',
    `${SITE_AUTH_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`,
  );

  return c.json({ success: true });
});

app.get('/auth/status', (c) => {
  const unlocked = isSiteUnlocked(c.req.raw, c.env);
  return c.json({
    unlocked,
    sitePasswordEnabled: Boolean(c.env.PASSWORD),
  });
});

app.post('/auth/logout', (c) => {
  c.header(
    'Set-Cookie',
    `${SITE_AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
  );
  return c.json({ success: true });
});

// 管理员生成 API Key（站点密码验证，不需要 Turnstile）
app.post('/api/admin/generate-key', async (c) => {
  if (!c.env.PASSWORD) {
    return c.json({ error: { code: 'DISABLED', message: 'Admin key generation is not enabled' } }, 403);
  }

  let body: { password?: string; name?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body' } }, 400);
  }

  if (!body.password || body.password !== c.env.PASSWORD) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid admin password' } }, 401);
  }

  const db = getD1DB(c.env.DB);
  const now = new Date();
  const apiKey = generateApiKey();
  const keyPrefix = apiKey.substring(0, 12) + '...';

  const newApiKey = {
    id: nanoid(),
    key: apiKey,
    keyPrefix,
    name: body.name || 'admin-generated',
    rateLimit: 100,
    isActive: true,
    lastUsedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertApiKey(db, newApiKey);
    await incrementApiKeysCreated(db);
    await incrementDailyApiKeysCreated(db);
    return c.json({
      data: {
        id: newApiKey.id,
        key: apiKey,
        keyPrefix,
        name: newApiKey.name,
        createdAt: now.toISOString(),
      },
      message: 'API Key created successfully. Save it now!',
    }, 201);
  } catch (e: any) {
    console.error('Admin generate API Key error:', e);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create API Key' } }, 500);
  }
});

// 挂载 v1 API 路由
app.route('/v1', v1Api);
// 保留旧路径以兼容已有调用
app.route('/api/v1', v1Api);

// 修正: 确保 serveStatic 正确指向静态文件目录
// Hono v4 中 serveStatic 默认处理根路径，我们需要确保它指向正确的子目录
app.get('/*', serveStatic({ root: './' }))
app.get('/assets/*', serveStatic({ root: './' }))


// Worker 主处理逻辑
export default {
  // 邮件处理逻辑
  async email(message: ForwardableEmail, env: Env, ctx: ExecutionContext) {
    try {
      const db = getD1DB(env.DB);
      // 将原始邮件流转换为文本
      const raw = await new Response(message.raw).text();
      // 使用 postal-mime 解析邮件
      const mail = await new PostalMime().parse(raw);
      const now = new Date();

      // **关键修复**：显式地从解析结果中映射字段，而不是使用对象展开(...)
      // 这样可以避免属性覆盖和类型不匹配的问题
      const newEmail: InsertEmail = {
        id: nanoid(),
        messageFrom: message.from,
        messageTo: message.to,
        headers: mail.headers || [], // 确保 headers 存在
        from: mail.from,
        sender: mail.sender,
        replyTo: mail.replyTo,
        deliveredTo: mail.deliveredTo,
        returnPath: mail.returnPath,
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
        subject: mail.subject,
        messageId: mail.messageId, // messageId 在数据库中是必需的
        inReplyTo: mail.inReplyTo,
        references: mail.references,
        date: mail.date,
        html: mail.html,
        text: mail.text,
        createdAt: now,
        updatedAt: now,
      };

      // 验证待插入的数据是否符合 schema
      const email = insertEmailSchema.parse(newEmail);
      // 插入数据库
      await insertEmail(db, email);
      // 增加邮件接收计数
      await incrementEmailsReceived(db);
      await incrementDailyEmailsReceived(db);
    } catch (e: any) {
      // **关键修复**：向 Cloudflare 发出拒绝信号
      // 当发生任何错误时，调用 message.setReject() 告知 Cloudflare 处理失败。
      // 这会让 Cloudflare 尝试重新投递邮件，而不是直接删除。
      console.error('处理邮件失败:', e);
      message.setReject(`邮件处理失败: ${e.message}`);
    }
  },

  // HTTP 请求处理逻辑
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API 路由
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/') || url.pathname === '/config' || url.pathname.startsWith('/auth/')) {
      return app.fetch(request, env, ctx);
    }

    // 静态资源请求
    let response = await env.ASSETS.fetch(request);

    // SPA 路由回退：如果静态资源返回 404，则返回 index.html
    const isSpaFallback = response.status === 404;
    if (isSpaFallback) {
      const indexRequest = new Request(new URL('/', request.url).toString(), request);
      response = env.ASSETS.fetch(indexRequest);
    }

    // 对 HTML 响应注入广告代码（服务端注入确保脚本在解析阶段执行）
    const path = url.pathname;
    const isHtmlRequest = path === '/' || path.endsWith('.html') || isSpaFallback;
    if (isHtmlRequest && env.AD_TOP_HTML) {
      const html = await response.text();
      const wrapper = `<div style="display:flex;justify-content:center;padding-top:64px;padding-bottom:16px">${env.AD_TOP_HTML}</div>`;
      const injected = html.replace('<body>', `<body>${wrapper}`);
      const headers = new Headers(response.headers);
      headers.set('X-Ad-Injected', 'true');
      return new Response(injected, {
        status: response.status,
        headers,
      });
    }

    return response;
  },

  // 定时任务 (清理过期邮件，按域名分别配置保留时间)
  async scheduled(event, env, ctx) {
      const db = getD1DB(env.DB);
      const domainTtlConfig = parseDomainTtlConfig(env);
      const result = await deleteExpiredEmailsByDomain(db, domainTtlConfig, 24);
      console.log(`已清理 ${result.count} 封过期邮件`);
  },
};
