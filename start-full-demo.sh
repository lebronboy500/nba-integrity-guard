#!/bin/bash

echo ""
echo "🚀 NBA Integrity Guard - Full Demo with React Frontend"
echo "========================================================"
echo ""

# 1. 启动 Mock API 服务器
echo "📡 启动 Mock API 服务器 (端口 3001)..."
cd mock-server
node server.js > ../logs/mock-api.log 2>&1 &
API_PID=$!
cd ..

sleep 2

# 2. 启动 React 前端 (Vite)
echo "🎨 启动 React 前端 (端口 5173)..."
cd frontend-web
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Full Demo 系统启动成功！"
echo ""
echo "🌐 打开浏览器访问:"
echo "   http://localhost:5173"
echo ""
echo "📡 Mock API 服务:"
echo "   http://localhost:3001"
echo "   http://localhost:3001/health"
echo ""
echo "📊 available endpoints:"
echo "   GET /api/markets"
echo "   GET /api/reputation/leaderboard"
echo "   GET /api/reputation/profile/:address"
echo ""
echo "📝 查看日志:"
echo "   tail -f logs/mock-api.log"
echo "   tail -f logs/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "   ./stop-full-demo.sh 或 Ctrl+C"
echo ""

# 保存 PID
echo $API_PID > /tmp/nba-api.pid
echo $FRONTEND_PID > /tmp/nba-frontend.pid

# 等待
wait
