#!/bin/bash

echo "🚀 NBA Integrity Guard - 快速启动脚本"
echo "========================================="
echo ""

# 1. 启动 PostgreSQL
echo "📦 启动 PostgreSQL..."
docker run -d \
  --name nba-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=nba_integrity_2025_secure \
  -e POSTGRES_DB=nba_integrity \
  -p 5432:5432 \
  postgres:15-alpine 2>/dev/null || docker start nba-postgres 2>/dev/null

echo "   等待 PostgreSQL 启动..."
sleep 5

# 2. 初始化数据库
echo "📊 初始化数据库和模拟数据..."
cd scripts && node init-database.js
cd ..

# 3. 启动后端服务
echo ""
echo "🔧 启动后端服务..."

echo "   [3001] Polymarket Indexer..."
cd backend/polymarket-indexer && npm run dev > ../../logs/polymarket.log 2>&1 &
cd ../..

echo "   [3002] Auth Service..."
cd backend/auth-service && npm run dev > ../../logs/auth.log 2>&1 &
cd ../..

echo "   [3003] Notification Service..."
cd backend/notification-service && npm run dev > ../../logs/notification.log 2>&1 &
cd ../..

echo "   [3004] Analytics Service..."
cd backend/analytics-service && npm run dev > ../../logs/analytics.log 2>&1 &
cd ../..

echo "   [3005] Reputation Service..."
cd backend/reputation-service && npm run dev > ../../logs/reputation.log 2>&1 &
cd ../..

echo "   [3006] Payment Service..."
cd backend/payment-service && npm run dev > ../../logs/payment.log 2>&1 &
cd ../..

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📡 服务地址："
echo "   http://localhost:3001  - Polymarket Indexer"
echo "   http://localhost:3002  - Auth Service"
echo "   http://localhost:3003  - Notification Service"
echo "   http://localhost:3004  - Analytics Service"
echo "   http://localhost:3005  - Reputation Service"
echo "   http://localhost:3006  - Payment Service"
echo ""
echo "📋 查看日志："
echo "   tail -f logs/*.log"
echo ""
echo "🛑 停止服务："
echo "   ./stop-dev.sh"
echo ""
