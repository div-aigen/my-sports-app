# Football App - Deployment Guide

Complete guide for deploying the Football App to production.

## Overview

The Football App can be deployed across multiple platforms:
- Backend: Railway, Render, Heroku, or AWS
- Database: Managed PostgreSQL services
- Web: Vercel, Netlify, or static hosts
- Mobile: Expo EAS Build or manual APK/IPA build

## Prerequisites

- GitHub account (for deployment services)
- Credit card (for paid hosting)
- Domain name (optional)
- SSL certificate (usually automatic)

## Recommended Stack

**For fastest deployment:**
- Backend: Railway
- Database: Railway PostgreSQL
- Web: Vercel
- Mobile: Expo EAS

**Total cost**: ~$20-30/month

## Step-by-Step Deployment

### 1. Database Setup

#### Option A: Railway (Recommended)
1. Go to https://railway.app
2. Sign in with GitHub
3. Create new project
4. Add PostgreSQL plugin
5. Copy DATABASE_URL
6. Run migrations:
```bash
psql <DATABASE_URL> < backend/src/database/migrations/001_create_users.sql
psql <DATABASE_URL> < backend/src/database/migrations/002_create_sessions.sql
psql <DATABASE_URL> < backend/src/database/migrations/003_create_participants.sql
```

#### Option B: Render
1. Go to https://render.com
2. Sign in with GitHub
3. Create PostgreSQL database
4. Copy connection string
5. Set environment variables with connection string

### 2. Backend Deployment

#### Option A: Railway
1. Push backend folder to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Select backend repository/folder
5. Set environment variables:
```
DATABASE_URL=your_database_url
PORT=5000
JWT_SECRET=random_secret_key_min_32_chars
NODE_ENV=production
```
6. Deploy
7. Get URL from Railway dashboard

#### Option B: Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Set build command:
```
npm install --production
```
5. Set start command:
```
npm run start
```
6. Set environment variables (same as above)
7. Deploy

#### Option C: Heroku
1. Install Heroku CLI
2. Run:
```bash
heroku login
heroku create football-app-backend
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku config:set JWT_SECRET=your_secret
```

### 3. Web Frontend Deployment

#### Option A: Vercel (Recommended)
1. Push web folder to GitHub
2. Go to https://vercel.com
3. New Project → Import Git Repo
4. Select web folder
5. Environment variables:
```
VITE_API_URL=https://your-backend-url/api
VITE_SOCKET_URL=https://your-backend-url
```
6. Click Deploy
7. Get domain from Vercel

#### Option B: Netlify
1. Push web folder to GitHub
2. Go to https://netlify.com
3. New site from Git
4. Select repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Set environment variables (same as Vercel)
8. Deploy

#### Option C: GitHub Pages
```bash
cd web
npm run build
# Upload dist folder to gh-pages
```

### 4. Mobile App Deployment

#### Option A: Expo EAS (Recommended)
1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Authenticate:
```bash
cd mobile
eas login
```

3. Build:
```bash
# Android
eas build --platform android --type apk

# iOS (requires Mac)
eas build --platform ios --type ipa
```

4. Download from Expo dashboard
5. Share APK link or upload to stores

#### Option B: Manual APK Build
```bash
cd mobile
npx react-native build-android
# Output: android/app/build/outputs/apk/release/app-release.apk
```

#### Option C: Google Play Store
1. Create developer account ($25 one-time)
2. Create app entry
3. Upload APK using eas submit:
```bash
eas submit --platform android
```

#### Option D: Apple App Store
1. Create Apple Developer account ($99/year)
2. Create app entry in App Store Connect
3. Build with Xcode and submit

### 5. Environment Variables Setup

**Backend Production (.env)**
```
DATABASE_URL=postgresql://user:pass@host:5432/football_app
PORT=5000
JWT_SECRET=generate_random_secret_key_here
JWT_EXPIRY=7d
NODE_ENV=production
```

**Web Production (.env.production)**
```
VITE_API_URL=https://api.example.com/api
VITE_SOCKET_URL=https://api.example.com
```

**Mobile (.env or in app)**
Update hardcoded URLs in mobile/app/services/api.js:
```javascript
const API_URL = 'https://api.example.com/api';
const SOCKET_URL = 'https://api.example.com';
```

## Post-Deployment Checklist

### Immediate Tasks
- [ ] Test login/signup
- [ ] Create test session
- [ ] Join session
- [ ] Check real-time updates
- [ ] Test on mobile
- [ ] Verify email validation works

### Production Hardening
- [ ] Enable HTTPS everywhere
- [ ] Set up SSL certificate (auto with Vercel/Railway)
- [ ] Configure CORS for production domains
- [ ] Set strong JWT_SECRET
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Configure logging

### Security
- [ ] Review .env files (don't commit)
- [ ] Rotate secrets regularly
- [ ] Enable rate limiting
- [ ] Setup WAF (Web Application Firewall)
- [ ] Enable DDOS protection
- [ ] Regular security audits

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Setup analytics (Google Analytics)
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Setup uptime monitoring
- [ ] Alert on errors

### Backups
- [ ] Daily database backups
- [ ] Test backup restoration
- [ ] Store backups in multiple locations
- [ ] Document recovery procedure

## Domain Setup

1. Purchase domain from registrar (GoDaddy, Namecheap, etc.)
2. Point to hosting provider:
   - Vercel: Add CNAME record
   - Railway: Update DNS settings
   - Render: Update DNS settings
3. Update environment variables with new URLs
4. Redeploy applications

## Scaling for Growth

### Database
- Upgrade PostgreSQL tier as needed
- Add read replicas for read-heavy workloads
- Implement caching with Redis

### Backend
- Horizontal scaling with load balancer
- Implement session affinity for Socket.io
- Use Redis adapter for Socket.io

### Web
- Use CDN for static assets
- Enable compression
- Implement caching headers

### Mobile
- Monitor crash rates
- Track performance metrics
- A/B test features

## Rollback Procedures

### Backend
```bash
# Revert to previous version
git revert <commit-hash>
git push heroku main
```

### Web
```bash
# Revert on Vercel/Netlify
# Use dashboard to rollback to previous deployment
```

### Database
```bash
# Restore from backup
# Contact your hosting provider
```

## Troubleshooting Deployment

### Backend not connecting to database
```bash
# Test connection
psql <DATABASE_URL>

# If fails, check:
# - DATABASE_URL format
# - Database server is running
# - Firewall allows connection
# - User has correct permissions
```

### CORS errors
```javascript
// Update backend CORS in server.js
const io = socketIO(server, {
  cors: {
    origin: ['https://app.example.com', 'https://api.example.com'],
    methods: ['GET', 'POST'],
  },
});
```

### Socket.io not connecting
- Check VITE_SOCKET_URL is correct
- Verify backend Socket.io server is running
- Check firewall allows WebSocket connections

### Mobile app not connecting
- Verify API URL in mobile/app/services/api.js
- Update to production domain
- Rebuild and redeploy

## Performance Optimization

### Database
```sql
-- Analyze tables
ANALYZE;

-- Optimize indexes
VACUUM;

-- Monitor slow queries
SET log_min_duration_statement = 1000;
```

### Backend
```javascript
// Add caching
const redis = require('redis');
const client = redis.createClient();

// Cache sessions
app.get('/api/sessions', async (req, res) => {
  const cacheKey = `sessions:${req.query.page}`;
  const cached = await client.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  // ... rest of code
});
```

### Web
```javascript
// Enable service worker caching
// Add to vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate'
    })
  ]
}
```

## Cost Estimation

### Monthly Costs (Recommended Stack)

| Service | Plan | Cost |
|---------|------|------|
| Railway DB | PostgreSQL | $7 |
| Railway Backend | 500MB RAM | $5 |
| Vercel | Pro | $20 |
| Expo EAS | Pay as you go | ~$0-5 |
| Domain | .com | $10 |
| **Total** | | **~$40-50** |

### Cost Optimization
- Use free tier services where possible
- Optimize resource usage
- Monitor and adjust as needed
- Scale up only when necessary

## Support & Maintenance

### Regular Tasks
- Weekly: Check error logs
- Weekly: Monitor performance
- Monthly: Update dependencies
- Monthly: Review usage/costs
- Quarterly: Security audit
- Quarterly: Database optimization

### On-call Procedures
- Have backup database credentials
- Keep API documentation updated
- Document all custom configurations
- Maintain runbooks for common issues

## Monitoring Setup

### Sentry (Error Tracking)
```bash
npm install @sentry/node

// In server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-dsn' });
```

### LogRocket (Session Replay)
```bash
npm install logrocket
```

### New Relic (APM)
```bash
npm install newrelic
```

## Conclusion

You now have a complete guide to deploy the Football App to production. Start with the recommended stack and scale as needed based on user demand.

For questions, refer to provider documentation:
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Expo: https://docs.expo.dev
