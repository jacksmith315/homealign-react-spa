# homeAlign React SPA - Complete Deployment Package

## 📦 Project Structure

```
homealign-react-spa/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthProvider.js
│   │   │   └── LoginForm.js
│   │   ├── layout/
│   │   │   └── Navigation.js
│   │   ├── common/
│   │   │   ├── BulkActionToolbar.js
│   │   │   ├── AdvancedFilters.js
│   │   │   └── LoadingSpinner.js
│   │   └── pages/
│   │       ├── ClientManagement.js
│   │       ├── PatientManagement.js
│   │       ├── ProviderManagement.js
│   │       └── ReferralManagement.js
│   ├── services/
│   │   └── ApiService.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── hooks/
│   │   └── useAuth.js
│   ├── styles/
│   │   └── index.css
│   ├── App.js
│   └── index.js
├── .env.example
├── .env.production
├── .gitignore
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Docker & Docker Compose (for containerized deployment)
- Django homeAlign backend running

### Local Development
```bash
# Clone and setup
git clone <repository-url>
cd homealign-react-spa
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your backend URLs

# Start development server
npm start
```

## 📁 Complete File Contents

### package.json
```json
{
  "name": "homealign-react-spa",
  "version": "1.0.0",
  "description": "React SPA for Django homeAlign Core API management",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "build:prod": "REACT_APP_ENV=production npm run build",
    "serve": "npx serve -s build -l 3000",
    "docker:build": "docker build -t homealign-spa .",
    "docker:run": "docker run -p 3000:80 homealign-spa"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:8000"
}
```

### .env.example
```env
# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000/core-api
REACT_APP_AUTH_URL=http://localhost:8000
REACT_APP_ENV=development

# Optional: Analytics
REACT_APP_ANALYTICS_ID=

# Optional: Error tracking
REACT_APP_SENTRY_DSN=
```

### .env.production
```env
REACT_APP_API_BASE_URL=https://your-backend-domain.com/core-api
REACT_APP_AUTH_URL=https://your-backend-domain.com
REACT_APP_ENV=production
```

### tailwind.config.js
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

### postcss.config.js
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### src/utils/constants.js
```js
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/core-api';
export const AUTH_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:8000';

export const DATABASES = [
  { id: 'core', name: 'Core' },
  { id: 'humana', name: 'Humana' },
  { id: 'bcbs_az', name: 'BCBS Arizona' },
  { id: 'centene', name: 'Centene' },
  { id: 'uhc', name: 'UHC' },
  { id: 'aarp', name: 'AARP' },
  { id: 'aetna', name: 'Aetna' },
];

export const CLIENT_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'corporate', label: 'Corporate' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];
```

### src/services/ApiService.js
```js
import { API_BASE_URL } from '../utils/constants';

class ApiService {
  constructor(authContext) {
    this.auth = authContext;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.auth.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.auth.logout();
        throw new Error('Authentication failed');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async getList(entity, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/${entity}/${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getItem(entity, id) {
    return this.request(`/${entity}/${id}/`);
  }

  async createItem(entity, data) {
    return this.request(`/${entity}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(entity, id, data) {
    return this.request(`/${entity}/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(entity, id) {
    return this.request(`/${entity}/${id}/`, {
      method: 'DELETE',
    });
  }

  async bulkDelete(entity, ids) {
    const promises = ids.map(id => this.deleteItem(entity, id));
    return Promise.allSettled(promises);
  }

  async exportData(entity, params = {}) {
    const queryString = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const endpoint = `/${entity}/export/?${queryString}`;
    return this.request(endpoint);
  }

  // Entity-specific methods
  async getClients(params = {}) { return this.getList('clients', params); }
  async getProviders(params = {}) { return this.getList('providers', params); }
  async getReferrals(params = {}) { return this.getList('referrals', params); }
  async getPatients(params = {}) { return this.getList('patients', params); }
}

export default ApiService;
```

### src/styles/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  }
  
  .form-input {
    @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  }
  
  .status-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .status-active {
    @apply bg-green-100 text-green-800;
  }
  
  .status-inactive {
    @apply bg-red-100 text-red-800;
  }
  
  .status-pending {
    @apply bg-yellow-100 text-yellow-800;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Responsive table */
.table-responsive {
  @apply min-w-full overflow-x-auto;
}

@media (max-width: 768px) {
  .table-responsive table {
    @apply text-sm;
  }
  
  .table-responsive th,
  .table-responsive td {
    @apply px-3 py-2;
  }
}
```

### public/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2563eb" />
    <meta name="description" content="homeAlign Custom Portal - Healthcare Management System" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <title>homeAlign Admin Portal</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

### Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (optional - if backend is on same server)
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_BASE_URL=http://localhost:8000/core-api
      - REACT_APP_AUTH_URL=http://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped
    
  # Optional: Include backend if you want full stack
  backend:
    image: your-django-image:latest
    ports:
      - "8000:8000"
    environment:
      - DJANGO_DEBUG=False
      - DJANGO_SECRET_KEY=your-secret-key
    restart: unless-stopped

  # Optional: Reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-prod.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### .gitignore
```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production build
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.dockerignore
```

## 🚀 Deployment Instructions

### 1. Local Development

```bash
# Clone repository
git clone <your-repo-url>
cd homealign-react-spa

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your backend URLs

# Start development server
npm start
```

### 2. Production Build

```bash
# Create production build
npm run build

# Test production build locally
npm run serve
```

### 3. Docker Deployment

```bash
# Build Docker image
docker build -t homealign-spa .

# Run container
docker run -p 3000:80 homealign-spa

# Or use docker-compose
docker-compose up -d
```

### 4. AWS Deployment (S3 + CloudFront)

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://your-app-bucket

# Build and deploy
npm run build
aws s3 sync build/ s3://your-app-bucket --delete

# Create CloudFront distribution (optional)
```

### 5. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 6. Nginx Production Setup

```bash
# Install Nginx
sudo apt install nginx

# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/homealign
sudo ln -s /etc/nginx/sites-available/homealign /etc/nginx/sites-enabled/

# Copy build files
sudo cp -r build/* /var/www/html/

# Restart Nginx
sudo systemctl restart nginx
```

## 🔧 Environment Configuration

### Development Environment
Create `.env.local`:
```env
REACT_APP_API_BASE_URL=http://localhost:8000/core-api
REACT_APP_AUTH_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Production Environment
Create `.env.production`:
```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com/core-api
REACT_APP_AUTH_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

## 📋 Backend Requirements

### Django Settings
Add to your Django `settings.py`:
```python
# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://yourdomain.com",  # Production
]

CORS_ALLOW_CREDENTIALS = True

# Static files for API docs
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

## 🔐 Security Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use different API keys for dev/prod
- Rotate secrets regularly

### 2. CORS Configuration
- Restrict CORS origins in production
- Use HTTPS in production
- Implement proper CSP headers

### 3. Build Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement proper caching headers

## 📊 Monitoring & Analytics

### 1. Add Error Tracking (Sentry)
```bash
npm install @sentry/react @sentry/tracing
```

### 2. Add Analytics
```javascript
// src/utils/analytics.js
export const trackEvent = (event, properties) => {
  if (process.env.REACT_APP_ANALYTICS_ID) {
    // Your analytics implementation
  }
};
```

## 🧪 Testing

### 1. Unit Tests
```bash
npm test
```

### 2. E2E Tests (Cypress)
```bash
npm install cypress --save-dev
npx cypress open
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: aws s3 sync build/ s3://your-bucket --delete
```

This complete deployment package provides everything needed to deploy the homeAlign React SPA in any environment, from local development to enterprise production deployments.