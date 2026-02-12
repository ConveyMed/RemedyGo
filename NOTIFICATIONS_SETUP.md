# Notification Setup

## Required API Keys

### 1. OneSignal (Push Notifications)
- **Website:** https://onesignal.com
- **Keys needed:**
  - `ONESIGNAL_APP_ID` - Found in Settings > Keys & IDs
  - `ONESIGNAL_REST_API_KEY` - Found in Settings > Keys & IDs

**Setup steps:**
1. Create account at onesignal.com
2. Create new app
3. Configure Web Push (for Netlify)
4. Configure iOS/Android if using Capacitor builds
5. Copy App ID and REST API Key

**Apple APNs Key (for iOS push):**
- Create in Apple Developer Portal
- Upload to OneSignal Dashboard
- Services: Apple Push Notifications service (APNs)
- Mode: Production

**OneSignal App:**
- App ID: [Get from OneSignal Dashboard]
- SDK: Ionic (for Capacitor - not Web React)

---

## Configuration

### Supabase Secrets (Edge Functions)
```bash
supabase secrets set ONESIGNAL_APP_ID=your_app_id --project-ref YOUR_PROJECT_REF
supabase secrets set ONESIGNAL_REST_API_KEY=your_rest_api_key --project-ref YOUR_PROJECT_REF
```

### Frontend Environment (.env)
```
REACT_APP_ONESIGNAL_APP_ID=your_app_id
```

---

## Database Migration
Run `supabase/notification_preferences.sql` in Supabase SQL Editor to create the user_notification_preferences table.

---

## Edge Functions Deployed
- `send-push-notification` - OneSignal integration
- `notification-dispatcher` - Central routing

---

## Notification Triggers Implemented

### Posts & Feed (6)
- New post published
- Post liked
- Post commented
- Comment replied
- Bookmarked post activity
- Scheduled post published

### Chat (4)
- Direct message
- Group message
- Added to chat
- Removed from chat

### Updates & Events (4)
- New update
- New event
- Event reminder
- RSVP digest

### Admin (2)
- New user joined
- Conversation reported
