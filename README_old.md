# NBA Integrity Guard - 完整实施指南

## 项目概述

NBA Integrity Guard 是一个从 **Twitter 舆情采集 → 链上数据分析 → 自动交易执行 → 智能分账** 的完整闭环系统。该系统演示了从社交信号触发，到Polygon链上结算的端到端流程。

## 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                    NBA Integrity Guard                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Twitter    │  │  Polymarket  │  │   Strategy   │       │
│  │   Monitor    │  │   Watcher    │  │    Engine    │       │
│  │   (Python)   │  │  (Node.js)   │  │  (Node.js)   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │ PostgreSQL   │                           │
│                    │  Database    │                           │
│                    └──────┬───────┘                           │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │    Redis     │                           │
│                    │    Queue     │                           │
│                    └──────┬───────┘                           │
│                           │                                  │
│                    ┌──────▼──────────┐                       │
│                    │  Smart Contract  │                       │
│                    │ (Polygon Amoy)   │                       │
│                    └──────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
nba-integrity-guard/
├── backend/
│   ├── twitter-monitor/        # Python: Twitter数据采集
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── tweepy_client.py
│   │   ├── sentiment_analyzer.py
│   │   ├── database.py
│   │   └── Dockerfile
│   ├── market-watcher/         # Node.js: Polymarket数据同步
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── market.ts
│   │   │   ├── anomaly.ts
│   │   │   └── database.ts
│   │   └── Dockerfile
│   ├── strategy-engine/        # Node.js: 信号匹配与交易逻辑
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── signals.ts
│   │   │   ├── queue.ts
│   │   │   └── database.ts
│   │   └── Dockerfile
│   └── database/               # PostgreSQL配置
│       └── schema.sql
├── contracts/                  # Solidity: IntegrityVault合约
│   ├── contracts/
│   │   └── IntegrityVault.sol
│   ├── test/
│   │   └── IntegrityVault.test.ts
│   ├── scripts/
│   │   └── deploy.ts
│   ├── hardhat.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # CLI Dashboard
│   └── dashboard.py
├── docker-compose.yml          # 所有服务编排
├── .env.example                # 环境变量模板
├── .gitignore
└── README.md
```

## 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Git

### 1. 克隆项目并配置环境

```bash
cd nba-integrity-guard
cp .env.example .env
```

编辑 `.env` 文件，填入你的API密钥：

```bash
# Twitter API (从 https://developer.twitter.com 获取)
TWITTER_BEARER_TOKEN=your_bearer_token

# Polygon RPC (从 https://www.alchemy.com 获取)
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_api_key

# 钱包私钥（用于合约部署）
PRIVATE_KEY=your_wallet_private_key
```

### 2. 启动所有服务

```bash
docker-compose up -d
```

验证所有服务都在运行：

```bash
docker-compose ps
```

### 3. 查看日志

```bash
# Twitter Monitor
docker-compose logs -f twitter-monitor

# Market Watcher
docker-compose logs -f market-watcher

# Strategy Engine
docker-compose logs -f strategy-engine
```

### 4. 运行CLI Dashboard

```bash
cd frontend
pip install psycopg2-binary python-dotenv
python dashboard.py
```

## 模块详解

### 📱 Twitter Monitor (Python)

**功能**：实时监控Twitter上的NBA相关推文，计算"假球热度指数"

**关键指标**：
- **Rigging Index**: 综合推文数量、情绪分数、转发速度的指数
- **Sentiment Score**: 使用VADER和TextBlob进行情绪分析
- **Tweet Velocity**: 推文发布速度

**公式**：
```
Rigging Index = (tweet_count * 0.4) + (avg_sentiment * -0.3) + (retweet_velocity * 0.3)
```

**输出示例**：
```json
{
  "game_id": "NBA_20250130_LAL_BOS",
  "timestamp": "2025-01-30T15:30:00Z",
  "rigging_index": 0.72,
  "tweet_count": 234,
  "avg_sentiment": -0.45,
  "sample_tweets": [...]
}
```

### 📊 Market Watcher (Node.js)

**功能**：从Polymarket实时读取市场数据，检测异常波动

**异常检测逻辑**：
- 1分钟内赔率变化 > 15% → 标记异常
- Bid-Ask Spread > 5% → 流动性干涸
- 流动性 < $10,000 → 低流动性警告

**输出示例**：
```json
{
  "market_id": "0x1234...",
  "game_id": "NBA_20250130_LAL_BOS",
  "yes_price": 0.62,
  "no_price": 0.38,
  "spread_bps": 400,
  "liquidity": 50000,
  "anomaly_detected": true,
  "anomaly_score": 0.85
}
```

### ⚙️ Strategy Engine (Node.js)

**功能**：核心引擎，匹配信号、管理任务队列、执行交易

**信号匹配逻辑**：
```
IF (Rigging Index > 0.65) AND (Anomaly Score > 0.75)
THEN → HIGH_RISK_HEDGE 信号
```

**信号类型**：
- `HIGH_RISK_HEDGE`: 高风险对冲 (赔率 1.5x)
- `MEDIUM_RISK`: 中等风险 (赔率 1.0x)
- `LOW_RISK`: 低风险 (赔率 0.5x)
- `NO_SIGNAL`: 无信号

**任务队列**（使用BullMQ + Redis）：
- `TRADE_SIGNAL`: 交易执行队列 (优先级: HIGH)
- `DISTRIBUTION_SIGNAL`: 分账队列 (优先级: LOW)
- `ALERT_SIGNAL`: 警报队列 (优先级: MEDIUM)

**API端点**：

```bash
# 健康检查
curl http://localhost:3000/health

# 提交信号
curl -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{
    "riggingIndex": 0.72,
    "anomalyScore": 0.85,
    "gameId": "NBA_20250130_LAL_BOS",
    "marketId": "0x1234..."
  }'

# 查询最近交易
curl http://localhost:3000/trades?limit=10

# 执行分账
curl -X POST http://localhost:3000/distribution \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "TRX_20250130_ABC123",
    "totalProfit": 1000
  }'
```

### 💰 Smart Contract (Solidity)

**功能**：管理资金存入、利润记录、自动分账

**分账公式**：
```solidity
hedgeAmount = totalProfit * 50 / 100;     // 50% 对冲仓位
opsFee = totalProfit * 5 / 100;            // 5% 平台费
userReward = totalProfit - hedgeAmount - opsFee;  // 45% 用户收益
```

**主要函数**：
- `deposit()`: 用户存入资金
- `recordProfit(amount)`: 记录利润
- `executeDistribution()`: 执行分账
- `getDistributionStatus()`: 查询分账状态

**部署到Polygon Amoy**：

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

**运行测试**：

```bash
npx hardhat test
```

## 数据库架构

### 表结构

#### `twitter_data`
```sql
- id: SERIAL PRIMARY KEY
- game_id: VARCHAR(100)
- rigging_index: DECIMAL(5,4)
- tweet_count: INTEGER
- avg_sentiment: DECIMAL(5,4)
- sample_tweets: JSONB
- timestamp: TIMESTAMP
```

#### `market_data`
```sql
- id: SERIAL PRIMARY KEY
- market_id: VARCHAR(100)
- game_id: VARCHAR(100)
- yes_price: DECIMAL(10,8)
- no_price: DECIMAL(10,8)
- spread_bps: INTEGER
- liquidity: DECIMAL(20,2)
- anomaly_detected: BOOLEAN
- anomaly_score: DECIMAL(5,4)
- timestamp: TIMESTAMP
```

#### `trades`
```sql
- id: SERIAL PRIMARY KEY
- trade_id: VARCHAR(100) UNIQUE
- signal_type: VARCHAR(50)
- action: VARCHAR(20)
- market_id: VARCHAR(100)
- game_id: VARCHAR(100)
- amount: DECIMAL(20,2)
- estimated_payout: DECIMAL(20,2)
- actual_payout: DECIMAL(20,2)
- status: VARCHAR(20)
- timestamp: TIMESTAMP
```

#### `distributions`
```sql
- id: SERIAL PRIMARY KEY
- trade_id: VARCHAR(100) REFERENCES trades
- total_profit: DECIMAL(20,2)
- hedge_amount: DECIMAL(20,2)
- ops_fee: DECIMAL(20,2)
- user_reward: DECIMAL(20,2)
- status: VARCHAR(20)
- timestamp: TIMESTAMP
```

## 完整工作流示例

### 场景：Lakers vs Celtics 比赛

1. **Twitter Monitor 采集数据** (15:30:00)
   ```
   推文数: 234
   平均情绪: -0.45 (负面)
   Rigging Index: 0.72 ↑
   ```

2. **Market Watcher 检测异常** (15:30:05)
   ```
   Yes Price: 0.62 → 0.58 (下跌 6.5%)
   Anomaly Score: 0.85 ↑
   ```

3. **Strategy Engine 匹配信号** (15:30:10)
   ```
   IF (0.72 > 0.65) AND (0.85 > 0.75)
   THEN → HIGH_RISK_HEDGE 信号 ✓
   ```

4. **生成交易** (15:30:15)
   ```
   Trade ID: TRX_20250130_ABC123
   Action: BET_NO (对Lakers不利)
   Amount: $1,500 (1.5x 基础金额)
   Estimated Payout: $2,700
   ```

5. **执行分账** (比赛结束后)
   ```
   Total Profit: $1,200
   Hedge Amount: $600 (50%)
   Ops Fee: $60 (5%)
   User Reward: $540 (45%)
   ```

## 验证完整闭环

### 1. 检查所有服务状态

```bash
docker-compose ps
```

### 2. 查询数据库

```bash
# 连接到PostgreSQL
docker-compose exec postgres psql -U admin -d nba_integrity

# 查询最近的Twitter数据
SELECT * FROM twitter_data ORDER BY timestamp DESC LIMIT 5;

# 查询最近的市场数据
SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 5;

# 查询最近的交易
SELECT * FROM trades ORDER BY timestamp DESC LIMIT 5;

# 查询信号日志
SELECT * FROM signal_logs ORDER BY timestamp DESC LIMIT 10;
```

### 3. 测试Strategy Engine API

```bash
# 发送测试信号
curl -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{
    "riggingIndex": 0.72,
    "anomalyScore": 0.85,
    "gameId": "NBA_20250130_LAL_BOS",
    "marketId": "0x1234567890abcdef"
  }'

# 查看响应
# 应该返回 HIGH_RISK_HEDGE 信号和生成的交易
```

### 4. 验证合约部署

```bash
# 查看部署日志
docker-compose logs strategy-engine | grep "deployed to"

# 或手动部署
cd contracts
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

## 环境变量配置

### 必需的环境变量

```bash
# 数据库
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nba_integrity
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Twitter API
TWITTER_BEARER_TOKEN=your_bearer_token

# Polygon
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_api_key

# 策略参数
RIGGING_INDEX_THRESHOLD=0.65
ANOMALY_SCORE_THRESHOLD=0.75
DEFAULT_BET_AMOUNT=1000

# 合约
PRIVATE_KEY=your_wallet_private_key
```

## 故障排除

### 问题1: PostgreSQL 连接失败

```bash
# 检查PostgreSQL容器
docker-compose logs postgres

# 重启PostgreSQL
docker-compose restart postgres

# 等待30秒后重试
```

### 问题2: Redis 连接失败

```bash
# 检查Redis容器
docker-compose logs redis

# 测试Redis连接
docker-compose exec redis redis-cli ping
```

### 问题3: Strategy Engine 无法启动

```bash
# 检查日志
docker-compose logs strategy-engine

# 确保PostgreSQL和Redis都已启动
docker-compose up -d postgres redis
sleep 10
docker-compose up -d strategy-engine
```

### 问题4: Twitter API 限流

```bash
# 检查API配额
# Twitter API v2 Free tier: 300 requests/15 minutes

# 增加轮询间隔
# 编辑 backend/twitter-monitor/main.py
# 修改 self.poll_interval = 60  # 改为60秒
```

## 性能优化建议

1. **数据库优化**
   - 添加更多索引
   - 定期清理旧数据
   - 使用分区表

2. **缓存优化**
   - 使用Redis缓存热数据
   - 实现LRU缓存策略

3. **队列优化**
   - 调整BullMQ并发数
   - 实现死信队列处理

4. **API优化**
   - 添加速率限制
   - 实现请求缓存

## 安全建议

1. **API安全**
   - 添加API密钥认证
   - 实现CORS策略
   - 使用HTTPS

2. **数据库安全**
   - 使用强密码
   - 启用SSL连接
   - 定期备份

3. **合约安全**
   - 进行安全审计
   - 使用多签钱包
   - 实现紧急暂停机制

## 下一步

1. **集成真实数据源**
   - 连接真实Twitter API
   - 连接真实Polymarket数据

2. **实现实际交易**
   - 集成Polymarket交易API
   - 实现风险管理

3. **部署到生产环境**
   - 使用Kubernetes编排
   - 实现监控和告警
   - 设置自动扩展

## 许可证

MIT

## 联系方式

如有问题或建议，请提交Issue或Pull Request。

---

**最后更新**: 2025-01-30
