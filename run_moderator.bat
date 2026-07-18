@echo off
echo ========================================================
echo "OWNX AI Content Moderation & Express Server Startup Script"
echo ========================================================

set VENV_PIP="d:\social_media\ownx\recommendation_engine\.venv\Scripts\pip.exe"
set VENV_PYTHON="d:\social_media\ownx\recommendation_engine\.venv\Scripts\python.exe"
set NODE_PATH="C:\Program Files\nodejs\node.exe"

if not exist "d:\social_media\ownx\content_moderator\moderator_model.pth" (
    echo 1. Training the PyTorch CNN Content Moderation Model...
    %VENV_PYTHON% "d:\social_media\ownx\content_moderator\train.py"
) else (
    echo 1. Model weights already exist. Skipping training.
)

echo 2. Starting Express Server on Port 5000...
start /B "" %NODE_PATH% d:\social_media\ownx\server.js

echo 3. Starting the Content Moderation API on Port 5001...
%VENV_PYTHON% "d:\social_media\ownx\content_moderator\main.py"
