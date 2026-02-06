# Quick Start Guide

Get the Football App running locally in minutes.

## Prerequisites

- Node.js v16+ (v18+ recommended)
- npm v8+
- PostgreSQL installed and running

## 1. Database Setup (5 minutes)

```bash
# Create database
createdb football_app

# Run migrations
cd backend
node src/database/runMigrations.js

# You should see:
# ✓ Migration executed: 001_create_users.sql
# ✓ Migration executed: 002_create_sessions.sql
# ✓ Migration executed: 003_create_participants.sql
```

## 2. Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Server will run on http://localhost:5000
```

Test health check:
```bash
curl http://localhost:5000/health
# Response: {"status":"OK"}
```

## 3. Web Frontend Setup (2 minutes)

In a new terminal:

```bash
cd web

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env

# Start dev server
npm run dev

# App will run on http://localhost:5173
```

## 4. Mobile App Setup (Optional, 2 minutes)

In a new terminal:

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm run start

# Scan QR code with Expo Go app on your phone
```

## 5. Test the App

### Create a Test User

**Web App:**
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create account with:
   - Email: `test@example.com`
   - Password: `password123`
   - Full Name: `Test User`
4. Click Sign Up

### Create a Test Session

1. Click "+ Create Session"
2. Fill in:
   - Title: "Friday Football"
   - Location: "Central Park, Lucknow"
   - Date: 2025-02-15
   - Time: 18:00
   - Total Cost: 700
3. Click "Create Session"

### Join Session

1. Create a second user account (different email)
2. Click on the session you just created
3. Click "Join Session"
4. See cost update from 700 to 350 per person
5. Go back to first account, refresh - cost updates in real-time

## Common Issues

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL from Services
```

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Change PORT in backend/.env or kill existing process
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Vite Not Starting
```
Error: ENOENT: no such file or directory
```
**Solution**: Make sure you're in the web folder and installed dependencies
```bash
cd web
npm install
npm run dev
```

### CORS Errors
Make sure VITE_API_URL in web/.env matches backend URL:
```
VITE_API_URL=http://localhost:5000/api
```

## API Testing with Curl

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "phone_number": "+919876543210"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Returns: {"message":"Login successful","user":{...},"token":"eyJ..."}
```

### Create Session
```bash
TOKEN="your_token_here"

curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Friday Football",
    "description": "Evening match",
    "location_address": "Central Park",
    "scheduled_date": "2025-02-15",
    "scheduled_time": "18:00",
    "total_cost": 700
  }'
```

### List Sessions
```bash
curl http://localhost:5000/api/sessions
```

## Development Tips

### Hot Reload
- Backend: Automatic with `nodemon`
- Web: Automatic with Vite
- Mobile: Automatic with Expo

### Check Backend Logs
```bash
# Terminal running backend
# Watch for any errors
```

### Check Database
```bash
# Connect to PostgreSQL
psql football_app

# List tables
\dt

# View sessions
SELECT * FROM sessions;

# View participants
SELECT * FROM participants;
```

### Reset Database
```bash
# Delete all data
cd backend
psql football_app < src/database/migrations/001_create_users.sql
psql football_app < src/database/migrations/002_create_sessions.sql
psql football_app < src/database/migrations/003_create_participants.sql
```

## Next Steps

1. **Add more users** - Test with multiple accounts
2. **Create more sessions** - Test filtering and pagination
3. **Test real-time updates** - Open same session in two browsers
4. **Test mobile app** - Use Expo Go on phone
5. **Deploy** - See README.md for deployment instructions

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` in backend/.env
- [ ] Set `NODE_ENV=production`
- [ ] Set up proper database backups
- [ ] Add rate limiting to auth endpoints
- [ ] Set proper CORS origins
- [ ] Use HTTPS for all connections
- [ ] Add payment integration if needed
- [ ] Set up monitoring/logging
- [ ] Test all workflows end-to-end

## Getting Help

- Check error messages carefully
- Review backend logs
- Check browser console (web)
- Read README.md for architecture details
- Test API endpoints with curl

Enjoy building! 🎉
