HABIT TRACKER BACKEND - QUICK START
====================================

SETUP (5 MINUTES):
------------------
1. npm install
2. npm run generate:secret
3. Copy the key and paste in .env as CRON_SECRET_KEY
4. npm run dev
5. npm run test:cron (in another terminal)

DEPLOY TO RENDER FREE TIER:
----------------------------
See: scripts/SETUP_INSTRUCTIONS.txt

KEY FEATURES:
-------------
✓ External cron keeps Render free tier warm (no cold starts)
✓ Reminders sent even when server would normally sleep
✓ Custom time reminders (user-defined)
✓ End of day warnings (9 PM daily)
✓ Secure with secret key authentication

COMMANDS:
---------
npm run dev              - Start development server
npm run start            - Start production server
npm run test:cron        - Test cron endpoints
npm run generate:secret  - Generate CRON_SECRET_KEY

API ENDPOINTS:
--------------
GET  /api/cron/health                  - Health check (public)
POST /api/cron/custom-reminders        - Process reminders (protected)
POST /api/cron/end-of-day-warnings     - Process warnings (protected)

EXTERNAL CRON SETUP:
--------------------
Service: cron-job.org (free)
Job 1: Call /api/cron/custom-reminders every 1 minute
Job 2: Call /api/cron/end-of-day-warnings daily at 21:00
Header: x-cron-secret: your-secret-key

Full instructions: scripts/SETUP_INSTRUCTIONS.txt
