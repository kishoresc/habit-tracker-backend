# Backend Scripts

This folder contains utility scripts for managing the Habit Tracker backend.

---

## 📋 Available Scripts

### 1. **createMasterAdmin.js**
**Purpose:** Create the master admin account

**Usage:**
```bash
node scripts/createMasterAdmin.js
```

**What it does:**
- Creates a master admin user with role 'masterAdmin'
- Email: `kishoreravi0201@gmail.com`
- Password: `Welcome@123`
- Only creates if master admin doesn't exist

**When to use:**
- First time setup
- If master admin account is deleted

---

### 2. **sendTestEmail.js**
**Purpose:** Send a test email to verify SMTP configuration

**Usage:**
```bash
# Send to default email (habittracker03@gmail.com)
node scripts/sendTestEmail.js

# Send to specific email
node scripts/sendTestEmail.js your-email@example.com
```

**What it does:**
- Connects to database
- Uses SMTP settings from database
- Sends a test email
- Confirms if email was sent successfully

**When to use:**
- After configuring SMTP settings
- To verify email system is working
- To test email delivery

---

### 3. **checkData.js**
**Purpose:** Check database data (users, habits, etc.)

**Usage:**
```bash
node scripts/checkData.js
```

**What it does:**
- Displays all users in database
- Shows user details and statistics
- Useful for debugging

**When to use:**
- To verify data in database
- To check user accounts
- For debugging purposes

---

## 🚀 Quick Start

### First Time Setup:
```bash
# 1. Create master admin
node scripts/createMasterAdmin.js

# 2. Configure SMTP settings (via frontend)
# Login as master admin → SMTP Settings → Configure

# 3. Test email sending
node scripts/sendTestEmail.js your-email@example.com
```

---

## 📝 Notes

- All scripts require MongoDB connection
- Make sure `.env` file is configured
- Scripts connect to database automatically
- Use `Ctrl+C` to stop a running script

---

## ⚠️ Important

**Do not delete these scripts!**
- `createMasterAdmin.js` - Needed for setup
- `sendTestEmail.js` - Useful for testing
- `checkData.js` - Useful for debugging

---

## 🔧 Troubleshooting

### Script won't run?
- Check if MongoDB is connected
- Verify `.env` file exists
- Make sure dependencies are installed: `npm install`

### Email not sending?
- Run `sendTestEmail.js` to test
- Check SMTP settings in database
- Verify App Password is correct

---

**Last Updated:** 2024
