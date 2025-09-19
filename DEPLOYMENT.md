# 🚀 Bhoomi AI - Deployment Guide

## Quick Start (Already Done!)

Your application is **already running** and fully functional:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Status**: ✅ All systems operational

## 🔧 Current Setup

### Environment Variables
```bash
# Root .env file
GROQ_API_KEY=your_groq_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Client .env file
REACT_APP_API_URL=http://localhost:3001/api
```

### Running Services
```bash
# Both frontend and backend running via:
npm run dev

# Individual services:
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

## 📊 Health Check

Test your deployment:

```bash
# Backend health
curl http://localhost:3001/api/health

# States endpoint
curl http://localhost:3001/api/data/states

# Kerala crops
curl http://localhost:3001/api/data/kerala/crops
```

## 🌐 Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup for Production
1. Update API keys in production environment
2. Set `NODE_ENV=production`
3. Update `CLIENT_URL` to production domain
4. Update `REACT_APP_API_URL` to production API URL

### Deployment Options

#### Option 1: Traditional Server
```bash
# Build the application
npm run build

# Start production server
npm start
```

#### Option 2: Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

#### Option 3: Cloud Platforms
- **Vercel**: Deploy frontend directly
- **Heroku**: Full-stack deployment
- **AWS/GCP**: Container or serverless deployment
- **Netlify**: Frontend with serverless functions

### Environment Variables for Production
```bash
# Required for production
GROQ_API_KEY=your_production_groq_key
OPENWEATHER_API_KEY=your_production_weather_key
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-domain.com
```

## 🔒 Security Considerations

### API Keys
- Never commit API keys to version control
- Use environment variables or secret management
- Rotate keys regularly
- Monitor API usage

### CORS Configuration
- Update CORS origins for production domains
- Restrict to specific domains in production
- Enable credentials only when necessary

### Rate Limiting
Consider adding rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📈 Monitoring

### Health Endpoints
- `GET /api/health` - System health
- Monitor response times
- Track error rates
- Monitor API usage

### Logging
- Application logs via console
- Error tracking (consider Sentry)
- Performance monitoring
- User analytics

## 🔄 Updates and Maintenance

### Data Updates
- CSV files can be updated in respective dataset folders
- Clear cache via `POST /api/data/clear-cache`
- Restart server to reload data

### Code Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart services
npm run dev  # or npm start for production
```

## 🎯 Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization
- Bundle analysis
- CDN for static assets

### Backend
- Database connection pooling (if adding database)
- Caching strategies
- API response compression
- Load balancing

## 🛠️ Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### API Connection Issues
- Check CORS configuration
- Verify API URLs in environment variables
- Test endpoints individually

#### Build Failures
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all dependencies

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific modules
DEBUG=express:* npm run dev:server
```

## 📞 Support

Your application is **fully functional** and ready for production use!

For issues:
1. Check the health endpoints
2. Review application logs
3. Verify environment variables
4. Test API endpoints individually

---

**🎉 Congratulations! Your Bhoomi AI application is production-ready!**
