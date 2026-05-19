# Email Reminder Troubleshooting Guide

## Current Status ✅

### What's Working:
1. ✅ SMTP settings configured in database
   - Host: smtp.gmail.com
   - Port: 587
   - Username: habittracker03@gmail.com
   - Connection test: SUCCESSFUL

2. ✅ Habit configured correctly
   - Name: Drink water
   - User: tarunraaj2003@gmail.com
   - Reminder Time: 09:52 (or whatever you set)
   - Email Reminder: Enabled
   - Active: Yes

3. ✅ IPv4 fix applied and pushed to GitHub
   - Commit: "Fix: Force IPv4 for email SMTP connections"
   - Files modified: emailService.js, smtpController.js

### What Needs to Be Done:

## Step 1: Verify Render Deployment

**Go to your Render dashboard:**
1. Open https://dashboard.render.com
2. Find your habit-tracker-backend service
3. Check if it shows the latest deployment
4. Look for the commit message: "Fix: Force IPv4 for email SMTP connections"

**If not deployed yet:**
- Wait for automatic deployment (2-5 minutes)
- OR manually trigger redeploy from Render dashboard

**Check deployment logs:**
- Look for "Build successful" and "Deploy live"
- Note the deployment URL (e.g., https://your-app.onrender.com)

## Step 2: Verify Cron-Job.org Configuration

**Login to cron-job.org:**
1. Go to https://cron-job.org
2. Check your cronjobs

**Custom Reminders Job (MOST IMPORTANT):**
```
Title: Habit Tracker - Keep Alive & Reminders
URL: https://your-backend-url.onrender.com/api/cron/custom-reminders
Method: POST
Schedule: Every 1 minute (*/1 * * * *)
Headers:
  x-cron-secret: 809280bde3dea9d330ecf82190a735b9
  Content-Type: application/json
Status: Enabled ✅
```

**End of Day Warnings Job:**
```
Title: Habit Tracker - End of Day Warnings
URL: https://your-backend-url.onrender.com/api/cron/end-of-day-warnings
Method: POST
Schedule: Daily at 21:00 (0 21 * * *)
Headers:
  x-cron-secret: 809280bde3dea9d330ecf82190a735b9
  Content-Type: application/json
Status: Enabled ✅
```

## Step 3: Test the Cron Endpoint

**Option A: Use cron-job.org "Execute now" button**
1. Go to your cronjob in cron-job.org
2. Click "Execute now" button
3. Check execution history for response

**Option B: Use curl/Postman**
```bash
curl -X POST https://your-backend-url.onrender.com/api/cron/custom-reminders \
  -H "x-cron-secret: 809280bde3dea9d330ecf82190a735b9" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Custom reminders processed",
  "emailsSent": 1,
  "errors": 0,
  "habitsChecked": 1,
  "processingTime": "1234ms",
  "serverStatus": "warm",
  "timestamp": "2026-05-19T04:22:00.000Z"
}
```

## Step 4: Check Render Logs

**View real-time logs:**
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for these messages:

**Success messages:**
```
✅ Reminder sent to tarunraaj2003@gmail.com for habit: Drink water
```

**Error messages (if any):**
```
❌ Failed to send reminder for habit Drink water: [error details]
```

## Step 5: Verify Email Delivery

**Check your email:**
- Email: tarunraaj2003@gmail.com
- Subject: "⏰ Habit Reminder - Don't Break Your Streak!"
- From: habittracker03@gmail.com

**If not in inbox:**
- Check Spam/Junk folder
- Check Gmail filters
- Verify email address is correct in user profile

## Common Issues & Solutions

### Issue 1: "No console in backend"
**Solution:** You need to check Render logs, not local console
- Render Dashboard → Your Service → Logs tab

### Issue 2: Emails not sending even though cron runs
**Possible causes:**
1. **Render not redeployed with IPv4 fix**
   - Solution: Wait for deployment or manually trigger

2. **Cron job not configured correctly**
   - Solution: Verify URL, headers, and schedule in cron-job.org

3. **Server sleeping (Render free tier)**
   - Solution: Cron job every 1 minute keeps it awake

4. **Wrong timezone**
   - Solution: Server uses UTC or IST, check server time in logs

### Issue 3: Cron-job.org shows errors
**Check response code:**
- 200: Success ✅
- 401: Wrong CRON_SECRET_KEY
- 404: Wrong URL or endpoint not found
- 500: Server error (check Render logs)

### Issue 4: SMTP connection fails
**Solutions:**
1. Verify Gmail App Password (not regular password)
2. Check if 2FA is enabled on Gmail account
3. Verify SMTP settings in master admin panel
4. Run: `node scripts/check-smtp-settings.js`

## Diagnostic Scripts

**Check SMTP settings:**
```bash
cd "e:\Myself Projects\habit-tracker\Backend"
node scripts/check-smtp-settings.js
```

**Check which habits should get reminders:**
```bash
node scripts/check-habit-reminders.js
```

**Check server time:**
```bash
node scripts/check-server-time.js
```

**Test email connection:**
```bash
node scripts/test-email-connection.js
```

## Timeline for Testing

1. **Set reminder time** to 2-3 minutes from now
2. **Wait for Render deployment** to complete (check dashboard)
3. **Wait for cron-job.org** to execute (runs every minute)
4. **Check Render logs** for success/error messages
5. **Check email inbox** (including spam folder)

## Expected Flow

```
1. Cron-job.org triggers every minute
   ↓
2. Calls: POST /api/cron/custom-reminders
   ↓
3. Backend checks all habits with reminders
   ↓
4. Finds "Drink water" at 09:52
   ↓
5. Checks if completed today (No)
   ↓
6. Checks if time matches (Yes)
   ↓
7. Gets SMTP settings from database
   ↓
8. Creates transporter with IPv4 fix
   ↓
9. Sends email to tarunraaj2003@gmail.com
   ↓
10. Logs: "✅ Reminder sent to tarunraaj2003@gmail.com"
   ↓
11. Returns success response to cron-job.org
```

## Next Steps

1. ✅ Code fixed (IPv4 forcing added)
2. ✅ Changes pushed to GitHub
3. ⏳ **Wait for Render to redeploy** (CHECK THIS!)
4. ⏳ Verify cron-job.org is configured correctly
5. ⏳ Set reminder for 2-3 minutes from now
6. ⏳ Check Render logs when cron runs
7. ⏳ Check email inbox

## Support Checklist

If emails still don't send after following all steps:

- [ ] Render shows latest deployment with IPv4 fix
- [ ] Cron-job.org is enabled and running every minute
- [ ] Cron-job.org execution history shows 200 OK responses
- [ ] Render logs show "✅ Reminder sent to..." messages
- [ ] SMTP settings test passes (run check-smtp-settings.js)
- [ ] Habit reminder time matches current server time
- [ ] User email address is correct
- [ ] Gmail account allows app password access
- [ ] No firewall blocking outbound SMTP connections

## Contact Information

If all checks pass but emails still don't send:
1. Share Render logs from the time cron ran
2. Share cron-job.org execution history screenshot
3. Share output of diagnostic scripts
4. Verify the exact time you set the reminder vs server time
