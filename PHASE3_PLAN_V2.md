# Phase 3: Polymarket 集成 + 用户系统完整实施计划

**参考架构**: [OGBC Intern Project](https://github.com/ogalias/OGBC-Intern-Project)
**版本**: v3.0
**预计周期**: 3-4周

---

## 🎯 核心目标

将 NBA Integrity Guard 升级为**支持 Polymarket 链上数据索引**和**多用户系统**的完整平台。实现从推特舆情 → 链上数据分析 → 自动交易 → 智能分账的闭环，同时支持多用户独立账户管理。

### 三维创新功能

1. **📊 数据分析与可视化**
   - ✨ 市场情绪仪表盘（实时舆情 + 链上活动聚合）
   - ✨ 价格趋势与深度分析（K线图、成交量、持仓分布）
   - ✨ 大额交易监测工具（鲸鱼追踪、异常交易告警）

2. **💰 交易与风控工具**
   - ✨ 智能下单系统（限价/市价订单，风控检查）
   - ✨ 持仓 PnL 模拟（实时盈亏计算，场景分析）
   - ✨ 市场结算与争议追踪（自动争议监测，历史结算查询）

3. **🚀 创新型应用**
   - ✨ 链上行为交易者画像系统（交易风格分析，账户评分）
   - ✨ 预测市场社交声誉体系（推特舆情影响力评分）
   - ✨ Polymarket 数据 API 聚合服务（第三方 API + 本地索引）

---

## 📐 架构设计概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       NBA Integrity Guard v3.0                          │
├─────────────────────────────────────────────────────────────────────────┤
│                            核心服务层                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Twitter Monitor│  │  Auth Service   │  │  Notification   │         │
│  │  (Phase 1/2)    │  │  (NEW)          │  │  Service (NEW)  │         │
│  │  - 舆情采集     │  │  - Email Auth   │  │  - Email        │         │
│  │  - 情绪分析     │  │  - Web3 Auth    │  │  - Telegram     │         │
│  │  - 热度指数     │  │  - JWT Tokens   │  │  - Discord      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│                         Polymarket 数据层                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ Trade Decoder   │  │ Market Decoder  │  │ Event Scanner   │         │
│  │  - OrderFilled  │  │  - TokenId 计算 │  │  - 区块扫描     │         │
│  │  - 价格解析     │  │  - Gamma 验证   │  │  - 断点续传     │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│                       📊 数据分析与可视化 (NEW)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ 市场情绪仪表盘  │  │ 价格趋势分析    │  │ 大额交易监测    │         │
│  │  - 实时舆情     │  │  - K线图表      │  │  - 鲸鱼追踪     │         │
│  │  - 链上活跃度   │  │  - 成交量分析   │  │  - 异常告警     │         │
│  │  - 市场深度     │  │  - 持仓分布     │  │  - 地址标签     │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│                        💰 交易与风控工具 (NEW)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ 智能下单系统    │  │ 持仓 PnL 模拟   │  │ 结算争议追踪    │         │
│  │  - 限价/市价    │  │  - 实时盈亏     │  │  - 争议监测     │         │
│  │  - 风控检查     │  │  - 场景分析     │  │  - 历史结算     │         │
│  │  - 滑点保护     │  │  - ROI 计算     │  │  - UMA 预言机   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│                         🚀 创新型应用 (NEW)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ 交易者画像系统  │  │ 社交声誉体系    │  │ 数据 API 聚合   │         │
│  │  - 交易风格分析 │  │  - 推特影响力   │  │  - Gamma API    │         │
│  │  - 账户评分     │  │  - 预测准确率   │  │  - 本地索引     │         │
│  │  - 行为模式识别 │  │  - 社区贡献度   │  │  - 实时订阅     │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐                               │
│  │  Strategy Engine│  │  User Dashboard │                               │
│  │  (Enhanced)     │  │  API (Enhanced) │                               │
│  │  - 用户隔离     │  │  - Market Query │                               │
│  │  - 策略配置     │  │  - Trade History│                               │
│  │  - ML优化       │  │  - Analytics    │                               │
│  └─────────────────┘  └─────────────────┘                               │
│                                                                           │
│            ┌───────────────────────────────────────────┐                 │
│            │  PostgreSQL + Redis + TimescaleDB         │                 │
│            │  - Users & Sessions                       │                 │
│            │  - Markets & Trades (Polymarket)          │                 │
│            │  - Signals & Strategies                   │                 │
│            │  - Analytics & Trader Profiles            │                 │
│            │  - Time-series data (Price/Volume)        │                 │
│            └───────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ 数据库设计（完整 Schema）

### 用户系统表

#### `users` - 用户账户
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,

  -- Authentication
  password_hash VARCHAR(255),
  wallet_address VARCHAR(255) UNIQUE,

  -- Profile
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,

  -- Settings
  theme VARCHAR(20) DEFAULT 'dark',
  language VARCHAR(10) DEFAULT 'en',
  notification_settings JSONB DEFAULT '{"email": true, "telegram": false, "discord": false}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
```

#### `sessions` - 用户会话
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  ip_address VARCHAR(50),
  user_agent TEXT,

  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
```

#### `user_strategies` - 用户策略配置
```sql
CREATE TABLE user_strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Parameters
  rigging_threshold DECIMAL(5,4) DEFAULT 0.65,
  anomaly_threshold DECIMAL(5,4) DEFAULT 0.75,
  max_position_size DECIMAL(15,2) DEFAULT 1000.00,
  risk_per_trade DECIMAL(5,4) DEFAULT 0.02,

  -- Status
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, name)
);
```

#### `notifications` - 用户通知
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,  -- 'signal', 'trade', 'profit', 'alert'
  title VARCHAR(255) NOT NULL,
  message TEXT,

  data JSONB DEFAULT '{}',

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

---

### Polymarket 数据表（参考 OGBC Stage 2）

#### `events` - Polymarket 事件
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(500) UNIQUE NOT NULL,
  title VARCHAR(500),
  description TEXT,

  -- Metadata
  category VARCHAR(100),
  image_url VARCHAR(500),

  -- Risk model
  enable_neg_risk BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'resolved', 'closed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
```

#### `markets` - Polymarket 市场
```sql
CREATE TABLE markets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  slug VARCHAR(500) UNIQUE NOT NULL,

  -- Blockchain params (from Stage 1 Market Decoder)
  condition_id VARCHAR(66) UNIQUE NOT NULL,  -- 0x + 64 hex chars
  question_id VARCHAR(66) NOT NULL,
  oracle VARCHAR(42) NOT NULL,
  collateral_token VARCHAR(42) NOT NULL,

  -- Token IDs (calculated from condition_id)
  yes_token_id VARCHAR(78) NOT NULL,  -- 0x + 76 hex (uint256 as hex)
  no_token_id VARCHAR(78) NOT NULL,

  -- Market metadata
  question TEXT,
  outcome_slot_count INTEGER DEFAULT 2,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  enable_order_book BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_markets_condition_id ON markets(condition_id);
CREATE INDEX idx_markets_slug ON markets(slug);
CREATE INDEX idx_markets_yes_token ON markets(yes_token_id);
CREATE INDEX idx_markets_no_token ON markets(no_token_id);
```

#### `trades` - Polymarket 交易记录
```sql
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- Optional: track user's own trades

  -- Blockchain data (from Stage 1 Trade Decoder)
  tx_hash VARCHAR(66) NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  block_timestamp TIMESTAMP NOT NULL,

  -- Exchange info
  exchange VARCHAR(42) NOT NULL,
  order_hash VARCHAR(66),

  -- Parties
  maker VARCHAR(42) NOT NULL,
  taker VARCHAR(42) NOT NULL,

  -- Assets
  maker_asset_id VARCHAR(78) NOT NULL,
  taker_asset_id VARCHAR(78) NOT NULL,
  maker_amount VARCHAR(100) NOT NULL,  -- Wei format
  taker_amount VARCHAR(100) NOT NULL,
  fee VARCHAR(100) DEFAULT '0',

  -- Computed fields
  price DECIMAL(18,6) NOT NULL,
  size DECIMAL(18,6) NOT NULL,
  side VARCHAR(10) NOT NULL,  -- 'BUY' or 'SELL'
  outcome VARCHAR(10) NOT NULL,  -- 'YES' or 'NO'
  token_id VARCHAR(78) NOT NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tx_hash, log_index)  -- Prevent duplicates (幂等性)
);

CREATE INDEX idx_trades_market ON trades(market_id);
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_tx_hash ON trades(tx_hash);
CREATE INDEX idx_trades_block ON trades(block_number);
CREATE INDEX idx_trades_timestamp ON trades(block_timestamp);
CREATE INDEX idx_trades_token ON trades(token_id);
```

#### `sync_state` - 索引同步状态
```sql
CREATE TABLE sync_state (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,  -- 'market_sync', 'trade_sync_exchange', 'trade_sync_negrisk'
  last_block INTEGER NOT NULL,
  last_block_hash VARCHAR(66),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### NBA 交易表（增强，添加用户关联）

```sql
-- Modify existing trades table
ALTER TABLE signal_logs ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE backtest_results ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE distributions ADD COLUMN user_id INTEGER REFERENCES users(id);

CREATE INDEX idx_signal_logs_user ON signal_logs(user_id);
CREATE INDEX idx_backtest_results_user ON backtest_results(user_id);
CREATE INDEX idx_distributions_user ON distributions(user_id);
```

---

### 📊 新增表：数据分析与可视化

#### `price_history` - 市场价格历史（时间序列）
```sql
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  token_id VARCHAR(78) NOT NULL,  -- YES or NO tokenId
  timestamp TIMESTAMP NOT NULL,
  block_number INTEGER NOT NULL,

  -- OHLCV 数据
  open DECIMAL(18,6),
  high DECIMAL(18,6),
  low DECIMAL(18,6),
  close DECIMAL(18,6),
  volume DECIMAL(18,6),

  -- 聚合数据
  trade_count INTEGER DEFAULT 0,
  unique_traders INTEGER DEFAULT 0,
  avg_trade_size DECIMAL(18,6),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(market_id, token_id, timestamp)
);

CREATE INDEX idx_price_history_market_time ON price_history(market_id, timestamp DESC);
CREATE INDEX idx_price_history_token_time ON price_history(token_id, timestamp DESC);
```

#### `market_sentiment` - 市场情绪（实时聚合）
```sql
CREATE TABLE market_sentiment (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- 链上数据
  buy_pressure DECIMAL(5,2),        -- 买入比例
  sell_pressure DECIMAL(5,2),       -- 卖出比例
  whale_activity DECIMAL(18,6),     -- 大额交易总量
  unique_traders_24h INTEGER,       -- 24h 独立交易者
  total_volume_24h DECIMAL(18,6),   -- 24h 成交量

  -- 舆情数据
  twitter_mentions_24h INTEGER,     -- 推特提及次数
  sentiment_score DECIMAL(5,4),     -- -1.0 ~ 1.0
  trending_score DECIMAL(5,2),      -- 0-100

  -- 综合评分
  market_heat DECIMAL(5,2),         -- 0-100 市场热度
  liquidity_score DECIMAL(5,2),     -- 流动性评分
  volatility DECIMAL(5,2),          -- 波动率

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sentiment_market ON market_sentiment(market_id);
CREATE INDEX idx_sentiment_heat ON market_sentiment(market_heat DESC);
```

#### `large_trades` - 大额交易监测
```sql
CREATE TABLE large_trades (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,

  -- 交易信息
  tx_hash VARCHAR(66) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  maker VARCHAR(42) NOT NULL,
  taker VARCHAR(42) NOT NULL,

  -- 金额
  amount DECIMAL(18,6) NOT NULL,
  price DECIMAL(18,6) NOT NULL,
  side VARCHAR(10) NOT NULL,

  -- 标记
  is_whale BOOLEAN DEFAULT false,   -- 是否鲸鱼
  whale_label VARCHAR(100),         -- 地址标签
  anomaly_score DECIMAL(5,2),       -- 异常评分 0-100

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_large_trades_market ON large_trades(market_id);
CREATE INDEX idx_large_trades_timestamp ON large_trades(timestamp DESC);
CREATE INDEX idx_large_trades_maker ON large_trades(maker);
```

---

### 💰 新增表：交易与风控工具

#### `orders` - 智能下单系统
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER NOT NULL REFERENCES markets(id),
  strategy_id INTEGER REFERENCES user_strategies(id),

  -- 订单类型
  order_type VARCHAR(20) NOT NULL,  -- 'LIMIT', 'MARKET'
  side VARCHAR(10) NOT NULL,        -- 'BUY', 'SELL'
  outcome VARCHAR(10) NOT NULL,     -- 'YES', 'NO'

  -- 数量与价格
  quantity DECIMAL(18,6) NOT NULL,
  price DECIMAL(18,6),              -- LIMIT 订单必填
  slippage_protection DECIMAL(5,4), -- 滑点保护 0-1

  -- 风控参数
  max_loss DECIMAL(18,6),           -- 最大止损
  take_profit DECIMAL(18,6),        -- 获利平仓
  position_limit DECIMAL(18,6),     -- 头寸限额

  -- 状态
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, FILLED, CANCELLED, FAILED
  filled_amount DECIMAL(18,6) DEFAULT 0,
  filled_price DECIMAL(18,6),
  filled_at TIMESTAMP,

  -- 链上关联
  tx_hash VARCHAR(66),
  block_number INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_market ON orders(market_id);
CREATE INDEX idx_orders_status ON orders(status);
```

#### `positions` - 持仓与 PnL
```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER NOT NULL REFERENCES markets(id),

  -- 持仓
  outcome VARCHAR(10) NOT NULL,     -- 'YES', 'NO'
  quantity DECIMAL(18,6) NOT NULL,
  avg_entry_price DECIMAL(18,6),
  current_price DECIMAL(18,6),

  -- PnL
  cost_basis DECIMAL(18,6),         -- 成本
  current_value DECIMAL(18,6),      -- 当前价值
  unrealized_pnl DECIMAL(18,6),     -- 未实现 PnL
  unrealized_pnl_pct DECIMAL(5,2),
  realized_pnl DECIMAL(18,6),       -- 已实现 PnL

  -- 风险
  max_risk DECIMAL(18,6),
  current_drawdown DECIMAL(5,2),    -- 当前回撤
  win_rate DECIMAL(5,2),            -- 胜率

  -- 状态
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_positions_user_market ON positions(user_id, market_id);
CREATE INDEX idx_positions_unrealized_pnl ON positions(unrealized_pnl DESC);
```

#### `market_disputes` - 结算争议追踪
```sql
CREATE TABLE market_disputes (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- 争议信息
  status VARCHAR(50) DEFAULT 'OPEN',  -- OPEN, RESOLVED, APPEALED, CLOSED
  reported_by VARCHAR(42),
  report_timestamp TIMESTAMP,

  -- 问题描述
  issue_description TEXT NOT NULL,
  evidence_url TEXT,
  severity VARCHAR(20),  -- LOW, MEDIUM, HIGH, CRITICAL

  -- UMA 预言机
  uma_request_id VARCHAR(100),
  uma_proposal_timestamp TIMESTAMP,
  uma_settlement_timestamp TIMESTAMP,
  uma_result VARCHAR(100),

  -- 分辨率
  resolution_outcome VARCHAR(50),
  resolved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disputes_market ON market_disputes(market_id);
CREATE INDEX idx_disputes_status ON market_disputes(status);
CREATE INDEX idx_disputes_timestamp ON market_disputes(report_timestamp DESC);
```

---

### 🚀 新增表：创新型应用

#### `trader_profiles` - 交易者画像
```sql
CREATE TABLE trader_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 交易风格分析
  total_trades INTEGER DEFAULT 0,
  total_volume DECIMAL(18,6) DEFAULT 0,
  win_rate DECIMAL(5,2),              -- 胜率
  avg_trade_pnl DECIMAL(18,6),        -- 平均交易盈亏
  sharpe_ratio DECIMAL(5,2),          -- 夏普比率
  max_drawdown DECIMAL(5,2),          -- 最大回撤
  profit_factor DECIMAL(5,2),         -- 利润因子 (盈利/亏损)

  -- 交易风格
  preferred_outcome VARCHAR(10),      -- 'YES', 'NO', 'BALANCED'
  avg_holding_time_hours INTEGER,     -- 平均持仓时间
  trading_frequency VARCHAR(50),      -- 'HIGH', 'MEDIUM', 'LOW'
  favorite_markets TEXT,              -- 常交易市场列表

  -- 账户评分
  account_score DECIMAL(5,2),         -- 0-100
  reliability_score DECIMAL(5,2),     -- 可靠性评分
  prediction_accuracy DECIMAL(5,2),   -- 预测准确率

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trader_profiles_score ON trader_profiles(account_score DESC);
```

#### `social_reputation` - 社交声誉体系
```sql
CREATE TABLE social_reputation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,

  -- 推特影响力
  twitter_followers INTEGER DEFAULT 0,
  twitter_mentions_count INTEGER DEFAULT 0,
  twitter_sentiment_avg DECIMAL(5,4),  -- -1.0 ~ 1.0
  tweet_prediction_accuracy DECIMAL(5,2),

  -- 社区贡献
  community_posts INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reputation_points INTEGER DEFAULT 0,

  -- 综合评分
  social_score DECIMAL(5,2),          -- 0-100
  influence_level VARCHAR(50),        -- 'NOVICE', 'ACTIVE', 'INFLUENCER', 'EXPERT'

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_social_reputation_score ON social_reputation(social_score DESC);
```

#### `analytics_cache` - 分析数据缓存
```sql
CREATE TABLE analytics_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,

  -- 统计维度
  time_range VARCHAR(50),  -- '1h', '24h', '7d', '30d'
  market_id INTEGER REFERENCES markets(id),
  user_id INTEGER REFERENCES users(id),

  ttl_seconds INTEGER DEFAULT 3600,  -- 缓存时间
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
```

---

## 🛠️ 实施路线图（4-6周）

### 第一周：Polymarket 数据解码模块 (参考 OGBC Stage 1)

### 第一周：Polymarket 数据解码模块 (参考 OGBC Stage 1)

#### 任务 1.1: Trade Decoder - 交易日志解析器

**输入**：Polygon 交易哈希 (tx_hash)
**输出**：解析后的交易详情 JSON

**核心实现**：
```typescript
// backend/polymarket-indexer/src/decoder/tradeDecoder.ts

interface OrderFilledEvent {
  txHash: string;
  logIndex: number;
  exchange: string;
  maker: string;
  taker: string;
  makerAssetId: string;
  takerAssetId: string;
  makerAmountFilled: string;
  takerAmountFilled: string;
  fee: string;
}

interface DecodedTrade {
  txHash: string;
  logIndex: number;
  exchange: string;
  maker: string;
  taker: string;
  makerAssetId: string;
  takerAssetId: string;
  makerAmount: string;
  takerAmount: string;
  fee: string;
  price: string;  // Calculated: USDC_amount / token_amount
  tokenId: string;  // Non-zero asset ID
  side: 'BUY' | 'SELL';  // BUY if makerAssetId=0, SELL if takerAssetId=0
}

export class TradeDecoder {
  async decodeTxHash(txHash: string): Promise<DecodedTrade[]> {
    // 1. eth_getTransactionReceipt 获取日志
    // 2. 过滤 OrderFilled 事件 (topic0 = keccak256("OrderFilled(...)"))
    // 3. 解析每条日志，提取字段
    // 4. 计算 price, 确定 tokenId 和 side
    // 5. 返回结构化数据
  }

  private calculatePrice(
    makerAssetId: string,
    takerAssetId: string,
    makerAmount: string,
    takerAmount: string
  ): { price: string; tokenId: string; side: 'BUY' | 'SELL' } {
    // 如果 makerAssetId = 0 (USDC)
    if (makerAssetId === '0') {
      return {
        price: (parseFloat(makerAmount) / parseFloat(takerAmount)).toFixed(6),
        tokenId: takerAssetId,
        side: 'BUY'
      };
    } else {
      return {
        price: (parseFloat(takerAmount) / parseFloat(makerAmount)).toFixed(6),
        tokenId: makerAssetId,
        side: 'SELL'
      };
    }
  }
}
```

**关键点**：
- 使用 Polygon RPC (`eth_getTransactionReceipt`)
- OrderFilled 事件签名：`0x...` (从 ABI 计算)
- Exchange 合约地址：
  - CTF Exchange: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
  - NegRisk Exchange: `0xC5d563A36AE78145C45a50134d48A1215220f80a`
- USDC 精度：6 位小数 (1e6)
- 避免重复计算：过滤 `taker == exchange_address` 的日志

---

#### 任务 1.2: Market Decoder - 市场参数解析器

**输入**：`conditionId` 或 `ConditionPreparation` 事件
**输出**：市场参数 + TokenId

**核心实现**：
```typescript
// backend/polymarket-indexer/src/decoder/marketDecoder.ts

interface MarketParams {
  conditionId: string;
  questionId: string;
  oracle: string;
  collateralToken: string;
  yesTokenId: string;
  noTokenId: string;
}

export class MarketDecoder {
  private USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';  // Polygon USDC.e

  /**
   * 从 conditionId 计算 YES/NO TokenId
   * 参考 Gnosis Conditional Token Framework
   */
  calculateTokenIds(conditionId: string): { yesTokenId: string; noTokenId: string } {
    const parentCollectionId = '0x' + '0'.repeat(64);  // bytes32(0)

    // CollectionId = keccak256(parentCollectionId, conditionId, indexSet)
    const collectionIdYes = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'uint256'],
        [parentCollectionId, conditionId, 1]  // indexSet = 0b01 for YES
      )
    );

    const collectionIdNo = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'uint256'],
        [parentCollectionId, conditionId, 2]  // indexSet = 0b10 for NO
      )
    );

    // TokenId = keccak256(collateralToken, collectionId)
    const yesTokenId = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes32'],
        [this.USDC_ADDRESS, collectionIdYes]
      )
    );

    const noTokenId = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes32'],
        [this.USDC_ADDRESS, collectionIdNo]
      )
    );

    return { yesTokenId, noTokenId };
  }

  /**
   * 从 Gamma API 获取市场信息并验证
   */
  async decodeMarket(slug: string): Promise<MarketParams> {
    // 1. 从 Gamma API 获取市场信息
    const gammaData = await this.fetchGammaMarket(slug);

    // 2. 提取 conditionId, questionId, oracle
    const { conditionId, questionId, oracle, clobTokenIds } = gammaData;

    // 3. 本地计算 TokenId 并验证
    const { yesTokenId, noTokenId } = this.calculateTokenIds(conditionId);

    // 4. 验证 Gamma API 数据是否一致
    if (clobTokenIds[0] !== yesTokenId || clobTokenIds[1] !== noTokenId) {
      console.warn('⚠️  TokenId mismatch! Gamma vs Local calculation');
    }

    return {
      conditionId,
      questionId,
      oracle,
      collateralToken: this.USDC_ADDRESS,
      yesTokenId,
      noTokenId
    };
  }
}
```

**关键点**：
- Polymarket 使用 Gnosis Conditional Token Framework
- `conditionId = keccak256(oracle, questionId, outcomeSlotCount)`
- `collectionId = keccak256(parentCollectionId, conditionId, indexSet)`
- `tokenId = keccak256(collateralToken, collectionId)`
- 验证 Gamma API 返回的 `clobTokenIds` 是否与本地计算一致

---

#### 任务 1.3: Gamma API 客户端

**实现**：
```typescript
// backend/polymarket-indexer/src/api/gammaClient.ts

export class GammaClient {
  private baseUrl = 'https://gamma-api.polymarket.com';

  async fetchEvent(slug: string) {
    const response = await axios.get(`${this.baseUrl}/events/${slug}`);
    return response.data;
  }

  async fetchMarket(slug: string) {
    const response = await axios.get(`${this.baseUrl}/markets/${slug}`);
    return response.data;
  }

  async fetchMarketsByEvent(eventSlug: string) {
    const response = await axios.get(`${this.baseUrl}/events/${eventSlug}/markets`);
    return response.data;
  }
}
```

---

### 第二周：Polymarket 索引器 (参考 OGBC Stage 2)

#### 任务 2.1: Market Discovery Service

**功能**：定期从 Gamma API 获取市场列表，存储到数据库

```typescript
// backend/polymarket-indexer/src/services/marketDiscovery.ts

export class MarketDiscoveryService {
  async discoverMarkets(eventSlug: string): Promise<void> {
    // 1. 从 Gamma API 获取事件和市场列表
    const event = await this.gammaClient.fetchEvent(eventSlug);
    const markets = await this.gammaClient.fetchMarketsByEvent(eventSlug);

    // 2. 存储事件信息
    await this.db.query(`
      INSERT INTO events (slug, title, description, category, enable_neg_risk, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
    `, [event.slug, event.title, event.description, event.category, event.negRisk, event.status]);

    // 3. 遍历市场，计算 TokenId，存储
    for (const market of markets) {
      const { conditionId, questionId, oracle, clobTokenIds } = market;

      // 本地计算 TokenId
      const { yesTokenId, noTokenId } = this.marketDecoder.calculateTokenIds(conditionId);

      // 验证
      if (clobTokenIds[0] !== yesTokenId || clobTokenIds[1] !== noTokenId) {
        console.error(`❌ TokenId mismatch for market ${market.slug}`);
        continue;
      }

      // 存储
      await this.db.query(`
        INSERT INTO markets (
          event_id, slug, condition_id, question_id, oracle, collateral_token,
          yes_token_id, no_token_id, question, status, enable_order_book
        ) VALUES (
          (SELECT id FROM events WHERE slug = $1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (condition_id) DO UPDATE SET updated_at = NOW()
      `, [
        event.slug, market.slug, conditionId, questionId, oracle, this.USDC_ADDRESS,
        yesTokenId, noTokenId, market.question, market.status, market.enableOrderBook
      ]);
    }

    console.log(`✅ Discovered ${markets.length} markets for event ${eventSlug}`);
  }
}
```

---

#### 任务 2.2: Trades Indexer - 区块扫描器

**功能**：扫描 Polygon 链上的 `OrderFilled` 事件，解析并存储交易

```typescript
// backend/polymarket-indexer/src/services/tradesIndexer.ts

export class TradesIndexer {
  private EXCHANGE_ADDRESSES = [
    '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',  // CTF Exchange
    '0xC5d563A36AE78145C45a50134d48A1215220f80a'   // NegRisk Exchange
  ];

  private ORDER_FILLED_TOPIC = '0x...';  // keccak256("OrderFilled(...)")

  async runIndexer(fromBlock: number, toBlock: number): Promise<number> {
    console.log(`🔍 Indexing blocks ${fromBlock} - ${toBlock}...`);

    // 1. 获取日志
    const logs = await this.provider.getLogs({
      address: this.EXCHANGE_ADDRESSES,
      topics: [this.ORDER_FILLED_TOPIC],
      fromBlock,
      toBlock
    });

    console.log(`📦 Found ${logs.length} OrderFilled events`);

    // 2. 解析日志
    const trades: DecodedTrade[] = [];
    for (const log of logs) {
      const decoded = this.tradeDecoder.decodeLog(log);
      trades.push(decoded);
    }

    // 3. 获取区块时间戳
    const blockCache = new Map<number, number>();
    for (const trade of trades) {
      if (!blockCache.has(trade.blockNumber)) {
        const block = await this.provider.getBlock(trade.blockNumber);
        blockCache.set(trade.blockNumber, block.timestamp);
      }
    }

    // 4. 关联市场并存储
    let inserted = 0;
    for (const trade of trades) {
      // 查找市场
      const market = await this.findMarketByTokenId(trade.tokenId);
      if (!market) {
        console.warn(`⚠️  Unknown tokenId ${trade.tokenId}, skipping trade ${trade.txHash}`);
        continue;
      }

      // 确定 outcome (YES or NO)
      const outcome = trade.tokenId === market.yes_token_id ? 'YES' : 'NO';

      // 存储交易
      try {
        await this.db.query(`
          INSERT INTO trades (
            market_id, tx_hash, log_index, block_number, block_timestamp,
            exchange, order_hash, maker, taker,
            maker_asset_id, taker_asset_id, maker_amount, taker_amount, fee,
            price, size, side, outcome, token_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (tx_hash, log_index) DO NOTHING
        `, [
          market.id, trade.txHash, trade.logIndex, trade.blockNumber, blockCache.get(trade.blockNumber),
          trade.exchange, trade.orderHash, trade.maker, trade.taker,
          trade.makerAssetId, trade.takerAssetId, trade.makerAmount, trade.takerAmount, trade.fee,
          trade.price, trade.size, trade.side, outcome, trade.tokenId
        ]);
        inserted++;
      } catch (err) {
        if (err.code === '23505') {  // Duplicate key
          console.log(`⏭️  Skipping duplicate trade ${trade.txHash}:${trade.logIndex}`);
        } else {
          throw err;
        }
      }
    }

    // 5. 更新同步状态
    await this.db.query(`
      INSERT INTO sync_state (key, last_block, last_block_hash, updated_at)
      VALUES ('trade_sync', $1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET last_block = $1, updated_at = NOW()
    `, [toBlock, '0x...']);  // 可选：记录 block hash

    console.log(`✅ Inserted ${inserted} trades, synced to block ${toBlock}`);
    return inserted;
  }

  private async findMarketByTokenId(tokenId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT id, yes_token_id, no_token_id FROM markets
      WHERE yes_token_id = $1 OR no_token_id = $1
    `, [tokenId]);

    return result.rows[0] || null;
  }
}
```

**断点续传逻辑**：
```typescript
async startContinuousSync(): Promise<void> {
  while (true) {
    // 1. 获取上次同步位置
    const lastBlock = await this.getLastSyncedBlock();
    const latestBlock = await this.provider.getBlockNumber();

    // 2. 分批处理（每次 10000 区块）
    const BATCH_SIZE = 10000;
    let fromBlock = lastBlock + 1;

    while (fromBlock <= latestBlock) {
      const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, latestBlock);

      try {
        await this.runIndexer(fromBlock, toBlock);
        fromBlock = toBlock + 1;
      } catch (err) {
        console.error(`❌ Error indexing blocks ${fromBlock}-${toBlock}:`, err);
        await sleep(5000);  // 等待 5 秒后重试
      }
    }

    // 3. 等待新区块
    console.log('💤 Synced to latest block, waiting for new blocks...');
    await sleep(30000);  // 30秒后再检查
  }
}
```

---

#### 任务 2.3: Query API - RESTful 接口

**实现**：
```typescript
// backend/polymarket-indexer/src/api/server.ts

import express from 'express';

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /events/:slug
app.get('/events/:slug', async (req, res) => {
  const { slug } = req.params;
  const result = await db.query('SELECT * FROM events WHERE slug = $1', [slug]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(result.rows[0]);
});

// GET /markets/:slug
app.get('/markets/:slug', async (req, res) => {
  const { slug } = req.params;
  const result = await db.query('SELECT * FROM markets WHERE slug = $1', [slug]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Market not found' });
  res.json(result.rows[0]);
});

// GET /markets/:slug/trades
app.get('/markets/:slug/trades', async (req, res) => {
  const { slug } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  const result = await db.query(`
    SELECT t.* FROM trades t
    JOIN markets m ON t.market_id = m.id
    WHERE m.slug = $1
    ORDER BY t.block_timestamp DESC
    LIMIT $2 OFFSET $3
  `, [slug, limit, offset]);

  res.json(result.rows);
});

// GET /tokens/:tokenId/trades
app.get('/tokens/:tokenId/trades', async (req, res) => {
  const { tokenId } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  const result = await db.query(`
    SELECT * FROM trades
    WHERE token_id = $1
    ORDER BY block_timestamp DESC
    LIMIT $2 OFFSET $3
  `, [tokenId, limit, offset]);

  res.json(result.rows);
});

app.listen(3001, () => console.log('🚀 Polymarket Indexer API running on port 3001'));
```

---

### 第三周：用户系统 + 认证

#### 任务 3.1: Auth Service - JWT 认证

**已实现的基础文件**（Phase 3 foundation）：
- ✅ `backend/auth-service/src/utils/jwt.ts` - JWT 生成和验证
- ✅ `backend/auth-service/src/utils/password.ts` - 密码哈希和验证
- ✅ `backend/auth-service/src/middleware/auth.ts` - 认证中间件
- ✅ `backend/auth-service/src/models/schema.ts` - 数据库 Schema

**待实现**：
```typescript
// backend/auth-service/src/routes/auth.ts

import express from 'express';
import { UserService } from '../services/userService';

const router = express.Router();
const userService = new UserService(db);

// POST /auth/register/email
router.post('/register/email', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const result = await userService.registerEmail({ email, username, password });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /auth/login/email
router.post('/login/email', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginEmail({ email, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(payload);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  await userService.invalidateSession(token);
  res.json({ message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const user = await userService.getUserById(req.userId);
  res.json(user);
});

export default router;
```

---

#### 任务 3.2: UserService 完整实现

```typescript
// backend/auth-service/src/services/userService.ts

export class UserService {
  async registerEmail(data: RegisterRequest): Promise<AuthResponse> {
    // 1. 验证密码强度
    // 2. 检查邮箱/用户名是否存在
    // 3. 哈希密码
    // 4. 插入用户
    // 5. 生成 JWT
    // 6. 存储 session
    // 7. 返回 user + tokens
  }

  async loginEmail(data: LoginRequest): Promise<AuthResponse> {
    // 1. 查询用户
    // 2. 验证密码
    // 3. 更新 last_login
    // 4. 生成 JWT
    // 5. 存储 session
    // 6. 返回 user + tokens
  }

  async loginWeb3(data: Web3LoginRequest): Promise<AuthResponse> {
    // 1. 验证签名 (EIP-191 / EIP-712)
    // 2. 恢复地址
    // 3. 查询或创建用户
    // 4. 生成 JWT
    // 5. 存储 session
    // 6. 返回 user + tokens
  }
}
```

---

### 第四周：通知系统 + 集成测试

#### 任务 4.1: Notification Service

```typescript
// backend/notification-service/src/index.ts

import nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';

export class NotificationService {
  private emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  private telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

  async sendEmail(userId: number, subject: string, body: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user.notification_settings.email) return;

    await this.emailTransporter.sendMail({
      from: 'noreply@nba-integrity-guard.com',
      to: user.email,
      subject,
      html: body
    });
  }

  async sendTelegram(userId: number, message: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user.notification_settings.telegram || !user.telegram_chat_id) return;

    await this.telegramBot.sendMessage(user.telegram_chat_id, message, { parse_mode: 'HTML' });
  }

  async notifySignalTriggered(userId: number, signal: any): Promise<void> {
    const template = await this.getTemplate('signal_triggered');

    const subject = template.email_subject
      .replace('{{gameId}}', signal.gameId);

    const body = template.email_body
      .replace('{{gameId}}', signal.gameId)
      .replace('{{riggingIndex}}', signal.riggingIndex)
      .replace('{{anomalyScore}}', signal.anomalyScore);

    await this.sendEmail(userId, subject, body);

    const telegramMsg = template.telegram_message
      .replace('{{gameId}}', signal.gameId)
      .replace('{{riggingIndex}}', signal.riggingIndex)
      .replace('{{anomalyScore}}', signal.anomalyScore);

    await this.sendTelegram(userId, telegramMsg);
  }
}
```

---

### 第五周：📊 数据分析与可视化 + 💰 交易风控工具

#### 任务 5.1: 市场情绪仪表盘服务

```typescript
// backend/analytics-service/src/services/marketSentimentService.ts

export class MarketSentimentService {
  /**
   * 实时聚合市场情绪数据
   * 融合链上数据 + 推特舆情
   */
  async aggregateMarketSentiment(marketId: number): Promise<void> {
    // 1. 链上数据采集
    const trades24h = await this.getTradesLast24h(marketId);
    const buyVolume = trades24h
      .filter(t => t.side === 'BUY')
      .reduce((sum, t) => sum + parseFloat(t.size), 0);
    const sellVolume = trades24h
      .filter(t => t.side === 'SELL')
      .reduce((sum, t) => sum + parseFloat(t.size), 0);

    const buyPressure = buyVolume / (buyVolume + sellVolume) * 100;
    const whaleActivity = trades24h
      .filter(t => parseFloat(t.size) > 1000)
      .reduce((sum, t) => sum + parseFloat(t.size), 0);

    // 2. 推特舆情采集（使用现有 Twitter Monitor）
    const twitterMentions = await this.getTwitterMentions(marketId);
    const sentimentScore = await this.calculateSentimentScore(twitterMentions);

    // 3. 综合评分
    const marketHeat = (buyPressure * 0.3 + sentimentScore * 50 * 0.4 +
                       (whaleActivity / 10000) * 0.3);

    // 4. 存储到数据库
    await this.db.query(`
      INSERT INTO market_sentiment (
        market_id, buy_pressure, sell_pressure, whale_activity,
        unique_traders_24h, total_volume_24h, twitter_mentions_24h,
        sentiment_score, market_heat, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (market_id) DO UPDATE SET
        buy_pressure = $2, sell_pressure = $3, market_heat = $9, updated_at = NOW()
    `, [marketId, buyPressure, 100-buyPressure, whaleActivity,
        new Set(trades24h.map(t => t.maker)).size,
        buyVolume + sellVolume, twitterMentions.length,
        sentimentScore, marketHeat]);
  }

  /**
   * 计算市场热度指数
   * 综合多个维度的权重
   */
  calculateMarketHeatIndex(data: any): number {
    const weights = {
      volumeRatio: 0.25,        // 成交量
      sentimentRatio: 0.25,     // 推特情绪
      whaleActivityRatio: 0.25, // 大额交易
      volatility: 0.15,         // 波动率
      uniqueTraders: 0.10       // 参与者数量
    };

    return (
      data.volumeRatio * weights.volumeRatio +
      data.sentimentRatio * weights.sentimentRatio +
      data.whaleActivityRatio * weights.whaleActivityRatio +
      data.volatility * weights.volatility +
      data.uniqueTraders * weights.uniqueTraders
    ) * 100;
  }
}
```

#### 任务 5.2: 价格趋势与深度分析

```typescript
// backend/analytics-service/src/services/priceAnalysisService.ts

export class PriceAnalysisService {
  /**
   * 生成 OHLCV 数据（1小时粒度）
   */
  async generateOHLCData(
    marketId: number,
    tokenId: string,
    hours: number = 24
  ): Promise<PriceCandle[]> {
    const trades = await this.getTradesByPeriod(marketId, tokenId, hours);

    const candles: PriceCandle[] = [];
    let currentHour = Math.floor(Date.now() / 3600000);

    for (let i = 0; i < hours; i++) {
      const hourTimestamp = (currentHour - i) * 3600;
      const hourTrades = trades.filter(t =>
        Math.floor(t.timestamp / 3600000) === currentHour - i
      );

      if (hourTrades.length > 0) {
        const prices = hourTrades.map(t => parseFloat(t.price));
        candles.push({
          timestamp: hourTimestamp,
          open: parseFloat(hourTrades[0].price),
          high: Math.max(...prices),
          low: Math.min(...prices),
          close: parseFloat(hourTrades[hourTrades.length - 1].price),
          volume: hourTrades.reduce((sum, t) => sum + parseFloat(t.size), 0),
          tradeCount: hourTrades.length
        });
      }
    }

    // 存储到时间序列表
    for (const candle of candles) {
      await this.db.query(`
        INSERT INTO price_history (
          market_id, token_id, timestamp, block_number,
          open, high, low, close, volume, trade_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (market_id, token_id, timestamp) DO UPDATE SET
          close = $8, volume = $9, trade_count = $10
      `, [marketId, tokenId, new Date(candle.timestamp), 0,
          candle.open, candle.high, candle.low, candle.close,
          candle.volume, candle.tradeCount]);
    }

    return candles;
  }

  /**
   * 计算技术指标
   */
  calculateTechnicalIndicators(candles: PriceCandle[]): TechnicalIndicators {
    return {
      ma20: this.calculateMA(candles, 20),
      ma50: this.calculateMA(candles, 50),
      rsi: this.calculateRSI(candles),
      bollingerBands: this.calculateBollingerBands(candles, 20, 2),
      macd: this.calculateMACD(candles)
    };
  }
}
```

#### 任务 5.3: 大额交易监测系统

```typescript
// backend/analytics-service/src/services/largeTradeDetector.ts

export class LargeTradeDetector {
  private WHALE_THRESHOLD = 5000;  // $5000+

  async detectAndMonitor(trades: Trade[]): Promise<void> {
    for (const trade of trades) {
      const amount = parseFloat(trade.size) * parseFloat(trade.price);

      if (amount > this.WHALE_THRESHOLD) {
        // 1. 计算异常评分
        const anomalyScore = await this.calculateAnomalyScore(trade);

        // 2. 标记鲸鱼账户
        const isWhale = await this.isWhaleAddress(trade.maker);
        const label = isWhale ? 'KNOWN_WHALE' : 'POTENTIAL_WHALE';

        // 3. 存储大额交易记录
        await this.db.query(`
          INSERT INTO large_trades (
            market_id, trade_id, tx_hash, timestamp,
            maker, taker, amount, price, side,
            is_whale, whale_label, anomaly_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [trade.marketId, trade.id, trade.txHash, trade.blockTimestamp,
            trade.maker, trade.taker, amount, trade.price, trade.side,
            isWhale, label, anomalyScore]);

        // 4. 触发告警
        if (anomalyScore > 0.75) {
          await this.notifyWhaleActivity({
            market: trade.marketId,
            trader: trade.maker,
            amount,
            label,
            anomalyScore
          });
        }
      }
    }
  }

  private async calculateAnomalyScore(trade: Trade): Promise<number> {
    // 基于多个维度计算异常评分
    const volume = parseFloat(trade.size) * parseFloat(trade.price);
    const avgVolume = await this.getAverageTradeVolume(trade.marketId, 24);
    const volumeRatio = volume / avgVolume;

    const priceDeviation = Math.abs(
      (parseFloat(trade.price) - await this.getMedianPrice(trade.marketId)) /
      await this.getMedianPrice(trade.marketId)
    );

    return (
      Math.min(volumeRatio / 10, 1) * 0.5 +  // 体量异常
      Math.min(priceDeviation, 1) * 0.3 +    // 价格异常
      (await this.checkMakerHistory(trade.maker)) * 0.2  // 历史行为
    );
  }
}
```

---

#### 任务 5.4: 智能下单系统

```typescript
// backend/trading-service/src/services/orderService.ts

export class OrderService {
  /**
   * 创建限价单，进行风控检查
   */
  async createLimitOrder(
    userId: number,
    marketId: number,
    orderData: CreateOrderRequest
  ): Promise<Order> {
    // 1. 风控检查
    const riskChecks = await this.performRiskChecks(userId, marketId, orderData);
    if (!riskChecks.passed) {
      throw new Error(`Risk check failed: ${riskChecks.reason}`);
    }

    // 2. 计算滑点保护
    const currentPrice = await this.getCurrentPrice(marketId, orderData.outcome);
    const priceLimit = orderData.side === 'BUY'
      ? currentPrice * (1 + orderData.slippageProtection)
      : currentPrice * (1 - orderData.slippageProtection);

    // 3. 创建订单
    const order = await this.db.query(`
      INSERT INTO orders (
        user_id, market_id, strategy_id,
        order_type, side, outcome,
        quantity, price, slippage_protection,
        max_loss, take_profit, position_limit,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
      RETURNING *
    `, [userId, marketId, orderData.strategyId,
        'LIMIT', orderData.side, orderData.outcome,
        orderData.quantity, orderData.price, orderData.slippageProtection,
        orderData.maxLoss, orderData.takeProfit, orderData.positionLimit]);

    return order.rows[0];
  }

  private async performRiskChecks(
    userId: number,
    marketId: number,
    orderData: CreateOrderRequest
  ): Promise<RiskCheckResult> {
    // 1. 检查头寸限额
    const currentPosition = await this.getUserPosition(userId, marketId);
    const newPosition = currentPosition + parseFloat(orderData.quantity);

    if (newPosition > parseFloat(orderData.positionLimit)) {
      return { passed: false, reason: 'Position limit exceeded' };
    }

    // 2. 检查最大风险
    const potentialLoss = parseFloat(orderData.quantity) * parseFloat(orderData.price);
    if (potentialLoss > parseFloat(orderData.maxLoss)) {
      return { passed: false, reason: 'Max loss limit exceeded' };
    }

    // 3. 检查账户资金
    const balance = await this.getUserBalance(userId);
    if (balance < potentialLoss) {
      return { passed: false, reason: 'Insufficient balance' };
    }

    return { passed: true };
  }
}
```

#### 任务 5.5: 持仓 PnL 实时计算

```typescript
// backend/trading-service/src/services/positionService.ts

export class PositionService {
  /**
   * 更新持仓的实时 PnL
   */
  async updatePositionPnL(userId: number, marketId: number): Promise<void> {
    const position = await this.getPosition(userId, marketId);
    if (!position) return;

    // 1. 获取当前价格
    const currentPrice = await this.getCurrentPrice(marketId, position.outcome);

    // 2. 计算 PnL
    const currentValue = position.quantity * currentPrice;
    const unrealizedPnL = currentValue - position.costBasis;
    const unrealizedPnLPct = (unrealizedPnL / position.costBasis * 100);

    // 3. 计算最大回撤
    const maxValue = await this.getPositionMaxValue(userId, marketId);
    const currentDrawdown = (maxValue - currentValue) / maxValue * 100;

    // 4. 更新数据库
    await this.db.query(`
      UPDATE positions SET
        current_price = $1,
        current_value = $2,
        unrealized_pnl = $3,
        unrealized_pnl_pct = $4,
        current_drawdown = $5,
        updated_at = NOW()
      WHERE user_id = $6 AND market_id = $7
    `, [currentPrice, currentValue, unrealizedPnL, unrealizedPnLPct,
        currentDrawdown, userId, marketId]);

    // 5. 检查 Take Profit / Stop Loss
    if (position.takeProfit && unrealizedPnL >= position.takeProfit) {
      await this.notifyPositionAction(userId, 'TAKE_PROFIT_REACHED', position);
    }

    if (position.maxRisk && unrealizedPnL <= -position.maxRisk) {
      await this.notifyPositionAction(userId, 'STOP_LOSS_TRIGGERED', position);
    }
  }

  /**
   * 场景分析：如果市场结算为 YES/NO，我的 PnL 会怎样
   */
  async analyzeSettlementScenarios(userId: number, marketId: number): Promise<ScenarioAnalysis> {
    const position = await this.getPosition(userId, marketId);

    return {
      ifYesWins: {
        pnl: position.outcome === 'YES'
          ? position.quantity * (1 - position.avgEntryPrice)
          : -position.costBasis,
        roi: ((position.outcome === 'YES' ? 1 : 0) - position.avgEntryPrice) * 100
      },
      ifNoWins: {
        pnl: position.outcome === 'NO'
          ? position.quantity * (1 - position.avgEntryPrice)
          : -position.costBasis,
        roi: ((position.outcome === 'NO' ? 1 : 0) - position.avgEntryPrice) * 100
      }
    };
  }
}
```

---

### 第六周：🚀 创新型应用 + 完整集成

#### 任务 6.1: 交易者画像系统

```typescript
// backend/analytics-service/src/services/traderProfileService.ts

export class TraderProfileService {
  /**
   * 分析交易风格并生成画像评分
   */
  async generateTraderProfile(userId: number): Promise<TraderProfile> {
    const trades = await this.getUserTrades(userId);
    const positions = await this.getUserPositions(userId);

    // 1. 基础统计
    const totalTrades = trades.length;
    const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.price) * parseFloat(t.size), 0);
    const winningTrades = trades.filter(t => parseFloat(t.realizedPnL) > 0);
    const winRate = winningTrades.length / totalTrades;

    // 2. 性能指标
    const returns = trades.map(t => parseFloat(t.realizedPnL) / (parseFloat(t.size) * parseFloat(t.price)));
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    const profitFactor = this.calculateProfitFactor(trades);

    // 3. 交易风格分析
    const preferences = await this.analyzeTradePreferences(trades);
    const avgHoldingTime = this.calculateAvgHoldingTime(trades);

    // 4. 综合评分
    const accountScore = (
      (winRate * 100) * 0.35 +
      (Math.min(sharpeRatio / 2, 100)) * 0.25 +
      ((1 - maxDrawdown) * 100) * 0.25 +
      (Math.min(profitFactor / 2, 100)) * 0.15
    );

    const reliabilityScore = winRate * 100;
    const predictionAccuracy = await this.calculatePredictionAccuracy(userId);

    // 5. 存储画像
    await this.db.query(`
      INSERT INTO trader_profiles (
        user_id, total_trades, total_volume, win_rate,
        avg_trade_pnl, sharpe_ratio, max_drawdown, profit_factor,
        preferred_outcome, avg_holding_time_hours,
        account_score, reliability_score, prediction_accuracy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (user_id) DO UPDATE SET
        account_score = $11, reliability_score = $12, prediction_accuracy = $13
    `, [userId, totalTrades, totalVolume, winRate,
        totalVolume / totalTrades * winRate, sharpeRatio, maxDrawdown, profitFactor,
        preferences.preferredOutcome, avgHoldingTime,
        accountScore, reliabilityScore, predictionAccuracy]);

    return { userId, accountScore, reliabilityScore, predictionAccuracy, preferences };
  }
}
```

#### 任务 6.2: 社交声誉与预测市场体系

```typescript
// backend/analytics-service/src/services/socialReputationService.ts

export class SocialReputationService {
  /**
   * 计算社交声誉评分
   */
  async calculateSocialReputation(userId: number, marketId: number): Promise<void> {
    // 1. 推特影响力
    const twitterData = await this.getTwitterMetrics(userId);
    const tweetAccuracy = await this.calculateTweetPredictionAccuracy(userId, marketId);

    // 2. 社区贡献
    const communityData = await this.getCommunityContributions(userId);

    // 3. 综合声誉评分
    const socialScore = (
      (twitterData.followers / 10000) * 0.25 +
      (tweetAccuracy * 100) * 0.35 +
      (communityData.reputationPoints / 1000) * 0.25 +
      (communityData.upvotes / (communityData.upvotes + communityData.downvotes + 1)) * 0.15
    ) * 100;

    // 4. 确定影响力等级
    const influenceLevel = this.determineInfluenceLevel(socialScore);

    // 5. 存储
    await this.db.query(`
      INSERT INTO social_reputation (
        user_id, market_id, twitter_followers, twitter_mentions_count,
        twitter_sentiment_avg, tweet_prediction_accuracy,
        community_posts, upvotes, downvotes, reputation_points,
        social_score, influence_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, market_id) DO UPDATE SET
        social_score = $11, influence_level = $12
    `, [userId, marketId,
        twitterData.followers, twitterData.mentions,
        twitterData.sentimentAvg, tweetAccuracy,
        communityData.posts, communityData.upvotes, communityData.downvotes,
        communityData.reputationPoints, socialScore, influenceLevel]);
  }

  private determineInfluenceLevel(score: number): string {
    if (score >= 80) return 'EXPERT';
    if (score >= 60) return 'INFLUENCER';
    if (score >= 40) return 'ACTIVE';
    return 'NOVICE';
  }
}
```

#### 任务 6.3: Polymarket 数据 API 聚合服务

```typescript
// backend/api-gateway/src/services/polymarketAggregationService.ts

export class PolymarketAggregationService {
  /**
   * 聚合 Gamma API + 本地索引器数据
   */
  async getMarketWithAggregatedData(slug: string): Promise<AggregatedMarket> {
    // 1. 从本地索引获取核心数据
    const localMarket = await this.polymarketIndexer.getMarket(slug);

    // 2. 从 Gamma API 获取补充信息
    const gammaData = await this.gammaClient.fetchMarket(slug);

    // 3. 聚合价格历史
    const priceHistory = await this.db.query(`
      SELECT timestamp, open, high, low, close, volume
      FROM price_history
      WHERE market_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `, [localMarket.id]);

    // 4. 聚合市场情绪
    const sentiment = await this.db.query(`
      SELECT * FROM market_sentiment
      WHERE market_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `, [localMarket.id]);

    // 5. 聚合大额交易
    const largeTrades = await this.db.query(`
      SELECT * FROM large_trades
      WHERE market_id = $1
      ORDER BY timestamp DESC
      LIMIT 20
    `, [localMarket.id]);

    // 6. 组合返回
    return {
      ...localMarket,
      ...gammaData,
      market: {
        conditionId: localMarket.condition_id,
        yesTokenId: localMarket.yes_token_id,
        noTokenId: localMarket.no_token_id,
        createdAt: localMarket.created_at,
        status: localMarket.status
      },
      prices: priceHistory.rows,
      sentiment: sentiment.rows[0],
      largeTrades: largeTrades.rows,
      // 添加订阅选项
      subscriptionUrl: `wss://api.nba-integrity-guard.com/markets/${slug}/stream`
    };
  }

  /**
   * WebSocket 实时订阅市场数据
   */
  setupRealtimeStream(slug: string, ws: WebSocket): void {
    const interval = setInterval(async () => {
      const data = await this.getMarketWithAggregatedData(slug);
      ws.send(JSON.stringify({
        type: 'market_update',
        data,
        timestamp: Date.now()
      }));
    }, 5000);  // 每5秒更新一次

    ws.on('close', () => clearInterval(interval));
  }
}
```

---

### Auth Service (`:3002`)

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/auth/register/email` | POST | ❌ | Email 注册 |
| `/auth/login/email` | POST | ❌ | Email 登录 |
| `/auth/login/web3` | POST | ❌ | Web3 钱包登录 |
| `/auth/refresh` | POST | ❌ | 刷新 Access Token |
| `/auth/logout` | POST | ✅ | 退出登录 |
| `/auth/me` | GET | ✅ | 获取当前用户信息 |

### Polymarket Indexer API (`:3001`)

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/events/:slug` | GET | ❌ | 获取事件详情 |
| `/events/:slug/markets` | GET | ❌ | 获取事件下的市场列表 |
| `/markets/:slug` | GET | ❌ | 获取市场详情 |
| `/markets/:slug/trades` | GET | ❌ | 获取市场交易记录 |
| `/tokens/:tokenId/trades` | GET | ❌ | 按 TokenId 查询交易 |

### Strategy Engine API (`:3000`) - 增强

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/strategies` | GET | ✅ | 获取用户策略列表 |
| `/strategies` | POST | ✅ | 创建新策略 |
| `/strategies/:id` | PUT | ✅ | 更新策略 |
| `/strategies/:id` | DELETE | ✅ | 删除策略 |
| `/trades` | GET | ✅ | 获取用户交易历史 |
| `/notifications` | GET | ✅ | 获取用户通知 |
| `/notifications/:id/read` | POST | ✅ | 标记通知已读 |

---

## 🧪 测试计划

### 单元测试

```bash
# Polymarket Indexer
npm run test:decoder  # Trade Decoder + Market Decoder
npm run test:indexer  # Trades Indexer

# Auth Service
npm run test:auth     # JWT + Password + UserService

# Strategy Engine
npm run test:strategy # User isolation + Strategy CRUD
```

### 集成测试

```bash
# 完整流程测试
1. 注册用户
2. 创建策略
3. Market Discovery (获取 Polymarket 市场)
4. Trade Indexer (扫描链上交易)
5. 查询交易历史
6. 触发通知
```

---

## 📦 Docker Compose 配置

```yaml
# docker-compose.yml

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nba_integrity
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  auth-service:
    build: ./backend/auth-service
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/nba_integrity
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}

  polymarket-indexer:
    build: ./backend/polymarket-indexer
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/nba_integrity
      POLYGON_RPC_URL: ${POLYGON_RPC_URL}
      GAMMA_API_URL: https://gamma-api.polymarket.com

  strategy-engine:
    build: ./backend/strategy-engine
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/nba_integrity
      REDIS_URL: redis://redis:6379

  notification-service:
    build: ./backend/notification-service
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/nba_integrity
      SMTP_HOST: ${SMTP_HOST}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}

volumes:
  postgres-data:
```

---

## ✅ 验收标准

### Week 1: Polymarket 数据解码

- [ ] Trade Decoder 正确解析 `OrderFilled` 事件
- [ ] Market Decoder 正确计算 YES/NO TokenId
- [ ] TokenId 与 Gamma API 数据一致
- [ ] 能够解析示例交易：`0x916cad96dd5c219997638133512fd17fe7c1ce72b830157e4fd5323cf4f19946`

### Week 2: Polymarket 索引器

- [ ] Market Discovery 成功从 Gamma API 获取市场
- [ ] Trades Indexer 扫描区块并存储交易
- [ ] 交易正确关联到市场（通过 TokenId）
- [ ] 幂等性：重复插入不产生重复数据
- [ ] Query API 正常响应 `/markets/:slug/trades`

### Week 3: 用户系统

- [ ] Email 注册/登录正常工作
- [ ] JWT Token 正确生成和验证
- [ ] Session 管理正常（refresh token）
- [ ] 用户策略 CRUD 正常
- [ ] 数据隔离：用户只能看到自己的交易

### Week 4: 通知系统

- [ ] Email 通知正常发送
- [ ] Telegram Bot 正常工作
- [ ] 信号触发时自动通知用户
- [ ] 通知模板系统工作正常

---

## 🚀 启动命令

```bash
# 1. 初始化数据库
npm run db:init

# 2. 启动所有服务
docker-compose up -d

# 3. Market Discovery (首次运行)
curl -X POST http://localhost:3001/discovery/events/will-there-be-another-us-government-shutdown-by-january-31

# 4. 启动 Trade Indexer
curl -X POST http://localhost:3001/indexer/start

# 5. 注册用户
curl -X POST http://localhost:3002/auth/register/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234"}'

# 6. 查询交易
curl http://localhost:3001/markets/will-there-be-another-us-government-shutdown-by-january-31/trades
```

---

## 📚 参考资源

1. **OGBC Intern Project**: https://github.com/ogalias/OGBC-Intern-Project
   - Stage 1: 链上数据解码
   - Stage 2: 索引器实现

2. **Polymarket 官方文档**:
   - Gamma API: https://gamma-api.polymarket.com/docs
   - Conditional Token Framework: https://docs.gnosis.io/conditionaltokens/

3. **技术栈文档**:
   - Ethers.js v6: https://docs.ethers.org/v6/
   - JWT: https://jwt.io/
   - PostgreSQL: https://www.postgresql.org/docs/

---

**Phase 3 完成后预期成果**：

✅ 完整的 Polymarket 链上数据索引系统
✅ 多用户认证和策略管理
✅ 实时通知系统
✅ RESTful API 完整覆盖
✅ 生产级错误处理和重试机制
✅ 完整的文档和测试

**代码行数预估**: 5,000+ 行（新增 2,500+）
**数据库表**: 15+ 张表
**API 端点**: 25+ 个

---

**Last Updated**: 2026-01-30
**Status**: 规划完成，待实施
**Next Step**: 开始 Week 1 - Polymarket 数据解码模块
