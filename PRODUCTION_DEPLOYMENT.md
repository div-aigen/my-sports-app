# Production Deployment Guide - My Sports App

This guide covers deploying your full-stack application (backend, web, and mobile) to production.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├──────────────────────┬──────────────────────────────────────┤
│  Web (React + Vite)  │  Mobile (React Native + Expo)        │
│  Vercel/Netlify      │  Expo / App Stores                   │
├──────────────────────┴──────────────────────────────────────┤
│                    API Layer                                 │
│         Backend (Node.js + Express) - Railway/Render        │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                            │
│      PostgreSQL - Railway/AWS RDS/Supabase                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. DATABASE SETUP

### Option A: Railway (Recommended - Easiest)

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project → Add PostgreSQL
4. Note the connection string
5. Keep it secure in `.env`

### Option B: Supabase

1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Free tier includes 500MB database

### Option C: AWS RDS

1. AWS Console → RDS → Create database
2. Choose PostgreSQL
3. Use Free Tier if eligible
4. More complex but highly scalable

---

## 2. BACKEND DEPLOYMENT

### Option A: Railway (Recommended)

**Step 1: Prepare Backend**
```bash
cd backend
# Make sure .env has production settings
# Update database URL to production PostgreSQL
```

**Step 2: Deploy to Railway**
1. Go to Railway.app → New Project → GitHub Repo
2. Connect your repository
3. Add PostgreSQL service
4. Configure environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Strong random string
   - `JWT_EXPIRY` - "7d"
   - `NODE_ENV` - "production"
   - `CORS_ORIGIN` - Web frontend URL

**Step 3: Run Migrations**
```bash
# In Railway terminal or local with production DB
npm run migrate
```

**Step 4: Get Backend URL**
- Railway provides a public URL like `https://your-app.up.railway.app`
- Note this for frontend configuration

### Option B: Render

1. Go to https://render.com
2. New → Web Service → Connect GitHub
3. Select backend folder
4. Build command: `npm install && npm run migrate`
5. Start command: `npm start`
6. Add environment variables same as Railway

### Option C: Heroku

1. Go to https://heroku.com
2. Create new app
3. Connect GitHub repository
4. Add PostgreSQL add-on
5. Deploy

---

## 3. WEB FRONTEND DEPLOYMENT

### Option A: Vercel (Recommended)

**Step 1: Prepare Web App**
```bash
cd web
# Update API URL to production backend
# In src/services/api.js, change API_URL to your Railway/Render URL
```

**Step 2: Deploy**
1. Go to https://vercel.com
2. Import GitHub repository
3. Select `web` as root directory
4. Add environment variables:
   - `VITE_API_URL` - Your production backend URL (e.g., https://your-app.up.railway.app/api)
5. Deploy

**Step 3: Configure**
- Vercel auto-deploys on git push
- Your site will be at `https://your-app.vercel.app`

### Option B: Netlify

1. Go to https://netlify.com
2. Connect GitHub → Select repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables and deploy

### Option C: Static Hosting

You can also host on:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps

---

## 4. MOBILE APP DEPLOYMENT

### Option A: Expo (Easiest - Web-Only Distribution)

**Step 1: Build Production Expo App**
```bash
cd mobile
# Update API_URL in services/api.js to production backend
npx expo build:android  # For Android APK
npx expo build:ios      # For iOS (requires Apple Developer account)
```

**Step 2: Share APK**
- Download APK from Expo
- Share link with users or upload to website
- Users can install via direct APK download

### Option B: Google Play Store (Android)

**Requirements:**
- Google Developer account ($25 one-time)
- Signed APK
- App store listing

**Steps:**
1. Generate signed APK:
```bash
cd mobile
eas build --platform android --auto-submit
```

2. Upload to Google Play Console
3. Fill in app details, screenshots, description
4. Submit for review (typically 1-2 hours)

### Option C: Apple App Store (iOS)

**Requirements:**
- Apple Developer account ($99/year)
- Mac with Xcode
- App Store listing

**Steps:**
```bash
cd mobile
eas build --platform ios
# Follow Apple's app submission process
```

### Option D: TestFlight (iOS Testing)

- Distribute beta version for testing
- Users download via TestFlight app
- Good for gathering feedback before App Store

---

## 5. ENVIRONMENT VARIABLES

### Backend (.env)

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/football_app
JWT_SECRET=your_super_secret_random_string_here
JWT_EXPIRY=7d
CORS_ORIGIN=https://your-app.vercel.app,https://yourdomain.com
```

### Web (.env)

```
VITE_API_URL=https://your-backend-url.up.railway.app/api
```

### Mobile (services/api.js)

```javascript
const API_URL = 'https://your-backend-url.up.railway.app/api';
```

---

## 6. DOMAIN NAME (Optional)

1. Buy domain from GoDaddy, Namecheap, or Route 53
2. Configure DNS:
   - For Vercel: Add CNAME record
   - For Railway: Add custom domain in settings
3. Enable HTTPS (automatic with most platforms)

---

## 7. MONITORING & MAINTENANCE

### Logging
- Railway/Render have built-in logs
- Check logs regularly for errors

### Database Backups
- Railway: Automatic daily backups
- AWS RDS: Configure automated backups
- Supabase: Automatic backups included

### Performance Monitoring
- Use New Relic, DataDog, or built-in tools
- Monitor API response times
- Track database query performance

### Updates
- Keep dependencies updated
- Test updates in staging first
- Plan maintenance windows

---

## 8. QUICK START DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Update all API URLs to production
- [ ] Change JWT_SECRET to strong random value
- [ ] Disable debug logging
- [ ] Test all features in staging
- [ ] Set up database backups
- [ ] Configure CORS for production domains

### Backend
- [ ] Create PostgreSQL database
- [ ] Deploy to Railway/Render/Heroku
- [ ] Run migrations
- [ ] Test API endpoints
- [ ] Set up monitoring

### Web Frontend
- [ ] Update API_URL to production backend
- [ ] Deploy to Vercel/Netlify
- [ ] Test all pages
- [ ] Check mobile responsiveness
- [ ] Set up SSL certificate

### Mobile
- [ ] Update API_URL to production backend
- [ ] Build APK/IPA
- [ ] Test on actual device
- [ ] Deploy to Expo/Play Store/App Store

### Post-Deployment
- [ ] Test entire user flow
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring
- [ ] Create admin user for production
- [ ] Document deployment process

---

## 9. ESTIMATED COSTS (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway DB | - | $5-20 |
| Railway Backend | $5 | $5-50 |
| Vercel Web | Yes | $0-50 |
| Expo (Mobile) | Yes | $0-300 |
| Domain | - | $1-15 |
| **TOTAL** | ~$5-10 | ~$20-150 |

---

## 10. TROUBLESHOOTING

### CORS Errors
- Check CORS_ORIGIN in backend .env
- Must match your frontend URL exactly

### Database Connection Errors
- Verify DATABASE_URL is correct
- Check firewall/IP whitelist
- Ensure migrations ran successfully

### Mobile App Not Connecting
- Check API_URL in services/api.js
- Ensure backend is running
- Check network connectivity

### Slow Performance
- Profile database queries
- Implement caching
- Optimize images
- Use CDN for static assets

---

## 11. SCALING TIPS

As your app grows:

1. **Database**
   - Add read replicas
   - Implement caching (Redis)
   - Optimize queries

2. **Backend**
   - Auto-scaling
   - Load balancing
   - API rate limiting

3. **Frontend**
   - CDN for assets
   - Code splitting
   - Image optimization

4. **Mobile**
   - Monitor app size
   - Optimize bundle size
   - Use code splitting

---

## Next Steps

1. Choose your deployment providers (recommended: Railway + Vercel)
2. Set up PostgreSQL database
3. Deploy backend
4. Update frontend API URL and deploy
5. Build and distribute mobile app
6. Monitor and maintain

For more detailed guides, see individual platform documentation.
