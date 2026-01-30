#!/bin/bash

# NBA Integrity Guard - Stop Script
# Stops all services

echo "🛑 Stopping NBA Integrity Guard..."
docker-compose down

echo "✅ All services stopped"
