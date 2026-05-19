# SendGrid Setup Guide - Fix for Render SMTP Port Blocking

## 🎯 Why SendGrid?

**Render's free tier blocks ALL SMTP ports:**
- ❌ Port 587 (STARTTLS) - BLOCKED
- ❌ Port 465 (SSL/TLS) - BLOCKED  
- ❌ Port 25 (Plain SMTP) - BLOCKED

**SendGrid uses HTTP API instead of SMTP ports:**
- ✅ Works on Render free tier
- ✅ No port restrictions
- ✅ Better deliverability
- ✅ Free tier: 100 emails/day (sufficient for your needs)
- ✅ More reliable than Gmail SMTP

---

## 📋 Setup Steps

### Step 1: Create SendGrid Account

1. Go to: https://signup.sendgrid.com/
2. Sign up with your email (use tarunraaj2003@gmail.com or any email)
3. Verify your email address
4. Complete the onboarding questions:
   - **Role**: Developer
   - **Company**: Personal Project
   - **Use Case**: Transactional Emails

### Step 2: Create API Key

1. After login, go to: **Settings** → **API Keys**
   - Direct link: https://app.sendgrid.com/settings/api_keys

2. Click **"Create API Key"**

3. Configure:
   - **Name**: `Habit Tracker Production`
   - **Permissions**: Select **"Full Access"** (or "Mail Send" only)

4. Click **"Create & View"**

5. **IMPORTANT**: Copy the API key immediately!
   - It looks like: `SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
   - You can only see it once!
   - Save it securely

### Step 3: Verify Sender Identity

SendGrid requires sender verification to prevent spam.

**Option A: Single Sender Verification (Easiest)**

1. Go to: **Settings** → **Sender Authentication** → **Single Sender Verification**
   - Direct link: https://app.sendgrid.com/settings/sender_auth/senders

2. Click **"Create New Sender"**

3. Fill in details:
   ```
   From Name: Habit Tracker
   From Email: habittracker03@gmail.com (or your email)
   Reply To: habittracker03@gmail.com
   Company Address: Your address
   City: Your city
   State: Your state
   Zip: Your zip
   Country: India
   ```

4. Click **"Create"**

5. **Check your email** (habittracker03@gmail.com)
   - You'll receive a verification email from SendGrid
   - Click the verification link

6. Once verified, you can send emails from that address!

**Option B: Domain Authentication (Advanced - Better for Production)**

If you own a domain (e.g., habittracker.com):
1. Go to: **Settings** → **Sender Authentication** → **Domain Authentication**
2. Follow the DNS setup instructions
3. This gives better deliverability but requires domain ownership

### Step 4: Add API Key to Render

1. Go to your Render dashboard: https://dashboard.render.com

2. Select your **habit-tracker-backend** service

3. Go to **Environment** tab

4. Add new environment variable:
   ```
   Key: SENDGRID_API_KEY
   Value: SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

5. Click **"Save Changes"**

6. Render will automatically redeploy with the new environment variable

### Step 5: Update From Email (Optional)

If you verified a different email than habittracker03@gmail.com:

1. Update your SMTP settings in the database to use the verified email
2. Or update the `EMAIL_USER` environment variable in Render

---

## 🧪 Testing

### Test 1: Check Environment Variable

After Render redeploys, check if the API key is set:

```bash
# In Render logs, you should see:
📧 Sending email via SendGrid to tarunraaj2003@gmail.com
✅ Email sent successfully via SendGrid: 202
```

### Test 2: Send Test Email

Set a habit reminder for the next minute and watch the logs.

**Expected Success:**
```
⏰ [CRON] Processing custom reminders...
⏰ [CRON] Checking habit: "Drink water" (Reminder: 13:00, Timezone: Asia/Kolkata)
⏰ [CRON] Time check (Asia/Kolkata): Current 13:00 vs Reminder 13:00 = true
📧 Sending email via SendGrid to tarunraaj2003@gmail.com
✅ Email sent successfully via SendGrid: 202
✅ Reminder sent to tarunraaj2003@gmail.com for habit: Drink water
⏰ [CRON] Custom reminders completed. Emails sent: 1, Errors: 0
```

### Test 3: Check Email Delivery

- Email should arrive within 10-30 seconds
- Check inbox and spam folder
- SendGrid emails have excellent deliverability

---

## 🔍 Troubleshooting

### Error: "The from email does not match a verified Sender Identity"

**Solution:**
1. Go to SendGrid → Settings → Sender Authentication
2. Verify the email address you're using as "from"
3. Check your email for verification link
4. Update `fromEmail` in database to match verified email

### Error: "Forbidden"

**Solution:**
1. Check API key is correct in Render environment variables
2. Ensure API key has "Mail Send" permission
3. Regenerate API key if needed

### Error: "Unauthorized"

**Solution:**
1. API key is invalid or expired
2. Create new API key in SendGrid
3. Update `SENDGRID_API_KEY` in Render

### Emails Going to Spam

**Solutions:**
1. Complete domain authentication (not just single sender)
2. Add SPF and DKIM records to your domain
3. Warm up your sending (start with few emails, gradually increase)
4. Ensure email content isn't spammy

### Still Not Working?

**Fallback to SMTP (if you have different hosting):**
- The code automatically falls back to SMTP if `SENDGRID_API_KEY` is not set
- But this won't work on Render free tier

**Alternative Services:**
- **Mailgun**: 5,000 emails/month free
- **AWS SES**: $0.10 per 1,000 emails
- **Postmark**: 100 emails/month free

---

## 📊 SendGrid Free Tier Limits

- **100 emails per day** (3,000/month)
- Perfect for your use case (few users, daily reminders)
- If you need more, upgrade to paid plan ($19.95/month for 50,000 emails)

### Calculating Your Usage

If you have:
- 10 users
- Each with 3 habits
- Each habit sends 1 reminder per day

**Daily emails**: 10 × 3 × 1 = 30 emails/day ✅ Well within limit!

---

## 🎓 How It Works

### Before (SMTP - Blocked on Render)
```
Backend → Port 587/465 → Gmail SMTP → ❌ BLOCKED
```

### After (SendGrid - Works on Render)
```
Backend → HTTPS API → SendGrid → ✅ Email Delivered
```

SendGrid uses standard HTTPS (port 443) which is never blocked!

---

## 📝 Code Changes Made

### 1. Installed SendGrid Package
```bash
npm install @sendgrid/mail
```

### 2. Updated emailService.js

**Auto-detection logic:**
```javascript
if (process.env.SENDGRID_API_KEY) {
  // Use SendGrid (preferred for Render)
  sendEmailViaSendGrid();
} else {
  // Fallback to SMTP
  sendEmailViaSMTP();
}
```

**Benefits:**
- ✅ Works on Render free tier
- ✅ No code changes needed for local development
- ✅ Automatic fallback to SMTP if SendGrid not configured
- ✅ Same email templates work for both methods

---

## 🔐 Security Notes

### Protecting Your API Key

1. **Never commit API key to Git**
   - Always use environment variables
   - Add to `.env` for local development
   - Add to Render environment for production

2. **Rotate API keys regularly**
   - Create new key every 3-6 months
   - Delete old keys after rotation

3. **Use minimal permissions**
   - Only grant "Mail Send" permission
   - Don't use "Full Access" unless needed

### API Key Storage

**Local Development (.env):**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

**Production (Render):**
- Store in Render environment variables
- Never in code or Git

---

## 📈 Monitoring

### SendGrid Dashboard

Monitor your email activity:
1. Go to: https://app.sendgrid.com/
2. Check **Activity** tab
3. See delivery rates, bounces, spam reports

### Render Logs

Watch for:
```
✅ Email sent successfully via SendGrid: 202
```

Status codes:
- **202**: Accepted (email queued for delivery)
- **400**: Bad request (check email format)
- **401**: Unauthorized (check API key)
- **403**: Forbidden (check sender verification)

---

## 🚀 Next Steps

1. **Create SendGrid account** (5 minutes)
2. **Get API key** (1 minute)
3. **Verify sender email** (2 minutes)
4. **Add to Render environment** (1 minute)
5. **Wait for redeploy** (2-3 minutes)
6. **Test email reminder** (1 minute)

**Total time: ~15 minutes** ⏱️

---

## 📞 Support

### SendGrid Support
- Docs: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/

### If You Need Help
- Check Render logs for error messages
- Verify sender email is verified in SendGrid
- Ensure API key has correct permissions
- Check SendGrid activity dashboard for delivery status

---

**This is the final solution for Render's SMTP port blocking issue!** 🎉

Once SendGrid is configured, your email reminders will work reliably without any port restrictions.
