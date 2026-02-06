# Football App - Full Stack Implementation

A complete full-stack application for finding football players and managing game sessions in Lucknow, India.

## Project Structure

```
Football App/
├── backend/          # Node.js + Express API server
├── web/              # React web frontend (Vite)
├── mobile/           # React Native mobile app (Expo)
└── README.md         # This file
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (7-day expiry)
- **Real-time**: Socket.io
- **Password Hashing**: bcrypt

### Web Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Real-time**: Socket.io client
- **HTTP**: Axios

### Mobile
- **Framework**: React Native
- **Platform**: Expo
- **Navigation**: @react-navigation
- **Storage**: AsyncStorage
- **HTTP**: Axios

## Features

### User Authentication
- Email/password signup and login
- Secure JWT token-based authentication
- 7-day token expiry
- Token stored in localStorage (web) / AsyncStorage (mobile)

### Session Management
- Create football game sessions
- Join/leave sessions (max 14 players)
- View session details with participants
- Cancel sessions (creator only)
- Filter sessions by status (open, full, completed, cancelled)

### Cost Splitting
- Automatic cost calculation: `totalCost ÷ participantCount`
- Real-time cost updates when players join/leave
- Equal split among all participants

### Real-time Updates
- Socket.io for live participant updates
- Cost recalculation broadcasts
- Real-time participant list refresh

## Database Schema

### Users Table
- `id` (PRIMARY KEY)
- `email` (UNIQUE)
- `password_hash`
- `full_name`
- `phone_number`
- `created_at`, `updated_at`

### Sessions Table
- `id` (PRIMARY KEY)
- `creator_id` (FOREIGN KEY → users)
- `title`, `description`
- `location_address`
- `scheduled_date`, `scheduled_time`
- `total_cost`
- `max_participants` (default: 14)
- `status` (open | full | cancelled | completed)
- `created_at`, `updated_at`

### Participants Table
- `id` (PRIMARY KEY)
- `session_id` (FOREIGN KEY → sessions)
- `user_id` (FOREIGN KEY → users)
- `cost_per_person`
- `status` (active | cancelled)
- UNIQUE constraint on (session_id, user_id)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Verify token

### Sessions
- `GET /api/sessions` - List sessions (paginated, filterable)
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session (creator only)
- `DELETE /api/sessions/:id` - Cancel session (creator only)

### Participants
- `POST /api/sessions/:id/join` - Join session
- `DELETE /api/sessions/:id/leave` - Leave session
- `GET /api/sessions/:id/participants` - Get participants list

## Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb football_app

# Run migrations (from backend folder)
cd backend
node src/database/runMigrations.js
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Web Frontend Setup

```bash
cd web
npm install
npm run dev
# App runs on http://localhost:5173
```

Create `.env` file in web folder:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Mobile App Setup

```bash
cd mobile
npm install
npm run start
# Use Expo Go app to scan QR code
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://localhost:5432/football_app
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
NODE_ENV=development
```

## Key Features

### Cost Splitting Logic
When a participant joins/leaves a session:
1. Count current active participants
2. Calculate: `costPerPerson = totalCost ÷ participantCount`
3. Update all participant records with new cost
4. Emit Socket.io event to all clients
5. Update UI in real-time

### Business Rules
- Maximum 14 participants per session
- Creator automatically joins as first participant
- No duplicate participants in same session
- Session becomes "full" at 14 participants
- Can only leave before scheduled date/time
- Creator cannot leave (must cancel entire session)

### Real-time Updates
- Socket.io rooms: `session-{id}`
- Events emitted:
  - `participant-joined` - New player joined
  - `participant-left` - Player left session
  - `cost-updated` - Cost recalculated

## Security Measures

- Passwords hashed with bcrypt (10 rounds)
- Parameterized SQL queries (prevent injection)
- JWT token verification middleware
- Rate limiting on auth endpoints (recommended)
- Input validation with express-validator
- CORS configured for development

## Testing Checklist

- [ ] Signup/Login flow works
- [ ] JWT token stored and sent with requests
- [ ] Create session with all fields
- [ ] Session appears in list
- [ ] View session details page
- [ ] Join session and see cost update
- [ ] Another user joins (real-time update)
- [ ] Leave session and cost recalculates
- [ ] Cannot join same session twice
- [ ] Cannot join when session is full (14 people)
- [ ] Creator can cancel session
- [ ] Mobile app has same functionality
- [ ] Error messages display correctly

## File Structure

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js
│   │   └── sessions.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   └── participantController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   └── Participant.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── costCalculator.js
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_sessions.sql
│   │   │   └── 003_create_participants.sql
│   │   └── runMigrations.js
│   ├── config/
│   │   └── database.js
│   └── server.js
├── package.json
└── .env
```

### Web
```
web/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   └── sessions/
│   │       └── SessionCard.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── SessionsPage.jsx
│   │   ├── CreateSessionPage.jsx
│   │   └── SessionDetailsPage.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── websocket.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

### Mobile
```
mobile/
├── app/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── SignupScreen.js
│   │   └── sessions/
│   │       ├── SessionsListScreen.js
│   │       ├── SessionDetailScreen.js
│   │       └── CreateSessionScreen.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── api.js
│   └── navigation/
│       └── AppNavigator.js
├── package.json
└── app.json
```

## Deployment

### Backend (Railway/Render)
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy Node.js app

### Web (Vercel/Netlify)
1. Connect GitHub repository
2. Set environment variables
3. Deploy on push to main

### Mobile (Expo)
1. Build APK: `eas build --platform android`
2. Build IPA: `eas build --platform ios` (requires macOS)
3. Or use Expo Go for testing

## Future Enhancements

- Payment integration (Razorpay)
- Google Maps for location
- User profiles and ratings
- Push notifications
- Private/invite-only sessions
- Recurring weekly games
- Chat functionality
- User reviews and ratings

## Known Issues & Limitations

- Node.js version < 18 may have compatibility issues
- Payments not integrated yet
- No location map integration
- Manual date/time entry required

## Support

For issues or questions, please create an issue in the project repository.

## License

MIT
