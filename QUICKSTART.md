# NBA Integrity Guard - 快速开始指南

## 🎯 5分钟快速启动

### 步骤1: 克隆并进入项目目录
```bash
cd nba-integrity-guard
```

### 步骤2: 配置环境变量
```bash
cp .env.example .env
nano .env  # 或使用你喜欢的编辑器
```

**最小配置**（用于演示）:
```bash
# 数据库配置（保持默认即可）
POSTGRES_PASSWORD=your_secure_password

# 其他配置可以暂时使用默认值
```

**完整配置**（用于生产）:
```bash
# Twitter API (从 https://developer.twitter.com 获取)
TWITTER_BEARER_TOKEN=your_actual_bearer_token

# Polygon RPC (从 https://www.alchemy.com 获取)
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_api_key

# 钱包私钥（用于合约部署）
PRIVATE_KEY=your_wallet_private_key
```

### 步骤3: 启动所有服务
```bash
./start.sh
```

或手动启动:
```bash
docker-compose up -d
```

### 步骤4: 验证服务状态
```bash
# 检查所有服务
docker-compose ps

# 应该看到5个服务都在运行:
# - postgres
# - redis
# - twitter-monitor
# - market-watcher
# - strategy-engine
```

### 步骤5: 测试API
```bash
# 健康检查
curl http://localhost:3000/health

# 应该返回:
# {"status":"ok","timestamp":"...","running":true}
```

## 🧪 快速测试

### 测试1: 提交信号（应触发HIGH_RISK_HEDGE）
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

**预期结果**:
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
    "trade_id": "TRX_20250130_...",
    "signal_type": "HIGH_RISK_HEDGE",
    "action": "BET_NO",
    "amount": 1500,
    "estimated_payout": 2700,
    "status": "PENDING_EXECUTION"
  }
}
```

### 测试2: 查询交易记录
```bash
curl http://localhost:3000/trades?limit=5
```

### 测试3: 查看数据库
```bash
# 连接到PostgreSQL
docker-compose exec postgres psql -U admin -d nba_integrity

# 查询交易
SELECT * FROM trades ORDER BY timestamp DESC LIMIT 5;

# 查询信号日志
SELECT * FROM signal_logs ORDER BY timestamp DESC LIMIT 5;

# 退出
\q
```

## 📊 运行Dashboard

### 安装依赖
```bash
cd frontend
pip install psycopg2-binary python-dotenv
```

### 启动Dashboard
```bash
python dashboard.py
```

**预期输出**:
```
┌──────────────────────────────────────────────────────────┐
│          NBA Integrity Guard - Live Dashboard            │
└──────────────────────────────────────────────────────────┘

📱 Twitter Sentiment Analysis (Last 5 min):
   Rigging Index: 0.7200 ↑
   Tweet Count: 234
   Avg Sentiment: -0.4500

📊 Polymarket Anomaly Detection:
   Status: ⚠️  ANOMALY DETECTED
   Anomaly Score: 0.8500

💰 Recent Trades:
   ✓ TRX_20250130_ABC123 | HIGH_RISK_HEDGE | BET_NO | $1500

🔔 Recent Signals:
   [HIGH_RISK_HEDGE] Rigging: 0.7200, Anomaly: 0.8500
```

## 🔍 查看日志

### 查看所有服务日志
```bash
docker-compose logs -f
```

### 查看特定服务日志
```bash
# Twitter Monitor
docker-compose logs -f twitter-monitor

# Market Watcher
docker-compose logs -f market-watcher

# Strategy Engine
docker-compose logs -f strategy-engine
```

## 🧪 运行智能合约测试

```bash
cd contracts
npm install
npx hardhat test
```

**预期输出**:
```
IntegrityVault
  Deployment
    ✓ Should set the right owner
    ✓ Should initialize with zero deposits and profits
  Deposits
    ✓ Should accept deposits
    ✓ Should reject zero deposits
  ...

15 passing (2s)
```

## 🚀 部署智能合约

### 本地测试网
```bash
# 启动本地Hardhat节点
npx hardhat node

# 在另一个终端部署
npx hardhat run scripts/deploy.ts --network localhost
```

### Polygon Amoy测试网
```bash
# 确保.env中配置了PRIVATE_KEY和POLYGON_RPC_URL
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

## 📈 完整工作流演示

### 场景: Lakers vs Celtics 比赛

1. **插入模拟Twitter数据**
```bash
docker-compose exec postgres psql -U admin -d nba_integrity -c "
INSERT INTO twitter_data (game_id, rigging_index, tweet_count, avg_sentiment, sample_tweets, timestamp)
VALUES ('NBA_20250130_LAL_BOS', 0.72, 234, -0.45, '[]'::jsonb, NOW());
"
```

2. **插入模拟市场数据**
```bash
docker-compose exec postgres psql -U admin -d nba_integrity -c "
INSERT INTO market_data (market_id, game_id, yes_price, no_price, spread_bps, liquidity, anomaly_detected, anomaly_score, timestamp)
VALUES ('0x1234567890abcdef', 'NBA_20250130_LAL_BOS', 0.62, 0.38, 400, 50000, true, 0.85, NOW());
"
```

3. **提交信号到Strategy Engine**
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

4. **验证交易已创建**
```bash
docker-compose exec postgres psql -U admin -d nba_integrity -c "
SELECT trade_id, signal_type, action, amount, estimated_payout, status
FROM trades
WHERE game_id = 'NBA_20250130_LAL_BOS'
ORDER BY timestamp DESC
LIMIT 1;
"
```

5. **执行分账**
```bash
# 获取trade_id后执行
curl -X POST http://localhost:3000/distribution \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "TRX_20250130_ABC123",
    "totalProfit": 1200
  }'
```

6. **验证分账记录**
```bash
docker-compose exec postgres psql -U admin -d nba_integrity -c "
SELECT trade_id, total_profit, hedge_amount, ops_fee, user_reward, status
FROM distributions
ORDER BY timestamp DESC
LIMIT 1;
"
```

**预期结果**:
```
trade_id          | total_profit | hedge_amount | ops_fee | user_reward | status
------------------+--------------+--------------+---------+-------------+--------
TRX_20250130_...  |      1200.00 |       600.00 |   60.00 |      540.00 | PENDING
```

## 🛑 停止服务

```bash
./stop.sh
```

或手动停止:
```bash
docker-compose down
```

## 🗑️ 清理数据

### 停止并删除所有数据
```bash
docker-compose down -v
```

### 只清理数据库表
```bash
docker-compose exec postgres psql -U admin -d nba_integrity -c "
TRUNCATE TABLE twitter_data CASCADE;
TRUNCATE TABLE market_data CASCADE;
TRUNCATE TABLE trades CASCADE;
TRUNCATE TABLE signal_logs CASCADE;
TRUNCATE TABLE distributions CASCADE;
"
```

## ❓ 常见问题

### Q1: 服务启动失败
```bash
# 检查Docker是否运行
docker ps

# 查看错误日志
docker-compose logs

# 重启服务
docker-compose restart
```

### Q2: 无法连接到PostgreSQL
```bash
# 检查PostgreSQL是否就绪
docker-compose exec postgres pg_isready -U admin

# 等待30秒后重试
sleep 30
```

### Q3: Strategy Engine返回500错误
```bash
# 检查日志
docker-compose logs strategy-engine

# 确保PostgreSQL和Redis都在运行
docker-compose ps postgres redis
```

### Q4: Dashboard无法连接数据库
```bash
# 检查.env配置
cat .env | grep POSTGRES

# 确保使用正确的主机名
# Docker内部: POSTGRES_HOST=postgres
# 本地运行: POSTGRES_HOST=localhost
```

## 📚 更多资源

- **完整文档**: `README.md`
- **测试指南**: `TESTING.md`
- **项目总结**: `PROJECT_SUMMARY.md`

## ✅ 成功验证清单

完成以下检查确认系统正常运行:

- [ ] `docker-compose ps` 显示所有5个服务都在运行
- [ ] `curl http://localhost:3000/health` 返回200状态码
- [ ] 提交信号后返回正确的signal和trade对象
- [ ] 数据库中可以查询到trades记录
- [ ] Dashboard可以正常显示数据
- [ ] 智能合约测试全部通过

## 🎉 恭喜!

如果所有检查都通过，说明NBA Integrity Guard系统已经成功运行！

现在你可以:
1. 探索API端点
2. 查看实时数据
3. 测试不同的信号组合
4. 部署智能合约到测试网
5. 自定义策略参数

---

**需要帮助?** 查看 `TESTING.md` 获取详细测试指南
