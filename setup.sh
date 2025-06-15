#!/bin/bash

# homeAlign React SPA Quick Setup Script
# This script sets up the development environment quickly

set -e

echo "🏠 Setting up homeAlign React SPA Development Environment"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env.local ]; then
    echo "🔧 Setting up environment configuration..."
    cp .env.example .env.local
    echo "📝 Created .env.local from template"
    echo "⚠️  Please edit .env.local with your Django backend URLs:"
    echo "   REACT_APP_API_BASE_URL=http://localhost:8000/core-api"
    echo "   REACT_APP_AUTH_URL=http://localhost:8000"
else
    echo "✅ Environment file .env.local already exists"
fi

# Check if Django backend is running
echo "🔍 Checking Django backend connection..."
BACKEND_URL=$(grep REACT_APP_API_BASE_URL .env.local | cut -d'=' -f2)
if [ -n "$BACKEND_URL" ]; then
    if curl -s -f "$BACKEND_URL" > /dev/null 2>&1; then
        echo "✅ Django backend is accessible at $BACKEND_URL"
    else
        echo "⚠️  Django backend not accessible at $BACKEND_URL"
        echo "   Make sure your Django homeAlign backend is running"
    fi
fi

# Create initial build
echo "🏗️  Creating initial build..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo "================================================="
echo "🚀 To start development:"
echo "   npm start"
echo ""
echo "🐳 To build and run with Docker:"
echo "   ./deploy.sh local"
echo ""
echo "📚 Available commands:"
echo "   npm start          - Start development server"
echo "   npm run build      - Create production build"
echo "   npm test           - Run tests"
echo "   npm run serve      - Serve production build"
echo "   ./deploy.sh local  - Deploy locally with Docker"
echo ""
echo "🔧 Configuration:"
echo "   Edit .env.local to configure backend URLs"
echo "   Backend should be running at: http://localhost:8000"
echo ""
echo "📖 For detailed instructions, see README.md"
