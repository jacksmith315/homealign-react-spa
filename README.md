# homeAlign React SPA

A modern React Single Page Application for managing Django homeAlign Core API resources including patients, clients, providers, referrals, and services.

## 🚀 Features

- **Multi-tenant Database Support**: Switch between different healthcare partner databases
- **JWT Authentication**: Secure login with token-based authentication
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Extensible Architecture**: Easy to add new entity management screens
- **Modern UI**: Built with Tailwind CSS and Lucide React icons
- **Production Ready**: Docker support, nginx configuration, and deployment scripts

## 📋 Prerequisites

- Node.js 18+ and npm
- Django homeAlign backend running
- Docker & Docker Compose (for containerized deployment)

## 🔧 Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/jacksmith315/homealign-react-spa.git
cd homealign-react-spa
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your backend URLs
REACT_APP_API_BASE_URL=http://localhost:8000/core-api
REACT_APP_AUTH_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t homealign-spa .

# Run the container
docker run -p 3000:80 homealign-spa
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop the application
docker-compose down
```

## 🌐 Production Deployment

### 1. Build for Production

```bash
# Create optimized production build
npm run build

# Test the build locally
npm run serve
```

### 2. Deploy to AWS S3 + CloudFront

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://your-homealign-bucket

# Deploy
npm run build
aws s3 sync build/ s3://your-homealign-bucket --delete

# Optional: Create CloudFront distribution for CDN
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### 4. Deploy to Nginx Server

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Copy build files
sudo cp -r build/* /var/www/html/

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/homealign
sudo ln -s /etc/nginx/sites-available/homealign /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## ⚙️ Environment Configuration

### Development (.env.local)
```env
REACT_APP_API_BASE_URL=http://localhost:8000/core-api
REACT_APP_AUTH_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Production (.env.production)
```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com/core-api
REACT_APP_AUTH_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

## 🔐 Backend Configuration

Ensure your Django backend is configured to work with the React frontend:

### Django Settings

```python
# settings.py

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://yourdomain.com",  # Production
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

## 📁 Project Structure

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
│   │       └── (management components)
│   ├── services/
│   │   └── ApiService.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── package.json
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run serve` - Serve production build locally
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

## 🚀 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
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

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure Django CORS settings include your frontend domain
   - Check that `CORS_ALLOW_CREDENTIALS = True` in Django settings

2. **Authentication Issues**
   - Verify JWT configuration in Django
   - Check that tokens are being stored in localStorage
   - Ensure API endpoints return proper JWT tokens

3. **API Connection Issues**
   - Verify backend is running on correct port
   - Check environment variables are set correctly
   - Ensure database connections are working

4. **Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors if using TypeScript
   - Verify all dependencies are compatible

### Debug Mode

To run in debug mode with verbose logging:

```bash
REACT_APP_DEBUG=true npm start
```

## 📚 API Documentation

The application expects the following Django API endpoints:

- `POST /token/` - JWT authentication
- `GET /core-api/patients/` - List patients
- `POST /core-api/patients/` - Create patient
- `GET /core-api/clients/` - List clients
- `POST /core-api/clients/` - Create client
- `GET /core-api/providers/` - List providers
- `GET /core-api/referrals/` - List referrals
- `GET /core-api/services/` - List services

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **HTTPS**: Always use HTTPS in production
3. **API Keys**: Rotate API keys regularly
4. **CSP Headers**: Implement Content Security Policy headers
5. **Authentication**: Implement proper token refresh logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Contact the development team

---

Built with ❤️ for healthcare management
