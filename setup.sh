#!/bin/bash

# NBA Integrity Guard - Setup Script
# Initializes the project and prepares for deployment

set -e

echo "🚀 NBA Integrity Guard - Setup Script"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created. Please edit it with your API keys."
    echo ""
    echo "Required API keys:"
    echo "  - TWITTER_BEARER_TOKEN (from https://developer.twitter.com)"
    echo "  - POLYGON_RPC_URL (from https://www.alchemy.com)"
    echo "  - PRIVATE_KEY (your wallet private key)"
    echo ""
else
    echo "✓ .env file already exists"
fi

# Build Docker images
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run: docker-compose up -d"
echo "3. Check status: docker-compose ps"
echo "4. View logs: docker-compose logs -f"
echo ""
