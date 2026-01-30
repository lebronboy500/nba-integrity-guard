#!/bin/bash

# NBA Integrity Guard - Quick Start Script
# Starts all services and displays status

set -e

echo "🚀 Starting NBA Integrity Guard..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup.sh first."
    exit 1
fi

# Start services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ All services started!"
echo ""
echo "Available endpoints:"
echo "  - Strategy Engine API: http://localhost:3000"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "View logs:"
echo "  - All: docker-compose logs -f"
echo "  - Twitter Monitor: docker-compose logs -f twitter-monitor"
echo "  - Market Watcher: docker-compose logs -f market-watcher"
echo "  - Strategy Engine: docker-compose logs -f strategy-engine"
echo ""
echo "Run Dashboard:"
echo "  - cd frontend && python dashboard.py"
echo ""
