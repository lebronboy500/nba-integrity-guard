# 🚀 Phase 3 详细实施计划

**版本**: v3.0
**预计周期**: 2-3周
**状态**: 🚧 规划中

---

## 📊 Phase 3 总览

从单用户系统升级到**多用户支持 + 完整通知系统**。

### 三大模块

1. **用户认证系统** (1周) - Web3 + Email登录
2. **通知系统** (1周) - Email + Telegram + Discord
3. **个人数据隔离** (1周) - 用户级交易历史 + 策略配置

---

## 🔐 Phase 3.1: 用户认证系统

### 目标
支持两种登录方式：Web3钱包 + Email/密码

### 核心实现

#### 1. 数据库表

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,

  -- 认证字段
  password_hash VARCHAR(255),                -- Email登录
  wallet_address VARCHAR(255) UNIQUE,       -- Web3登录

  -- 个人信息
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,

  -- 设置
  theme VARCHAR(20) DEFAULT 'dark',         -- dark/light
  language VARCHAR(10) DEFAULT 'en',        -- en/zh
  notification_settings JSONB DEFAULT '{}',

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- 会话表
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  ip_address VARCHAR(50),
  user_agent TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- 用户策略表
CREATE TABLE user_strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- 参数
  rigging_threshold DECIMAL(5,4),
  anomaly_threshold DECIMAL(5,4),
  max_position_size DECIMAL(15,2),
  risk_per_trade DECIMAL(5,4),

  -- 状态
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- API密钥表
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_name VARCHAR(255),

  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  is_active BOOLEAN DEFAULT true
);
```

#### 2. JWT认证

```typescript
// Auth Token 结构
interface JWTPayload {
  userId: number;
  email: string;
  wallet?: string;
  iat: number;
  exp: number;
}

// Token 类型
- access_token (15分钟)
- refresh_token (7天)
- api_key (无限期)
```

#### 3. 登录端点

```typescript
POST /auth/register/email
  Body: { email, password, username }
  Response: { userId, token, refreshToken }

POST /auth/login/email
  Body: { email, password }
  Response: { userId, token, refreshToken }

POST /auth/login/web3
  Body: { walletAddress, signature, message }
  Response: { userId, token, refreshToken }

POST /auth/refresh
  Body: { refreshToken }
  Response: { token, refreshToken }

POST /auth/logout
  Headers: { Authorization: Bearer token }
  Response: { success: true }

GET /auth/me
  Headers: { Authorization: Bearer token }
  Response: { user: User }
```

#### 4. 认证中间件

```typescript
// Express 中间件
app.use(authenticateToken);  // 验证JWT
app.use(authorizeUser);      // 确保用户权限

// 保护端点
app.get('/profile', authenticateToken, (req, res) => {
  // req.userId 已设置
});
```

---

## 🔔 Phase 3.2: 通知系统

### 目标
支持多种通知渠道

### 核心实现

#### 1. 通知表

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type VARCHAR(50),  -- signal, trade, profit, alert
  title VARCHAR(255),
  message TEXT,

  data JSONB,  -- 额外数据

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

-- 通知模板表
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE,
  email_subject VARCHAR(255),
  email_body TEXT,
  telegram_message TEXT,
  discord_message TEXT
);
```

#### 2. Email通知

```typescript
// 使用Nodemailer
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendEmailNotification(
  userId: number,
  type: string,
  data: any
) {
  const user = await db.query('SELECT email FROM users WHERE id = $1', [userId]);

  const template = await db.query(
    'SELECT email_subject, email_body FROM notification_templates WHERE type = $1',
    [type]
  );

  const subject = template.email_subject.replace(/{{(\w+)}}/g,
    (match, key) => data[key] || ''
  );

  const body = template.email_body.replace(/{{(\w+)}}/g,
    (match, key) => data[key] || ''
  );

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject,
    html: body
  });
}
```

#### 3. Telegram集成

```typescript
// 使用 node-telegram-bot-api
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

async function sendTelegramNotification(
  userId: number,
  message: string
) {
  const user = await db.query(
    'SELECT metadata FROM users WHERE id = $1',
    [userId]
  );

  const telegramId = user.metadata?.telegram_id;

  if (telegramId) {
    await bot.sendMessage(telegramId, message, {
      parse_mode: 'HTML'
    });
  }
}
```

#### 4. Discord Webhook

```typescript
// 使用 axios
async function sendDiscordNotification(
  userId: number,
  embed: any
) {
  const user = await db.query(
    'SELECT notification_settings FROM users WHERE id = $1',
    [userId]
  );

  const webhookUrl = user.notification_settings?.discord_webhook;

  if (webhookUrl) {
    await axios.post(webhookUrl, {
      embeds: [embed]
    });
  }
}
```

#### 5. 通知端点

```typescript
POST /notifications/send
  Body: { userId, type, data, channels: ['email', 'telegram'] }

GET /notifications?limit=20&unread=true
  Headers: { Authorization: Bearer token }
  Response: { notifications: Notification[] }

PUT /notifications/:id/read
  Headers: { Authorization: Bearer token }

DELETE /notifications/:id
  Headers: { Authorization: Bearer token }

GET /notifications/preferences
  Headers: { Authorization: Bearer token }
  Response: { preferences }

PUT /notifications/preferences
  Headers: { Authorization: Bearer token }
  Body: { email: true, telegram: false, discord: true }
```

---

## 👤 Phase 3.3: 个人数据隔离

### 目标
每个用户有独立的交易历史、信号和策略

### 核心实现

#### 1. 数据隔离

```sql
-- 修改现有表，添加 user_id
ALTER TABLE trades ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE signal_logs ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE backtest_results ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 创建索引
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_signal_logs_user ON signal_logs(user_id);
```

#### 2. 查询时过滤

```typescript
// 之前：SELECT * FROM trades
// 之后：
const trades = await db.query(
  'SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC',
  [req.userId]
);
```

#### 3. 个人仪表板

```typescript
GET /dashboard/:userId
  Headers: { Authorization: Bearer token }
  Response: {
    stats: { totalProfit, winRate, signalsProcessed },
    recentTrades: Trade[],
    recentSignals: Signal[],
    activeStrategy: UserStrategy
  }

GET /dashboard/:userId/performance
  Headers: { Authorization: Bearer token }
  Response: {
    daily: Point[],
    weekly: Point[],
    monthly: Point[],
    yearly: Point[]
  }
```

---

## 🔌 API概览

### 认证端点 (10个)
```
POST   /auth/register/email
POST   /auth/login/email
POST   /auth/login/web3
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
POST   /auth/change-password
GET    /auth/sessions
DELETE /auth/sessions/:id
POST   /auth/api-keys
```

### 用户端点 (8个)
```
GET    /users/:id
PUT    /users/:id
GET    /users/:id/profile
PUT    /users/:id/profile
GET    /users/:id/strategies
POST   /users/:id/strategies
PUT    /users/:id/strategies/:strategyId
DELETE /users/:id/strategies/:strategyId
```

### 通知端点 (6个)
```
GET    /notifications
PUT    /notifications/:id/read
DELETE /notifications/:id
GET    /notifications/preferences
PUT    /notifications/preferences
POST   /notifications/test  -- 测试通知
```

### 个人数据端点 (6个)
```
GET    /dashboard/:userId
GET    /dashboard/:userId/performance
GET    /dashboard/:userId/trades
GET    /dashboard/:userId/signals
GET    /dashboard/:userId/backtest-results
POST   /dashboard/:userId/export  -- 导出CSV
```

---

## 🗄️ 数据库总结

**新增表**: 6个
- users
- sessions
- user_strategies
- api_keys
- notifications
- notification_templates

**修改表**: 4个
- trades (+ user_id)
- signal_logs (+ user_id)
- backtest_results (+ user_id)
- distributions (+ user_id)

---

## 🧪 Phase 3 验收标准

### 功能性
- [ ] 用户注册/登录 (Email + Web3)
- [ ] JWT令牌管理
- [ ] 会话管理
- [ ] Email通知发送
- [ ] Telegram集成
- [ ] Discord集成
- [ ] 个人数据隔离
- [ ] 策略管理

### 安全性
- [ ] 密码加密 (bcrypt)
- [ ] SQL注入防护
- [ ] CSRF防护
- [ ] 速率限制
- [ ] API密钥认证

### 性能
- [ ] 登录时间 <500ms
- [ ] JWT验证 <50ms
- [ ] 数据库查询优化
- [ ] Redis缓存集成

---

## 📅 Phase 3 实施时间线

| 周次 | 任务 | 交付物 |
|-----|------|-------|
| Week 1 | 认证系统 | 用户表 + 登录端点 + JWT |
| Week 2 | 通知系统 | Email + Telegram + Discord |
| Week 3 | 数据隔离 + 前端集成 | 用户管理页面 + 通知中心 |

---

## 🚀 立即行动

1. [ ] 创建用户认证模块
2. [ ] 实现JWT中间件
3. [ ] 添加前端登录页面
4. [ ] 集成Email服务
5. [ ] 集成Telegram Bot
6. [ ] 集成Discord Webhook

---

**下一步**: 开始实现用户认证系统 (数据库 + API端点)
