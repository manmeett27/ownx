@echo off
echo ========================================================
echo OWNX AI Content Moderation Service Startup Script
echo ========================================================

if not exist "content_moderator\moderator_model.pth" (
    echo 1. PyTorch model weights not found. Training PyTorch CNN Model...
    python content_moderator\train.py
) else (
    echo 1. PyTorch model weights found at content_moderator\moderator_model.pth.
)

echo 2. Starting Content Moderation FastAPI Service on Port 5001...
python content_moderator\main.py
