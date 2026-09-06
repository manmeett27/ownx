@echo off
echo ========================================================
echo OWNX Ecosystem Master Startup Script
echo ========================================================

echo Starting Node.js Backend Server (Port 5000)...
start "OWNX Backend [Port 5000]" cmd /k "run_backend.bat"

echo Starting Content Moderation AI Service (Port 5001)...
start "OWNX Moderation AI [Port 5001]" cmd /k "run_moderator.bat"

echo Starting Feed Recommendation Service (Port 5002)...
start "OWNX Feed System [Port 5002]" cmd /k "run_feed.bat"

echo Starting Recommendation Engine (Port 5003)...
start "OWNX Recommender Engine [Port 5003]" cmd /k "run_recommender.bat"

echo ========================================================
echo All OWNX microservices have been launched.
echo Backend API: http://127.0.0.1:5000
echo Content Moderation API: http://127.0.0.1:5001
echo Feed Recommendation API: http://127.0.0.1:5002
echo Recommendation Engine API: http://127.0.0.1:5003
echo ========================================================
