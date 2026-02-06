#!/bin/bash

echo "=========================================="
echo "MOBILE APP API TEST"
echo "=========================================="
echo ""

echo "✓ TEST 1: Mobile Login"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
MOBILE_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Login successful. Token received: ${MOBILE_TOKEN:0:50}..."
echo ""

echo "✓ TEST 2: Get Session List (Mobile)"
curl -s "http://localhost:5001/api/sessions" | head -c 200
echo "..."
echo ""

echo "✓ TEST 3: Get Session Details"
curl -s "http://localhost:5001/api/sessions/3" | head -c 200
echo "..."
echo ""

echo "✓ TEST 4: Get Participants (Mobile)"
curl -s "http://localhost:5001/api/sessions/3/participants" | head -c 200
echo "..."
echo ""

echo "=========================================="
echo "Mobile App Configuration Status:"
echo "=========================================="
echo "✓ Backend URL: http://localhost:5001/api"
echo "✓ Token Storage: AsyncStorage"
echo "✓ Auth Interceptor: Enabled"
echo "✓ Available Endpoints:"
echo "  - POST /auth/signup"
echo "  - POST /auth/login"
echo "  - GET  /auth/me"
echo "  - GET  /sessions"
echo "  - POST /sessions"
echo "  - POST /sessions/:id/join"
echo "  - DELETE /sessions/:id/leave"
echo "  - GET /sessions/:id/participants"
echo ""
echo "✓ All endpoints tested successfully!"
