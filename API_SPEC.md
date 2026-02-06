# Football App - API Specification

Complete API reference for the Football App backend.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Token expires in 7 days. Format:
```
{
  "id": 1,
  "email": "user@example.com"
}
```

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "user": { ... },
  "session": { ... },
  "token": "eyJ...",
  "sessions": [ ... ],
  "participants": [ ... ]
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Endpoints

### Authentication

#### POST /auth/signup
Register a new user.

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone_number": "+919876543210"
}
```

**Response** (201 Created)
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+919876543210"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Errors**
- 400: Email already registered
- 400: Invalid password (< 6 characters)
- 400: Missing required fields

#### POST /auth/login
Authenticate user and get JWT token.

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+919876543210"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Errors**
- 401: Invalid email or password
- 400: Missing email or password

#### GET /auth/me
Verify token and get current user.

**Headers**
```
Authorization: Bearer <token>
```

**Response** (200 OK)
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+919876543210"
  }
}
```

**Errors**
- 401: Access token required
- 403: Invalid or expired token
- 404: User not found

### Sessions

#### GET /sessions
List all sessions with pagination and filtering.

**Query Parameters**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `status` (optional): Filter by status (open, full, completed, cancelled)
- `date` (optional): Filter by date (YYYY-MM-DD)

**Request**
```
GET /sessions?page=1&limit=10&status=open
```

**Response** (200 OK)
```json
{
  "sessions": [
    {
      "id": 1,
      "creator_id": 1,
      "creator_name": "John Doe",
      "title": "Friday Evening Football",
      "description": "Casual match",
      "location_address": "Central Park, Lucknow",
      "scheduled_date": "2025-02-15",
      "scheduled_time": "18:00",
      "total_cost": 700,
      "max_participants": 14,
      "participant_count": 5,
      "status": "open",
      "created_at": "2025-02-06T10:30:00Z",
      "updated_at": "2025-02-06T10:30:00Z"
    }
  ]
}
```

#### GET /sessions/:id
Get detailed information about a specific session.

**Request**
```
GET /sessions/1
```

**Response** (200 OK)
```json
{
  "session": {
    "id": 1,
    "creator_id": 1,
    "creator_name": "John Doe",
    "title": "Friday Evening Football",
    "description": "Casual match",
    "location_address": "Central Park, Lucknow",
    "scheduled_date": "2025-02-15",
    "scheduled_time": "18:00",
    "total_cost": 700,
    "max_participants": 14,
    "participant_count": 5,
    "status": "open",
    "created_at": "2025-02-06T10:30:00Z",
    "updated_at": "2025-02-06T10:30:00Z"
  }
}
```

**Errors**
- 404: Session not found

#### POST /sessions
Create a new session. User automatically joins as first participant.

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**
```json
{
  "title": "Friday Evening Football",
  "description": "Casual evening match at the park",
  "location_address": "Central Park, Lucknow",
  "scheduled_date": "2025-02-15",
  "scheduled_time": "18:00",
  "total_cost": 700
}
```

**Response** (201 Created)
```json
{
  "message": "Session created successfully",
  "session": {
    "id": 1,
    "creator_id": 1,
    "title": "Friday Evening Football",
    "description": "Casual evening match at the park",
    "location_address": "Central Park, Lucknow",
    "scheduled_date": "2025-02-15",
    "scheduled_time": "18:00",
    "total_cost": 700,
    "max_participants": 14,
    "status": "open",
    "created_at": "2025-02-06T10:30:00Z",
    "updated_at": "2025-02-06T10:30:00Z"
  }
}
```

**Validation**
- title: Required, non-empty
- location_address: Required, non-empty
- scheduled_date: Required, valid ISO date (YYYY-MM-DD)
- scheduled_time: Required, valid time (HH:MM)
- total_cost: Required, must be > 0

**Errors**
- 400: Validation error
- 401: Access token required

#### PUT /sessions/:id
Update session details. Only creator can update.

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "location_address": "New Location",
  "scheduled_date": "2025-02-16",
  "scheduled_time": "19:00",
  "total_cost": 800
}
```

**Response** (200 OK)
```json
{
  "message": "Session updated successfully",
  "session": { ... }
}
```

**Errors**
- 403: Only creator can update session
- 404: Session not found
- 400: Validation error

#### DELETE /sessions/:id
Cancel a session. Only creator can cancel.

**Headers**
```
Authorization: Bearer <token>
```

**Response** (200 OK)
```json
{
  "message": "Session cancelled successfully",
  "session": {
    "id": 1,
    "status": "cancelled",
    ...
  }
}
```

**Errors**
- 403: Only creator can cancel session
- 404: Session not found

### Participants

#### POST /sessions/:id/join
Join a session. Current user becomes a participant.

**Headers**
```
Authorization: Bearer <token>
```

**Response** (201 Created)
```json
{
  "message": "Joined session successfully",
  "participant": {
    "id": 5,
    "session_id": 1,
    "user_id": 2,
    "cost_per_person": 140,
    "status": "active",
    "created_at": "2025-02-06T10:35:00Z"
  }
}
```

**Socket.io Event Emitted**
```
Room: session-1
Event: participant-joined
Data: {
  "sessionId": 1,
  "participant": { ... }
}
```

**Errors**
- 400: User already joined this session
- 400: Session is full (14 participants)
- 400: Session not found or is cancelled
- 401: Access token required

#### DELETE /sessions/:id/leave
Leave a session. User removes themselves from participants.

**Headers**
```
Authorization: Bearer <token>
```

**Response** (200 OK)
```json
{
  "message": "Left session successfully"
}
```

**Socket.io Event Emitted**
```
Room: session-1
Event: participant-left
Data: {
  "sessionId": 1,
  "userId": 2
}
```

**Validations**
- Cannot leave if session has already started
- Creator cannot leave (must cancel session)

**Errors**
- 400: Creator cannot leave session
- 400: Cannot leave session that has already started
- 400: User is not a participant in this session
- 401: Access token required

#### GET /sessions/:id/participants
Get list of all participants in a session.

**Request**
```
GET /sessions/1/participants
```

**Response** (200 OK)
```json
{
  "participants": [
    {
      "id": 1,
      "user_id": 1,
      "session_id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+919876543210",
      "cost_per_person": 140,
      "status": "active",
      "created_at": "2025-02-06T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": 2,
      "session_id": 1,
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "phone_number": "+918765432109",
      "cost_per_person": 140,
      "status": "active",
      "created_at": "2025-02-06T10:31:00Z"
    }
  ],
  "count": 2
}
```

**Errors**
- 404: Session not found

## Cost Calculation

Cost per person is calculated as:
```
costPerPerson = totalCost ÷ numberOfActiveParticipants
```

When someone joins:
1. New count = current count + 1
2. New cost = total_cost ÷ new count
3. All participant records updated with new cost
4. Socket.io event emitted to all clients

Example:
```
Total cost: ₹700
Initial participants: 1
Cost per person: ₹700

After 2nd person joins:
New cost: ₹700 ÷ 2 = ₹350 per person

After 4th person joins:
New cost: ₹700 ÷ 4 = ₹175 per person
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 500 | Server Error |

## Rate Limiting

(Recommended for production)
- Auth endpoints: 5 requests per minute
- API endpoints: 30 requests per minute

## Socket.io Events

### Room: `session-{id}`

#### participant-joined
Emitted when a user joins a session.
```javascript
socket.on('participant-joined', (data) => {
  console.log(data.sessionId);
  console.log(data.participant);
});
```

#### participant-left
Emitted when a user leaves a session.
```javascript
socket.on('participant-left', (data) => {
  console.log(data.sessionId);
  console.log(data.userId);
});
```

## Pagination

List endpoints support pagination:
- `page`: Current page (starts at 1)
- `limit`: Items per page (default 10)

Example:
```
GET /sessions?page=2&limit=20
```

Returns 20 items starting from item 21.

## Filtering

### Session Status Filter
```
GET /sessions?status=open
GET /sessions?status=full
GET /sessions?status=completed
GET /sessions?status=cancelled
```

### Date Filter
```
GET /sessions?date=2025-02-15
```

## Data Types

- `id`: Integer
- `email`: String (email format)
- `full_name`: String
- `phone_number`: String
- `title`: String
- `description`: String (optional)
- `location_address`: String
- `scheduled_date`: String (YYYY-MM-DD format)
- `scheduled_time`: String (HH:MM format)
- `total_cost`: Decimal (2 decimal places)
- `cost_per_person`: Decimal (2 decimal places)
- `max_participants`: Integer (default 14)
- `status`: Enum (open, full, cancelled, completed)
- `timestamp`: ISO 8601 format

## Example Workflows

### Complete Flow: Create and Join Session

1. **Signup**
```bash
POST /auth/signup
→ Get token
```

2. **Create Session**
```bash
POST /sessions
→ User auto-joins
→ Session created with status "open"
```

3. **List Sessions**
```bash
GET /sessions?status=open
→ See created session
```

4. **Another user joins**
```bash
POST /sessions/1/join
→ Cost recalculated for all
→ Real-time update via Socket.io
```

5. **View participants**
```bash
GET /sessions/1/participants
→ See all users and updated costs
```

6. **Leave session**
```bash
DELETE /sessions/1/leave
→ Cost recalculated
→ Real-time update via Socket.io
```

## Troubleshooting

### Token Expired
- Error: 403 Invalid or expired token
- Solution: Login again to get new token

### Validation Error
- Error: 400 Validation error with details
- Check request format matches specification
- Ensure required fields are present

### Duplicate Session Join
- Error: 400 User already joined this session
- Cannot join same session twice
- Use different session ID

### Session Full
- Error: 400 Session is full
- Maximum 14 participants reached
- Wait for someone to leave or create new session
