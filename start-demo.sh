#!/bin/bash

echo "🚀 NBA Integrity Guard - Demo 快速启动"
echo "========================================"
echo ""

# 1. 启动 Mock API 服务器
echo "📡 启动 Mock API 服务器 (端口 3001)..."
cd mock-server
node server.js &
API_PID=$!
cd ..

sleep 2

# 2. 启动前端服务器
echo "🌐 启动前端服务器 (端口 8080)..."
cd frontend-simple
python3 -m http.server 8080 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Demo 系统启动成功！"
echo ""
echo "📱 打开浏览器访问:"
echo "   http://localhost:8080"
echo ""
echo "📡 Mock API 服务:"
echo "   http://localhost:3001"
echo ""
echo "🛑 停止服务: Ctrl+C 或者运行 ./stop-demo.sh"
echo ""

# 保存 PID
echo $API_PID > /tmp/nba-api.pid
echo $FRONTEND_PID > /tmp/nba-frontend.pid

# 等待
wait
