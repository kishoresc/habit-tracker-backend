# Email Reminder Fixes Applied

## Problem Identified
The error `connect ENETUNREACH 2404:6800:4003:c04::6c:587 - Local (:::0)` indicates that nodemailer was trying to connect to Gmail's SMTP server using IPv6, but your server doesn't have IPv6 connectivity.

## Solution Applied
Added `dnsOptions: { family: 4 }` to all nodemailer transporter configurations to force IPv4 connections.

### Files Modified:

1. **`utils/emailService.js`**
   - Added IPv4 forcing to database SMTP settings transporter
   - Added IPv4 forcing to Gmail service transporter
   - Added IPv4 forcing to default SMTP transporter

2. **`controllers/smtpController.js`**
   - Added IPv4 forcing to test connection transporter

## How It Works

### Current Setup (External Cron Service)
Your application uses **cron-job.org** (external cron service) to trigger email reminders:

1. **Custom Reminders** (Every minute)
   - Endpoint: `POST /api/cron/custom-reminders`
   - Checks all active habits with email reminders enabled
   - Sends email if current time matches the habit's `emailReminderTime`
   - Also keeps Render free tier server warm

2. **End of Day Warnings** (9:00 PM daily)
   - Endpoint: `POST /api/cron/end-of-day-warnings`
   - Sends warning emails for incomplete habits
   - Runs at 21:00 (9 PM) every day

### Your Habit Data
```json
{
  "name": "Drink water",
  "emailReminderTime": "09:31",
  "emailReminderEnabled": true,
  "isActive": true
}
```

## What You Need to Do

### 1. Restart Your Backend Server
The code changes won't take effect until you restart the server.

**Local Development:**
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd "e:\Myself Projects\habit-tracker\Backend"
node server.js
```

**Render Deployment:**
- Push the changes to your Git repository
- Render will automatically redeploy
- Or manually trigger a redeploy from Render dashboard

### 2. Verify Cron-Job.org Configuration
Make sure your cron-job.org is configured correctly:

**Custom Reminders Job:**
- URL: `https://your-backend-url.onrender.com/api/cron/custom-reminders`
- Method: POST
- Schedule: Every 1 minute (`* * * * *`)
- Headers: `x-cron-secret: YOUR_CRON_SECRET_KEY`

**End of Day Warnings Job:**
- URL: `https://your-backend-url.onrender.com/api/cron/end-of-day-warnings`
- Method: POST
- Schedule: Daily at 21:00 (9 PM)
- Headers: `x-cron-secret: YOUR_CRON_SECRET_KEY`

### 3. Test the Fix

**Option A: Wait for scheduled time**
- Set a reminder for 2-3 minutes from now
- Wait and check your email

**Option B: Test manually (if server is running locally)**
```bash
# Test the custom reminders endpoint
curl -X POST http://localhost:5000/api/cron/custom-reminders ^
  -H "x-cron-secret: YOUR_CRON_SECRET_KEY" ^
  -H "Content-Type: application/json"
```

### 4. Check Logs
After the scheduled time, check your server logs for:
- ✅ Success: `✅ Reminder sent to user@email.com for habit: Drink water`
- ❌ Error: Any error messages with details

## Environment Variables Required
Make sure these are set in your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# OR use SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Cron Security
CRON_SECRET_KEY=your-secret-key

# Frontend URL (for email links)
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## Why This Fix Works
- **IPv6 Issue**: Some hosting providers (like Render) don't support IPv6 outbound connections
- **IPv4 Forcing**: By setting `dnsOptions: { family: 4 }`, we force nodemailer to use IPv4 addresses only
- **Gmail SMTP**: Gmail's SMTP server supports both IPv4 and IPv6, but we now explicitly use IPv4

## Troubleshooting

### If emails still don't send:

1. **Check Gmail App Password**
   - Make sure you're using an App Password, not your regular Gmail password
   - Generate one at: https://myaccount.google.com/apppasswords

2. **Check SMTP Settings in Database**
   - If you configured SMTP settings via the admin panel, verify they're correct
   - Test connection using: `POST /api/smtp/test`

3. **Check Server Logs**
   - Look for "Using SMTP settings from database" or "Using SMTP settings from environment variables"
   - Check for any authentication errors

4. **Verify Cron Job is Running**
   - Check cron-job.org execution history
   - Verify the endpoint returns success: `{"success": true, "emailsSent": 1}`

5. **Check Time Zone**
   - Your server might be in a different timezone
   - The cron checks server time, not your local time
   - Add logging to see what time the server thinks it is

## Next Steps
1. ✅ Code fixed (IPv4 forcing added)
2. ⏳ Restart backend server (local or Render)
3. ⏳ Test with a reminder set for 2-3 minutes from now
4. ⏳ Verify email is received
5. ⏳ Check cron-job.org execution logs

## Support
If issues persist after these fixes:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test SMTP connection using the test endpoint
4. Ensure cron-job.org can reach your server (check firewall/security settings)
