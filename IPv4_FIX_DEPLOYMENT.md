# IPv4 Fix Deployment - Email Reminder System

## 🚀 Deployment Status
**Date**: May 19, 2026  
**Commit**: 3ed1405  
**Status**: ✅ Pushed to GitHub (Render will auto-deploy)

---

## 🔧 Changes Applied

### Root Cause
The email reminder system was failing with IPv6 connection error:
```
Error: connect ENETUNREACH 2404:6800:4003:c04::6c:587
```

This occurred because:
1. Render's free tier doesn't support IPv6 connections
2. Node.js was attempting to use IPv6 to connect to Gmail's SMTP server
3. The `service: 'gmail'` shorthand in nodemailer may have been ignoring DNS options

### Solution Implemented

#### 1. **Force IPv4 DNS Resolution**
Added `dnsOptions: { family: 4 }` to all nodemailer transporter configurations:
- `utils/emailService.js` - Main email service (both database and env fallback)
- `controllers/smtpController.js` - SMTP test connection

#### 2. **Use Explicit SMTP Host**
Changed from:
```javascript
service: 'gmail'  // This shorthand may ignore dnsOptions
```

To:
```javascript
host: 'smtp.gmail.com'  // Explicit host respects dnsOptions
```

#### 3. **Enhanced Connection Settings**
- **Timeouts**: Increased from 30s to 60s for Render's slower network
- **Connection Pooling**: Disabled (`pool: false`) for reliability
- **TLS Options**: Added `rejectUnauthorized: false` and `minVersion: 'TLSv1.2'`
- **Retry Logic**: 3 attempts with 2-second delays between retries

---

## 📋 Files Modified

1. **utils/emailService.js**
   - Added IPv4 DNS options to both database and environment transporter configs
   - Removed `service: 'gmail'` shorthand
   - Added explicit `host: 'smtp.gmail.com'`
   - Enhanced retry logic with attempt counters

2. **controllers/smtpController.js**
   - Added IPv4 DNS options to test connection transporter
   - Ensures test connection uses same settings as production

3. **controllers/cronController.js**
   - Already has timezone support (no changes needed)
   - Uses `moment-timezone` for user timezone handling

---

## 🔍 What to Monitor After Deployment

### 1. Check Render Deployment
- Go to Render dashboard: https://dashboard.render.com
- Wait for deployment to complete (usually 2-3 minutes)
- Check deployment logs for any errors

### 2. Monitor Email Sending
Set a test reminder for the next minute and watch for:

**Expected Success Logs:**
```
⏰ [CRON] Processing custom reminders...
⏰ [CRON] Found X habits with email reminders enabled
⏰ [CRON] Checking habit: "Drink water" (Reminder: 10:30, Timezone: Asia/Kolkata)
📧 Attempting to send email to user@example.com (1/3 attempts)
Using SMTP settings from database
✅ Email sent successfully: <message-id>
✅ Reminder sent to user@example.com for habit: Drink water
```

**If Still Failing:**
```
❌ Email send attempt failed (1/3): connect ENETUNREACH 2404:6800:4003:c04::6c:587
```
This would indicate the fix didn't work and we need alternative approach.

### 3. Test with Your Habit
Current test habit:
```json
{
  "_id": "6a02bf1908eef6c00e3ec925",
  "userId": "6a02bea108eef6c00e3ec8f0",
  "name": "Drink water",
  "emailReminderEnabled": true,
  "emailReminderTime": "10:12"
}
```

User timezone: `Asia/Kolkata` (IST)

---

## 🎯 Next Steps

### If Fix Works ✅
1. You should receive email at the scheduled time
2. Logs will show successful email sending
3. No more IPv6 errors in Render logs

### If Fix Doesn't Work ❌
We have backup options:

#### Option A: Use Alternative SMTP Service
- Try SendGrid, Mailgun, or AWS SES
- These services may have better IPv4 support on Render

#### Option B: Use SMTP Relay Service
- Set up a relay service that forces IPv4
- Examples: smtp2go.com, elasticemail.com

#### Option C: Use Render's Paid Tier
- Paid tiers may have better network configuration
- IPv6 support might be available

#### Option D: Move to Different Hosting
- Vercel, Railway, or Fly.io might have better IPv6/IPv4 handling
- Test on different platform

---

## 📊 Current System Configuration

### SMTP Settings (from Database)
- **Provider**: Gmail
- **Host**: smtp.gmail.com
- **Port**: 587
- **Secure**: false (STARTTLS)
- **Username**: habittracker03@gmail.com
- **From Email**: habittracker03@gmail.com
- **From Name**: Habit Tracker

### Cron Configuration
- **Service**: cron-job.org
- **Endpoint**: `https://your-app.onrender.com/api/cron/custom-reminders`
- **Frequency**: Every minute
- **Secret**: Protected by CRON_SECRET_KEY

### User Configuration
- **Email**: tarunraaj2003@gmail.com
- **Timezone**: Asia/Kolkata (UTC+05:30)
- **Notifications**: Enabled

---

## 🐛 Debugging Commands

If you need to debug further, use these scripts:

```bash
# Check SMTP settings in database
node scripts/check-smtp-settings.js

# Check habit reminder configuration
node scripts/check-habit-reminders.js

# Test email connection with IPv4 fix
node scripts/test-email-connection.js

# Check server timezone
node scripts/check-server-time.js
```

---

## 📝 Technical Details

### Why IPv4 Fix Should Work

1. **DNS Family 4**: Forces Node.js to only resolve IPv4 addresses
2. **Explicit Host**: Bypasses service shortcuts that might ignore options
3. **Render Network**: Even though Render doesn't support IPv6 outbound, it should support IPv4
4. **Gmail SMTP**: Gmail's SMTP servers support both IPv4 and IPv6

### Network Flow
```
Render Server (IPv4 only)
    ↓
DNS Resolution (forced IPv4)
    ↓
smtp.gmail.com (IPv4: 142.250.xxx.xxx)
    ↓
Port 587 (STARTTLS)
    ↓
Gmail SMTP Server
```

---

## 🔗 Related Documentation

- [TIMEZONE_IMPLEMENTATION.md](./TIMEZONE_IMPLEMENTATION.md) - Timezone feature details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General debugging guide
- [FIXES_APPLIED.md](./FIXES_APPLIED.md) - Previous fix attempts
- [COMPLETE_CHANGES_SUMMARY.md](./COMPLETE_CHANGES_SUMMARY.md) - Full change history

---

## ⏰ Timeline

1. **Initial Issue**: IPv6 connection error on Render
2. **First Attempt**: Added `dnsOptions: { family: 4 }` with `service: 'gmail'`
3. **Second Attempt**: Removed `service: 'gmail'`, used explicit `host: 'smtp.gmail.com'`
4. **Current Status**: Waiting for Render deployment to verify fix

---

## 📞 Support

If issues persist after this deployment:
1. Check Render logs for actual error messages
2. Verify DNS resolution is using IPv4
3. Consider alternative SMTP providers
4. Test on local environment to isolate Render-specific issues

---

**Last Updated**: May 19, 2026  
**Author**: Kiro AI Assistant  
**Commit**: 3ed1405
