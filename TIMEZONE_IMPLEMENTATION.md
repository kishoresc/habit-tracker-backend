# Timezone Support Implementation

## ✅ What Was Implemented

### 1. Backend Changes

**User Model** (`models/User.js`)
- ✅ Already had `timezone` field (default: 'UTC')

**Auth Controller** (`controllers/authController.js`)
- ✅ Updated `register` to accept timezone during signup
- ✅ Updated `login` to return user's timezone
- ✅ Updated `getProfile` to return timezone
- ✅ Already had `updateProfile` to update timezone

**Cron Controller** (`controllers/cronController.js`)
- ✅ Updated `isTimeToSendReminder` to use user's timezone
- ✅ Uses `Intl.DateTimeFormat` to convert server time to user's timezone
- ✅ Logs show timezone being used for each check
- ✅ Each user can have different timezone

**Scripts**
- ✅ Created `scripts/update-user-timezone.js` to update existing users

### 2. How It Works Now

**Before (Problem):**
```
Server Time: 4:49 AM UTC
User sets reminder: 10:12 (thinking it's IST)
Comparison: 4:49 UTC vs 10:12 = NO MATCH ❌
Result: Email never sent
```

**After (Solution):**
```
Server Time: 4:49 AM UTC
User Timezone: Asia/Kolkata (IST = UTC+5:30)
Server time in user timezone: 10:19 AM IST
User sets reminder: 10:12 IST
Comparison: 10:19 IST vs 10:12 IST = MATCH at 10:12 ✅
Result: Email sent at correct time!
```

### 3. Supported Timezones

The system supports all IANA timezone identifiers:

**Common Timezones:**
- `Asia/Kolkata` - India Standard Time (IST, UTC+5:30)
- `America/New_York` - US Eastern Time
- `America/Los_Angeles` - US Pacific Time
- `Europe/London` - UK Time
- `Asia/Tokyo` - Japan Time
- `Australia/Sydney` - Australian Eastern Time
- `UTC` - Universal Coordinated Time

**Full list:** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## 📋 For Existing Users

### Update Timezone via Script

```bash
cd "e:\Myself Projects\habit-tracker\Backend"
node scripts/update-user-timezone.js <email> <timezone>
```

**Example:**
```bash
node scripts/update-user-timezone.js tarunraaj2003@gmail.com Asia/Kolkata
```

### Update Timezone via API

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "timezone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "...",
    "name": "Tarun",
    "email": "tarunraaj2003@gmail.com",
    "timezone": "Asia/Kolkata",
    ...
  }
}
```

## 🎯 For New Users

### Registration with Timezone

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "timezone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "timezone": "Asia/Kolkata",
  "token": "..."
}
```

**Note:** If timezone is not provided during registration, it defaults to 'UTC'.

## 🔧 Frontend Implementation Needed

### 1. Add Timezone Selector to Registration Form

```jsx
import React, { useState } from 'react';

const timezones = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'US Eastern' },
  { value: 'America/Los_Angeles', label: 'US Pacific' },
  { value: 'Europe/London', label: 'UK' },
  { value: 'UTC', label: 'UTC' },
  // Add more as needed
];

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect
  });

  return (
    <form>
      {/* Name, Email, Password fields */}
      
      <div>
        <label>Timezone</label>
        <select 
          value={formData.timezone}
          onChange={(e) => setFormData({...formData, timezone: e.target.value})}
        >
          {timezones.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
      
      <button type="submit">Register</button>
    </form>
  );
}
```

### 2. Auto-Detect User's Timezone

```javascript
// Get user's timezone automatically
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(userTimezone); // e.g., "Asia/Kolkata"

// Use this as default value in registration form
```

### 3. Add Timezone to Profile Settings

```jsx
function ProfileSettings() {
  const [timezone, setTimezone] = useState(user.timezone);

  const handleUpdateTimezone = async () => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timezone }),
    });
    
    const data = await response.json();
    console.log('Timezone updated:', data);
  };

  return (
    <div>
      <h2>Profile Settings</h2>
      <label>Timezone</label>
      <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
        {timezones.map(tz => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </select>
      <button onClick={handleUpdateTimezone}>Save</button>
    </div>
  );
}
```

### 4. Show Current Time in User's Timezone

```jsx
function HabitReminderForm() {
  const [reminderTime, setReminderTime] = useState('');
  
  // Show current time in user's timezone
  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: user.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div>
      <p>Current time in your timezone: {currentTime}</p>
      <label>Reminder Time</label>
      <input 
        type="time" 
        value={reminderTime}
        onChange={(e) => setReminderTime(e.target.value)}
      />
    </div>
  );
}
```

## 🧪 Testing

### 1. Wait for Render Deployment
- Check Render dashboard for deployment completion
- Look for commit: "Add timezone support for email reminders"

### 2. Verify User Timezone
```bash
node scripts/check-habit-reminders.js
```

Should show:
```
User Timezone: Asia/Kolkata
Current time in timezone: 10:25 AM
```

### 3. Set Test Reminder
- Current time: 10:25 AM IST
- Set reminder: 10:28 AM IST
- Wait for 10:28 AM
- Check Render logs

### 4. Expected Logs at 10:28 AM
```
⏰ [CRON] Processing custom reminders...
⏰ [CRON] Found 1 habits with email reminders enabled
⏰ [CRON] Checking habit: "Drink water" (Reminder: 10:28, Timezone: Asia/Kolkata)
⏰ [CRON] Time check (Asia/Kolkata): Current 10:28 vs Reminder 10:28 = true
✅ Reminder sent to tarunraaj2003@gmail.com for habit: Drink water
⏰ [CRON] Custom reminders completed. Emails sent: 1, Errors: 0
```

## 📊 Current Status

### ✅ Completed
- [x] Backend timezone support
- [x] User model has timezone field
- [x] Registration accepts timezone
- [x] Profile update supports timezone
- [x] Cron job uses user's timezone
- [x] Existing user updated to Asia/Kolkata
- [x] Detailed logging for debugging

### ⏳ Pending (Frontend)
- [ ] Add timezone selector to registration form
- [ ] Add timezone to profile settings
- [ ] Auto-detect user's timezone
- [ ] Show current time in user's timezone
- [ ] Update registration API call to include timezone

## 🎉 Benefits

1. **Accurate Reminders**: Users receive reminders at the correct local time
2. **Global Support**: Works for users in any timezone
3. **No Manual Conversion**: Users don't need to calculate UTC offsets
4. **Flexible**: Each user can have their own timezone
5. **Future-Proof**: Handles daylight saving time automatically

## 🔍 Troubleshooting

### Issue: Reminders still not working

**Check:**
1. User's timezone is set correctly
   ```bash
   node scripts/check-habit-reminders.js
   ```

2. Render deployment is complete

3. Logs show correct timezone conversion
   ```
   ⏰ [CRON] Time check (Asia/Kolkata): Current X:XX vs Reminder Y:YY
   ```

4. Reminder time format is correct (HH:MM, e.g., "10:30")

### Issue: Wrong time being used

**Solution:**
- Update user's timezone using the script
- Verify timezone name is correct (use IANA format)
- Check logs to see what timezone is being used

## 📝 Notes

- Server always runs in UTC
- Timezone conversion happens at runtime
- No need to restart server when user changes timezone
- Timezone is stored per user, not globally
- Supports all IANA timezone identifiers
