# Lineup - Sports Session Management App

## Overview
Lineup is a mobile sports session management app that helps young adults in India find and organize local sports games (football, cricket, basketball, etc.) with friends and strangers.

## Architecture
- **Frontend**: React Native (Expo SDK 54) with expo-router file-based navigation
- **Backend**: FastAPI proxy server that forwards requests to the external Railway backend
- **External API**: https://my-sports-app-testing.up.railway.app/api (Node.js + PostgreSQL)

## Design System: "Urban Sports Night"
- **Primary Accent**: Neon Lime (#D0FD3E) 
- **Dark Background**: Deep Obsidian (#0A0A0A)
- **Light Background**: Slate (#F8FAFC)
- **Typography**: System Bold (900 weight for headings)
- **Components**: Pill-shaped buttons, 24px rounded cards, glassmorphic modals

## Key Features
1. **Authentication**: Login, Signup, Forgot/Reset Password, Email Verification
2. **Session Browsing**: Filter by date, location, sport type with status pills
3. **Session Creation**: Venue selection, sport picker, date/time, cost, max players
4. **Session Details**: Info grid, participant list, cost splitting, invite code sharing
5. **My Sessions**: Tabs for Joined, Created, Done sessions
6. **Profile**: Dark mode toggle, change password, FAQ, about, logout, delete account
7. **Deep Linking**: Join sessions via invite code or URL
8. **Push Notifications**: Session updates via Expo Notifications
9. **Dark/Light Theme**: Full theme support with persistent preference

## Screen Structure
- `/(tabs)/` - Tab navigation (Home, My Games, Profile)
- `/screens/auth/` - Login, ForgotPassword, ResetPassword, VerifyEmail
- `/screens/sessions/` - SessionsList, CreateSession, MySessions
- `/screens/profile/` - Profile with settings
- `/components/sessions/` - SessionDetailsModal
- `/session/[id]` - Deep link session detail page
- `/sessions/[id]` - Redirect to session detail

## Recent Bug Fixes (v1.0.4)
1. **FAQ Scrollability**: Added `maxHeight: '75%'` to modal container so FAQ list scrolls properly
2. **Created Sessions in Joined Tab**: Removed `s.creator_id !== user.id` filter — creator sessions now appear in both Joined and Created tabs
3. **Leave + Cancel for Creators**: Session detail modals now show both "Leave Session" and "Cancel Session" buttons for session creators
4. **Viewport Scaling**: Updated `+html.tsx` with `viewport-fit=cover`, `user-scalable=no`, and proper CSS to fill device screen

## Business Enhancement
- **Referral/Invite System**: The session invite code sharing feature can be enhanced with referral rewards to drive viral user acquisition among sports communities.
