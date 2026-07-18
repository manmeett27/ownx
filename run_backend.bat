@echo off
echo ========================================================
echo OWNX Node.js Express Server Startup Script
echo ========================================================

set NODE_PATH="C:\Program Files\nodejs\node.exe"

echo 1. Starting Express Server on Port 5000...
%NODE_PATH% server.js
