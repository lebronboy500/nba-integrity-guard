#!/bin/bash

echo "========================================"
echo "NBA 项目 D 盘迁移验证脚本"
echo "========================================"
echo ""

PROJECT_DIR="/mnt/d/lebron/cc项目/1/nba-integrity-guard"
cd "$PROJECT_DIR"

echo "✅ 1. 检查项目路径"
if [ -d "$PROJECT_DIR" ]; then
  echo "   ✓ 项目目录存在: $PROJECT_DIR"
else
  echo "   ✗ 项目目录不存在!"
  exit 1
fi

echo ""
echo "✅ 2. 检查配置文件"
for file in ".env" "docker-compose.yml" ".gitignore"; do
  if [ -f "$file" ]; then
    echo "   ✓ $file 存在"
  else
    echo "   ✗ $file 不存在"
  fi
done

echo ""
echo "✅ 3. 检查数据存储目录"
for dir in "data/postgres" "data/redis" "logs" "cache"; do
  if [ -d "$dir" ]; then
    echo "   ✓ $dir 已创建"
  else
    echo "   ✗ $dir 不存在"
  fi
done

echo ""
echo "✅ 4. 检查服务环境配置"
for service in "backend/polymarket-indexer" "backend/auth-service" "backend/notification-service"; do
  if [ -f "$service/.env" ]; then
    echo "   ✓ $service/.env 存在"
  else
    echo "   ✗ $service/.env 不存在"
  fi
done

echo ""
echo "✅ 5. 检查主配置文件内容"
echo "   DATABASE_URL: $(grep DATABASE_URL .env | cut -d= -f2)"
echo "   DATA_DIR: $(grep DATA_DIR .env | cut -d= -f2)"
echo "   LOGS_DIR: $(grep LOGS_DIR .env | cut -d= -f2)"

echo ""
echo "========================================"
echo "✅ 迁移验证完成！"
echo "========================================"
echo ""
echo "下一步: 启动服务"
echo "docker-compose up -d"
