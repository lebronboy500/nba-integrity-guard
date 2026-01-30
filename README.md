# NBA Integrity Guard

**基于 Polygon 链的 NBA 赛事诚信监控与自动对冲系统**
A Web3 integrity monitoring and automated hedging system for NBA games on Polygon.

---

## 📖 项目概述 (Overview)

**NBA Integrity Guard** 是一个探索体育赛事诚信监督的 Web3 实验项目。

在传统体育领域，假球、黑哨等诚信问题难以被及时发现和响应。本项目利用：
- **社交舆情** (Twitter实时推文情绪分析)
- **市场异常** (Polymarket赔率波动检测)
- **智能合约** (Polygon链上自动分账)

构建一个**从信号捕获到资金分配的全自动闭环系统**。

当 Twitter 出现大量负面讨论 + Polymarket 出现异常赔率波动时，系统自动：
1. 触发 **HIGH_RISK_HEDGE** 信号
2. 执行对冲交易（模拟）
3. 利润自动分账（50% 反腐败基金 + 5% 平台 + 45% 用户）

---

## ✨ 主要功能 (Features)

### 🔍 **实时监控**
- **Twitter舆情监控**: 每30秒采集NBA相关推文，计算"假球热度指数"（Rigging Index）
- **Polymarket异常检测**: 监控赔率波动、流动性干涸、买卖价差异常

### 🧠 **智能信号匹配**
- 多维度数据融合（Rigging Index + Anomaly Score）
- 自动触发三级风险信号（HIGH/MEDIUM/LOW）
- 基于BullMQ的任务队列管理

### ⛓️ **链上自动分账**
- Polygon Amoy测试网智能合约
- 自动执行利润分配：50% hedge + 5% ops + 45% user
- 透明、不可篡改、可验证

### 📊 **实时Dashboard**
- CLI终端实时展示系统运行状态
- 显示最新舆情指标、异常分数、交易记录

---

## 🚀 演示地址 / GitHub

- **GitHub**: [https://github.com/yourusername/nba-integrity-guard](https://github.com/yourusername/nba-integrity-guard)
- **文档**: [完整实施指南](./README.md)

---

## ⛓️ 链信息（Polygon Amoy）

| 项目 | 信息 |
|------|------|
| **Network** | Polygon Amoy Testnet |
| **Chain ID** | 80002 |
| **RPC** | https://rpc-amoy.polygon.technology |
| **Explorer** | https://amoy.polygonscan.com |
| **合约地址 (IntegrityVault)** | *待部署* |
| **计价单位** | MATIC |

> 💡 提示：在 `.env` 中配置你的 `POLYGON_RPC_URL` 和 `PRIVATE_KEY` 以部署合约

---

## 🏗️ 系统架构（ASCII）

```
┌─────────────────────────────────────────────────────────────────┐
│                      NBA Integrity Guard                        │
└─────────────────────────────────────────────────────────────────┘

    Twitter API          Polymarket GraphQL         Strategy Engine
         │                      │                          │
         ▼                      ▼                          ▼
┌────────────────┐     ┌────────────────┐       ┌──────────────────┐
│ Twitter Monitor│     │ Market Watcher │       │ Strategy Engine  │
│   (Python)     │────▶│   (Node.js)    │──────▶│   (Express API)  │
│                │     │                │       │                  │
│ • Tweepy       │     │ • Apollo GQL   │       │ • Signal Match   │
│ • VADER/TextB. │     │ • Anomaly Det. │       │ • BullMQ Queue   │
└────────┬───────┘     └────────┬───────┘       └────────┬─────────┘
         │                      │                        │
         └──────────────────────┼────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   PostgreSQL + Redis  │
                    │   • twitter_data      │
                    │   • market_data       │
                    │   • trades            │
                    │   • signal_logs       │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  IntegrityVault.sol   │
                    │  (Polygon Amoy)       │
                    │                       │
                    │  • deposit()          │
                    │  • recordProfit()     │
                    │  • executeDistribution() │
                    └───────────────────────┘
```

---

## 🎯 核心功能流程

### 1️⃣ **数据采集**
```python
# Twitter Monitor (Python)
推文采集 → 情绪分析 → Rigging Index 计算 → DB存储
```

**Rigging Index 公式**:
```
Rigging Index = (tweet_count * 0.4) +
                (avg_sentiment * -0.3) +
                (retweet_velocity * 0.3)
```

### 2️⃣ **异常检测**
```typescript
// Market Watcher (Node.js)
赔率监控 → 价格波动检测 → Anomaly Score 计算 → DB存储
```

**异常判定**:
- 价格变化 > 15% → +0.4分
- Spread > 500 bps → +0.3分
- 流动性 < $10k → +0.2分

### 3️⃣ **信号匹配**
```typescript
// Strategy Engine
IF (Rigging Index > 0.65) AND (Anomaly Score > 0.75)
  THEN → HIGH_RISK_HEDGE 信号
  → 执行 1.5x 基础金额交易
```

### 4️⃣ **自动分账**
```solidity
// IntegrityVault.sol
hedgeAmount = totalProfit * 50 / 100;  // 50%
opsFee = totalProfit * 5 / 100;        // 5%
userReward = totalProfit * 45 / 100;   // 45%
```

---

## 🛠️ 本地安装与运行

### 前置要求
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Git

### 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/nba-integrity-guard.git
cd nba-integrity-guard

# 2. 配置环境变量
cp .env.example .env
nano .env  # 编辑API密钥

# 3. 一键启动所有服务
./start.sh

# 4. 验证服务状态
docker-compose ps
curl http://localhost:3000/health
```

### 运行 Dashboard

```bash
cd frontend
pip install psycopg2-binary python-dotenv
python dashboard.py
```

---

## 🔐 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# 数据库配置
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nba_integrity
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379

# Twitter API (从 https://developer.twitter.com 获取)
TWITTER_BEARER_TOKEN=your_bearer_token

# Polymarket配置
POLYMARKET_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/polymarket/polymarket

# Polygon配置 (从 https://www.alchemy.com 获取)
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_api_key
PRIVATE_KEY=your_wallet_private_key

# 策略参数
RIGGING_INDEX_THRESHOLD=0.65
ANOMALY_SCORE_THRESHOLD=0.75
DEFAULT_BET_AMOUNT=1000

# API端口
STRATEGY_ENGINE_PORT=3000
```

---

## 📦 合约部署（Polygon Amoy）

### 编译合约

```bash
cd contracts
npm install
npx hardhat compile
```

### 运行测试

```bash
npx hardhat test
```

**预期输出**:
```
IntegrityVault
  ✓ Should set the right owner
  ✓ Should accept deposits
  ✓ Should record profits
  ✓ Should execute distribution correctly
  ✓ Should calculate correct distribution amounts
  ...

15 passing (2s)
```

### 部署到测试网

```bash
# 确保 .env 中配置了 PRIVATE_KEY 和 POLYGON_RPC_URL
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

**部署后记录合约地址**:
```
IntegrityVault deployed to: 0x1234567890abcdef...
```

---

## 🧪 测试示例

### 1. 提交信号（应触发 HIGH_RISK_HEDGE）

```bash
curl -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{
    "riggingIndex": 0.72,
    "anomalyScore": 0.85,
    "gameId": "NBA_20250130_LAL_BOS",
    "marketId": "0x1234567890abcdef"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "signal": {
    "type": "HIGH_RISK_HEDGE",
    "confidence": 1.0,
    "reasons": [
      "High rigging index: 0.72",
      "High anomaly score: 0.85"
    ]
  },
  "trade": {
    "trade_id": "TRX_20250130_ABC123",
    "action": "BET_NO",
    "amount": 1500,
    "estimated_payout": 2700
  }
}
```

### 2. 查询交易记录

```bash
curl http://localhost:3000/trades?limit=5
```

### 3. 执行分账

```bash
curl -X POST http://localhost:3000/distribution \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "TRX_20250130_ABC123",
    "totalProfit": 1200
  }'
```

---

## 📊 API端点

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/health` | GET | 健康检查 | - |
| `/signal` | POST | 提交信号 | `riggingIndex`, `anomalyScore`, `gameId`, `marketId` |
| `/trades` | GET | 查询交易 | `limit` (可选) |
| `/distribution` | POST | 执行分账 | `tradeId`, `totalProfit` |

---

## 🗄️ 数据库架构

### 核心表结构

```sql
-- Twitter数据
twitter_data (
  game_id, rigging_index, tweet_count,
  avg_sentiment, sample_tweets, timestamp
)

-- 市场数据
market_data (
  market_id, game_id, yes_price, no_price,
  spread_bps, liquidity, anomaly_score, timestamp
)

-- 交易记录
trades (
  trade_id, signal_type, action, market_id,
  amount, estimated_payout, status, timestamp
)

-- 分账记录
distributions (
  trade_id, total_profit, hedge_amount,
  ops_fee, user_reward, status
)
```

---

## 📈 系统监控

### 查看服务日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f twitter-monitor
docker-compose logs -f market-watcher
docker-compose logs -f strategy-engine
```

### 查询数据库

```bash
docker-compose exec postgres psql -U admin -d nba_integrity

# 查询最近的信号
SELECT * FROM signal_logs ORDER BY timestamp DESC LIMIT 5;

# 查询最近的交易
SELECT * FROM trades ORDER BY timestamp DESC LIMIT 5;
```

---

## 🏗️ 构建与部署

### 本地开发

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 生产部署（示例）

```bash
# 1. 部署数据库和缓存
# 使用云服务（AWS RDS, Redis Cloud等）

# 2. 部署后端服务
# 使用 Kubernetes 或 Docker Swarm

# 3. 配置环境变量
# 使用 Secrets Manager

# 4. 启动服务
kubectl apply -f k8s/

# 5. 配置监控
# Prometheus + Grafana
```

---

## 📚 项目文档

- **[完整实施指南](./README.md)** - 详细的架构和实现说明
- **[快速开始指南](./QUICKSTART.md)** - 5分钟快速启动
- **[测试指南](./TESTING.md)** - 完整的测试流程
- **[项目总结](./PROJECT_SUMMARY.md)** - 技术栈和统计
- **[实施报告](./IMPLEMENTATION_REPORT.md)** - 项目完成报告

---

## 🎯 应用场景

1. **赛事诚信监控** - 实时监控社交舆情和市场异常
2. **自动风险对冲** - 基于信号自动执行对冲策略
3. **透明资金管理** - 智能合约自动分账，公开透明
4. **数据分析研究** - 情绪分析与市场行为研究
5. **教育演示** - Web3 + 数据分析完整案例

---

## 🔒 安全说明

### 智能合约安全
- ✅ Owner权限控制
- ✅ 重入攻击防护
- ✅ 输入验证
- ⚠️ **注意**: 本项目为演示用途，未经专业审计，不建议用于生产环境

### API安全
- ✅ 输入验证
- ✅ 错误处理
- 🚧 **建议**: 添加API密钥认证、速率限制

### 数据安全
- ✅ 环境变量隔离
- ✅ PostgreSQL参数化查询
- 🚧 **建议**: 启用SSL连接、定期备份

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

```bash
# Fork 项目
git clone https://github.com/yourusername/nba-integrity-guard.git

# 创建特性分支
git checkout -b feature/your-feature

# 提交更改
git commit -m "Add some feature"

# 推送到分支
git push origin feature/your-feature

# 创建 Pull Request
```

---

## 📄 许可证

MIT License

Copyright (c) 2025 NBA Integrity Guard

---

## 🙏 致谢

- **Monad 社区** - 提供高性能区块链基础设施灵感
- **Polymarket** - 去中心化预测市场
- **Twitter API** - 社交数据源
- **OpenZeppelin** - 智能合约标准库

---

## 📞 联系方式

- **GitHub Issues**: [提交问题](https://github.com/yourusername/nba-integrity-guard/issues)
- **Twitter**: [@YourTwitter](https://twitter.com/yourtwitter)
- **Email**: your.email@example.com

---

**⚡ 由 Docker + Python + TypeScript + Solidity 驱动**
**🏀 让体育赛事更诚信，让数据说话**

---

<p align="center">
  Made with ❤️ for the Web3 & Sports community
</p>
