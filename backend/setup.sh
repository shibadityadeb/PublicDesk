#!/bin/bash

# PublicDesk Backend Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 PublicDesk Backend Setup"
echo "============================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Please install Docker to use containerization."
else
    echo "✅ Docker version: $(docker --version)"
    if ! docker info &> /dev/null; then
        echo "⚠️  Docker daemon is not running. Please start Docker."
    fi
fi
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi
echo ""

# Create logs directory
if [ ! -d logs ]; then
    echo "📁 Creating logs directory..."
    mkdir logs
    echo "✅ Logs directory created"
else
    echo "✅ Logs directory already exists"
fi
echo ""

# Ask user about setup method
echo "🛠️  Setup Method:"
echo "1. Docker (Recommended - includes PostgreSQL, Redis, RabbitMQ)"
echo "2. Local (Requires manual setup of services)"
echo ""
read -p "Choose setup method (1 or 2): " SETUP_METHOD

if [ "$SETUP_METHOD" = "1" ]; then
    echo ""
    echo "🐳 Starting services with Docker Compose..."
    docker-compose up -d
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    echo ""
    echo "✅ All services started!"
    echo ""
    echo "📍 Service URLs:"
    echo "   - API: http://localhost:3000/api/v1"
    echo "   - Swagger: http://localhost:3000/api/v1/docs"
    echo "   - RabbitMQ Management: http://localhost:15672 (guest/guest)"
    echo "   - PostgreSQL: localhost:5432 (publicdesk/publicdesk123)"
    echo "   - Redis: localhost:6379"
    echo ""
    echo "💡 To view logs: docker-compose logs -f app"
    echo "💡 To stop: docker-compose down"
    
elif [ "$SETUP_METHOD" = "2" ]; then
    echo ""
    echo "📋 Local Setup Requirements:"
    echo "   1. PostgreSQL 16+ running on port 5432"
    echo "   2. Redis 7+ running on port 6379"
    echo "   3. RabbitMQ 3+ running on port 5672"
    echo ""
    echo "📝 Update your .env file with the correct connection details"
    echo ""
    read -p "Press Enter to start the application in development mode..."
    echo ""
    echo "🚀 Starting application..."
    npm run start:dev
else
    echo "❌ Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Read README.md for detailed documentation"
echo "   2. Check API_GUIDE.md for API examples"
echo "   3. Visit http://localhost:3000/api/v1/docs for Swagger UI"
echo ""
echo "Happy coding! 🎉"
