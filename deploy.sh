#!/bin/bash

# homeAlign React SPA Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: local, staging, production

set -e

ENVIRONMENT=${1:-local}
PROJECT_NAME="homealign-react-spa"

echo "🚀 Deploying $PROJECT_NAME to $ENVIRONMENT environment..."

case $ENVIRONMENT in
  "local")
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🔧 Setting up local environment..."
    if [ ! -f .env.local ]; then
      cp .env.example .env.local
      echo "⚠️  Please edit .env.local with your backend URLs"
    fi
    
    echo "🏗️  Building application..."
    npm run build
    
    echo "🧪 Running tests..."
    npm test -- --watchAll=false
    
    echo "🎉 Local deployment complete!"
    echo "Run 'npm start' to start the development server"
    ;;
    
  "staging")
    echo "🔧 Setting up staging environment..."
    cp .env.example .env.production
    
    echo "🏗️  Building for staging..."
    REACT_APP_ENV=staging npm run build
    
    echo "🐳 Building Docker image..."
    docker build -t $PROJECT_NAME:staging .
    
    echo "🚀 Starting staging container..."
    docker run -d \
      --name $PROJECT_NAME-staging \
      -p 3001:80 \
      -e REACT_APP_API_BASE_URL=https://staging-api.yourdomain.com/core-api \
      -e REACT_APP_AUTH_URL=https://staging-api.yourdomain.com \
      $PROJECT_NAME:staging
    
    echo "🎉 Staging deployment complete!"
    echo "Application available at http://localhost:3001"
    ;;
    
  "production")
    echo "⚠️  Production deployment requires manual confirmation"
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Production deployment cancelled"
      exit 1
    fi
    
    echo "🏗️  Building for production..."
    REACT_APP_ENV=production npm run build
    
    echo "🧪 Running production tests..."
    npm test -- --watchAll=false
    
    echo "🐳 Building production Docker image..."
    docker build -t $PROJECT_NAME:latest .
    
    echo "📦 Creating deployment package..."
    tar -czf $PROJECT_NAME-production.tar.gz build/ nginx.conf Dockerfile
    
    echo "🎉 Production build complete!"
    echo "📦 Deployment package: $PROJECT_NAME-production.tar.gz"
    echo "🚀 Deploy using: docker run -p 80:80 $PROJECT_NAME:latest"
    ;;
    
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: ./deploy.sh [local|staging|production]"
    exit 1
    ;;
esac

echo "✅ Deployment script completed successfully!"
