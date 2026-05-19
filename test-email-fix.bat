@echo off
echo ========================================
echo Testing Email Reminder Fix
echo ========================================
echo.

REM Replace with your actual CRON_SECRET_KEY from .env
set CRON_SECRET=your-cron-secret-key-here

echo Testing custom reminders endpoint...
echo.

curl -X POST http://localhost:5000/api/cron/custom-reminders ^
  -H "x-cron-secret: %CRON_SECRET%" ^
  -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo Test completed!
echo ========================================
echo.
echo Check the output above for:
echo - "emailsSent": 1 (if it's time to send)
echo - "success": true
echo.
echo Also check your server console logs for:
echo - "Reminder sent to your-email@example.com"
echo.
pause
