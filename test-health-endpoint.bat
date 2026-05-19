@echo off
echo Testing Health Endpoint...
echo.
curl -X GET https://habit-tracker-backend-r3pd.onrender.com/api/cron/health
echo.
echo.
pause
