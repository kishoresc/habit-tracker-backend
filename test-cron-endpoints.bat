@echo off
REM Test script for external cron endpoints (Windows)
REM Usage: test-cron-endpoints.bat [BASE_URL] [CRON_SECRET]

setlocal

REM Default values
set BASE_URL=http://localhost:5001
set CRON_SECRET=your-cron-secret-key

REM Override with command line arguments if provided
if not "%~1"=="" set BASE_URL=%~1
if not "%~2"=="" set CRON_SECRET=%~2

echo.
echo ============================================================
echo   Testing External Cron Endpoints
echo ============================================================
echo.
echo Server URL: %BASE_URL%
echo.

REM Test 1: Health Check
echo [1/5] Testing Health Check (Public)...
curl -s "%BASE_URL%/api/cron/health"
echo.
echo.

REM Test 2: Custom Reminders (with auth)
echo [2/5] Testing Custom Reminders (Protected)...
curl -s -X POST "%BASE_URL%/api/cron/custom-reminders" -H "x-cron-secret: %CRON_SECRET%"
echo.
echo.

REM Test 3: End of Day Warnings (with auth)
echo [3/5] Testing End of Day Warnings (Protected)...
curl -s -X POST "%BASE_URL%/api/cron/end-of-day-warnings" -H "x-cron-secret: %CRON_SECRET%"
echo.
echo.

REM Test 4: Unauthorized Access (should fail)
echo [4/5] Testing Unauthorized Access (Should return 401)...
curl -s -X POST "%BASE_URL%/api/cron/custom-reminders"
echo.
echo.

REM Test 5: Invalid Secret (should fail)
echo [5/5] Testing Invalid Secret (Should return 403)...
curl -s -X POST "%BASE_URL%/api/cron/custom-reminders" -H "x-cron-secret: invalid-secret"
echo.
echo.

echo ============================================================
echo   Tests Complete
echo ============================================================
echo.
echo If you see JSON responses above, the endpoints are working!
echo.
echo RENDER FREE TIER SETUP (Option A - Keep Server Warm):
echo 1. Generate secret: npm run generate:secret
echo 2. Update .env with the generated key
echo 3. Deploy to Render
echo 4. Setup cron-job.org to call every 1 minute
echo 5. Server stays warm 24/7 (no cold starts!)
echo.
echo Full instructions: scripts\SETUP_INSTRUCTIONS.txt
echo.

endlocal
pause
