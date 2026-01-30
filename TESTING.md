# NBA Integrity Guard - Testing Guide

## Overview

This guide provides comprehensive testing instructions for all components of the NBA Integrity Guard system.

## Prerequisites

- All services running via `docker-compose up -d`
- PostgreSQL database initialized
- Redis running
- Strategy Engine API accessible at http://localhost:3000

## 1. Database Testing

### Connect to PostgreSQL

```bash
docker-compose exec postgres psql -U admin -d nba_integrity
```

### Verify Schema

```sql
-- List all tables
\dt

-- Check twitter_data table
SELECT COUNT(*) FROM twitter_data;

-- Check market_data table
SELECT COUNT(*) FROM market_data;

-- Check trades table
SELECT COUNT(*) FROM trades;

-- Check signal_logs table
SELECT COUNT(*) FROM signal_logs;
```

### Insert Test Data

```sql
-- Insert test Twitter data
INSERT INTO twitter_data (game_id, rigging_index, tweet_count, avg_sentiment, sample_tweets, timestamp)
VALUES ('NBA_20250130_LAL_BOS', 0.72, 234, -0.45, '[]'::jsonb, NOW());

-- Insert test market data
INSERT INTO market_data (market_id, game_id, yes_price, no_price, spread_bps, liquidity, anomaly_detected, anomaly_score, timestamp)
VALUES ('0x1234567890abcdef', 'NBA_20250130_LAL_BOS', 0.62, 0.38, 400, 50000, true, 0.85, NOW());

-- Verify insertion
SELECT * FROM twitter_data ORDER BY timestamp DESC LIMIT 1;
SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 1;
```

## 2. Strategy Engine API Testing

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-30T15:30:00.000Z",
  "running": true
}
```

### Submit Signal (Should Trigger HIGH_RISK_HEDGE)

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

Expected response:
```json
{
  "success": true,
  "signal": {
    "type": "HIGH_RISK_HEDGE",
    "confidence": 1.0,
    "reasons": [
      "High rigging index: 0.72",
      "High anomaly score: 0.85"
    ],
    "timestamp": "2025-01-30T15:30:00.000Z"
  },
  "trade": {
    "trade_id": "TRX_20250130_ABC123",
    "signal_type": "HIGH_RISK_HEDGE",
    "action": "BET_NO",
    "market_id": "0x1234567890abcdef",
    "game_id": "NBA_20250130_LAL_BOS",
    "amount": 1500,
    "estimated_payout": 2700,
    "status": "PENDING_EXECUTION",
    "timestamp": "2025-01-30T15:30:00.000Z"
  }
}
```

### Submit Signal (Should Trigger MEDIUM_RISK)

```bash
curl -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{
    "riggingIndex": 0.55,
    "anomalyScore": 0.65,
    "gameId": "NBA_20250130_LAL_BOS",
    "marketId": "0x1234567890abcdef"
  }'
```

### Submit Signal (Should Trigger NO_SIGNAL)

```bash
curl -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{
    "riggingIndex": 0.30,
    "anomalyScore": 0.40,
    "gameId": "NBA_20250130_LAL_BOS",
    "marketId": "0x1234567890abcdef"
  }'
```

### Get Recent Trades

```bash
curl http://localhost:3000/trades?limit=10
```

### Execute Distribution

```bash
curl -X POST http://localhost:3000/distribution \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "TRX_20250130_ABC123",
    "totalProfit": 1200
  }'
```

Expected response:
```json
{
  "success": true,
  "distribution": {
    "trade_id": "TRX_20250130_ABC123",
    "total_profit": 1200,
    "hedge_amount": 600,
    "ops_fee": 60,
    "user_reward": 540,
    "status": "PENDING"
  }
}
```

## 3. Smart Contract Testing

### Run Unit Tests

```bash
cd contracts
npm install
npx hardhat test
```

Expected output:
```
IntegrityVault
  Deployment
    ✓ Should set the right owner
    ✓ Should initialize with zero deposits and profits
  Deposits
    ✓ Should accept deposits
    ✓ Should reject zero deposits
    ✓ Should accumulate multiple deposits
  Profit Recording
    ✓ Should record profits
    ✓ Should only allow owner to record profits
    ✓ Should reject zero profit
  Distribution
    ✓ Should execute distribution correctly
    ✓ Should reject distribution with no profits
    ✓ Should calculate correct distribution amounts
  ...

15 passing (2s)
```

### Deploy to Local Network

```bash
npx hardhat node
# In another terminal
npx hardhat run scripts/deploy.ts --network localhost
```

### Deploy to Polygon Amoy Testnet

```bash
# Make sure PRIVATE_KEY and POLYGON_RPC_URL are set in .env
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

## 4. Integration Testing

### End-to-End Flow Test

1. **Insert Twitter data with high rigging index**

```sql
INSERT INTO twitter_data (game_id, rigging_index, tweet_count, avg_sentiment, sample_tweets, timestamp)
VALUES ('NBA_20250130_TEST', 0.75, 300, -0.50, '[]'::jsonb, NOW());
```

2. **Insert market data with high anomaly score**

```sql
INSERT INTO market_data (market_id, game_id, yes_price, no_price, spread_bps, liquidity, anomaly_detected, anomaly_score, timestamp)
VALUES ('0xTEST123', 'NBA_20250130_TEST', 0.60, 0.40, 500, 40000, true, 0.90, NOW());
```

3. **Submit signal to Strategy Engine**

```bash
curl -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{
    "riggingIndex": 0.75,
    "anomalyScore": 0.90,
    "gameId": "NBA_20250130_TEST",
    "marketId": "0xTEST123"
  }'
```

4. **Verify trade was created**

```sql
SELECT * FROM trades WHERE game_id = 'NBA_20250130_TEST';
```

5. **Verify signal was logged**

```sql
SELECT * FROM signal_logs WHERE game_id = 'NBA_20250130_TEST';
```

6. **Execute distribution**

```bash
# Get trade_id from previous query
curl -X POST http://localhost:3000/distribution \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "TRX_20250130_XYZ789",
    "totalProfit": 1500
  }'
```

7. **Verify distribution was recorded**

```sql
SELECT * FROM distributions WHERE trade_id = 'TRX_20250130_XYZ789';
```

## 5. Service Monitoring

### Check Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f twitter-monitor
docker-compose logs -f market-watcher
docker-compose logs -f strategy-engine
```

### Check Service Status

```bash
docker-compose ps
```

### Check Redis Queue

```bash
docker-compose exec redis redis-cli

# In Redis CLI
KEYS *
LLEN bull:TRADE_SIGNAL:wait
LLEN bull:DISTRIBUTION_SIGNAL:wait
LLEN bull:ALERT_SIGNAL:wait
```

## 6. Performance Testing

### Load Test Strategy Engine

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p signal.json -T application/json http://localhost:3000/signal
```

signal.json:
```json
{
  "riggingIndex": 0.72,
  "anomalyScore": 0.85,
  "gameId": "NBA_20250130_LOAD_TEST",
  "marketId": "0xLOADTEST"
}
```

### Database Performance

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM trades WHERE status = 'PENDING_EXECUTION';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 7. Dashboard Testing

### Run CLI Dashboard

```bash
cd frontend
pip install psycopg2-binary python-dotenv
python dashboard.py
```

Expected output:
```
┌──────────────────────────────────────────────────────────┐
│          NBA Integrity Guard - Live Dashboard            │
└──────────────────────────────────────────────────────────┘

📱 Twitter Sentiment Analysis (Last 5 min):
   Rigging Index: 0.7200 ↑
   Tweet Count: 234
   Avg Sentiment: -0.4500
   Updated: 2025-01-30 15:30:00

📊 Polymarket Anomaly Detection:
   Status: ⚠️  ANOMALY DETECTED
   Yes Price: 0.62000000
   No Price: 0.38000000
   Anomaly Score: 0.8500
   Updated: 2025-01-30 15:30:05

💰 Recent Trades:
   ✓ TRX_20250130_ABC123 | HIGH_RISK_HEDGE | BET_NO | $1500

🔔 Recent Signals:
   [HIGH_RISK_HEDGE] Rigging: 0.7200, Anomaly: 0.8500

────────────────────────────────────────────────────────────
Last updated: 2025-01-30 15:30:10
Press Ctrl+C to exit
```

## 8. Troubleshooting Tests

### Test 1: Database Connection

```bash
docker-compose exec postgres pg_isready -U admin
```

Expected: `postgres:5432 - accepting connections`

### Test 2: Redis Connection

```bash
docker-compose exec redis redis-cli ping
```

Expected: `PONG`

### Test 3: Strategy Engine Health

```bash
curl http://localhost:3000/health
```

Expected: HTTP 200 with JSON response

### Test 4: Service Restart

```bash
docker-compose restart strategy-engine
sleep 5
curl http://localhost:3000/health
```

## 9. Cleanup

### Clear All Data

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Restart fresh
docker-compose up -d
```

### Clear Specific Tables

```sql
TRUNCATE TABLE twitter_data CASCADE;
TRUNCATE TABLE market_data CASCADE;
TRUNCATE TABLE trades CASCADE;
TRUNCATE TABLE signal_logs CASCADE;
TRUNCATE TABLE distributions CASCADE;
```

## 10. Success Criteria

The system is working correctly if:

- ✅ All Docker services are running
- ✅ PostgreSQL accepts connections
- ✅ Redis responds to PING
- ✅ Strategy Engine API returns 200 on /health
- ✅ High rigging + high anomaly triggers HIGH_RISK_HEDGE signal
- ✅ Trades are created and stored in database
- ✅ Distributions calculate correct amounts (50% hedge, 5% ops, 45% user)
- ✅ Dashboard displays real-time data
- ✅ Smart contract tests pass
- ✅ Queue workers process jobs successfully

## Automated Test Script

```bash
#!/bin/bash

echo "Running NBA Integrity Guard Tests..."

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s http://localhost:3000/health | grep -q "ok" && echo "✓ PASS" || echo "✗ FAIL"

# Test 2: Database Connection
echo "Test 2: Database Connection"
docker-compose exec -T postgres pg_isready -U admin | grep -q "accepting connections" && echo "✓ PASS" || echo "✗ FAIL"

# Test 3: Redis Connection
echo "Test 3: Redis Connection"
docker-compose exec -T redis redis-cli ping | grep -q "PONG" && echo "✓ PASS" || echo "✗ FAIL"

# Test 4: Signal Processing
echo "Test 4: Signal Processing"
RESPONSE=$(curl -s -X POST http://localhost:3000/signal \
  -H "Content-Type: application/json" \
  -d '{"riggingIndex":0.72,"anomalyScore":0.85,"gameId":"TEST","marketId":"0xTEST"}')
echo "$RESPONSE" | grep -q "HIGH_RISK_HEDGE" && echo "✓ PASS" || echo "✗ FAIL"

echo "Tests complete!"
```

Save as `test.sh` and run:
```bash
chmod +x test.sh
./test.sh
```
