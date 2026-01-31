#!/bin/bash

echo "🛑 停止 NBA Integrity Guard Demo..."

if [ -f /tmp/nba-api.pid ]; then
    kill $(cat /tmp/nba-api.pid) 2>/dev/null
    rm /tmp/nba-api.pid
    echo "   ✅ Mock API 已停止"
fi

if [ -f /tmp/nba-frontend.pid ]; then
    kill $(cat /tmp/nba-frontend.pid) 2>/dev/null
    rm /tmp/nba-frontend.pid
    echo "   ✅ 前端服务已停止"
fi

echo ""
echo "✅ 所有服务已停止"
