#!/bin/bash

# NBA Integrity Guard - Verification Script
# Verifies that all components are properly installed

set -e

echo "🔍 NBA Integrity Guard - System Verification"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# File check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 missing"
        return 1
    fi
}

# Directory check function
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 missing"
        return 1
    fi
}

echo "📁 Checking Project Structure..."
echo ""

# Check main directories
check_dir "backend"
check_dir "backend/twitter-monitor"
check_dir "backend/market-watcher"
check_dir "backend/strategy-engine"
check_dir "backend/database"
check_dir "contracts"
check_dir "contracts/contracts"
check_dir "contracts/test"
check_dir "contracts/scripts"
check_dir "frontend"

echo ""
echo "📄 Checking Configuration Files..."
echo ""

# Check configuration files
check_file ".env.example"
check_file ".gitignore"
check_file "docker-compose.yml"
check_file "README.md"
check_file "TESTING.md"
check_file "QUICKSTART.md"
check_file "PROJECT_SUMMARY.md"

echo ""
echo "🐍 Checking Python Files..."
echo ""

# Check Python files
check_file "backend/twitter-monitor/main.py"
check_file "backend/twitter-monitor/tweepy_client.py"
check_file "backend/twitter-monitor/sentiment_analyzer.py"
check_file "backend/twitter-monitor/database.py"
check_file "backend/twitter-monitor/requirements.txt"
check_file "backend/twitter-monitor/Dockerfile"
check_file "frontend/dashboard.py"

echo ""
echo "📦 Checking Node.js Files..."
echo ""

# Check Market Watcher files
check_file "backend/market-watcher/package.json"
check_file "backend/market-watcher/tsconfig.json"
check_file "backend/market-watcher/Dockerfile"
check_file "backend/market-watcher/src/index.ts"
check_file "backend/market-watcher/src/market.ts"
check_file "backend/market-watcher/src/anomaly.ts"
check_file "backend/market-watcher/src/database.ts"

# Check Strategy Engine files
check_file "backend/strategy-engine/package.json"
check_file "backend/strategy-engine/tsconfig.json"
check_file "backend/strategy-engine/Dockerfile"
check_file "backend/strategy-engine/src/index.ts"
check_file "backend/strategy-engine/src/signals.ts"
check_file "backend/strategy-engine/src/queue.ts"
check_file "backend/strategy-engine/src/database.ts"

echo ""
echo "⛓️  Checking Smart Contract Files..."
echo ""

# Check contract files
check_file "contracts/contracts/IntegrityVault.sol"
check_file "contracts/test/IntegrityVault.test.ts"
check_file "contracts/scripts/deploy.ts"
check_file "contracts/hardhat.config.ts"
check_file "contracts/package.json"
check_file "contracts/tsconfig.json"

echo ""
echo "🗄️  Checking Database Files..."
echo ""

# Check database files
check_file "backend/database/schema.sql"

echo ""
echo "🚀 Checking Scripts..."
echo ""

# Check scripts
check_file "setup.sh"
check_file "start.sh"
check_file "stop.sh"

echo ""
echo "🔧 Checking Prerequisites..."
echo ""

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    docker --version
else
    echo -e "${RED}✗${NC} Docker is not installed"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed"
    docker-compose --version
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js is installed"
    node --version
else
    echo -e "${YELLOW}⚠${NC} Node.js is not installed (optional for local development)"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓${NC} Python 3 is installed"
    python3 --version
else
    echo -e "${YELLOW}⚠${NC} Python 3 is not installed (optional for local development)"
fi

echo ""
echo "📊 File Statistics..."
echo ""

# Count files
PYTHON_FILES=$(find . -name "*.py" ! -path "*/node_modules/*" ! -path "*/__pycache__/*" | wc -l)
TS_FILES=$(find . -name "*.ts" ! -path "*/node_modules/*" | wc -l)
SOL_FILES=$(find . -name "*.sol" ! -path "*/node_modules/*" | wc -l)
JSON_FILES=$(find . -name "*.json" ! -path "*/node_modules/*" | wc -l)
MD_FILES=$(find . -name "*.md" | wc -l)

echo "Python files: $PYTHON_FILES"
echo "TypeScript files: $TS_FILES"
echo "Solidity files: $SOL_FILES"
echo "JSON files: $JSON_FILES"
echo "Markdown files: $MD_FILES"

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure your API keys"
echo "2. Run ./setup.sh to initialize the project"
echo "3. Run ./start.sh to start all services"
echo "4. Check QUICKSTART.md for detailed instructions"
echo ""
