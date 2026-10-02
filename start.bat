@echo off
echo ==============================================
echo       Starting AI Translator Website...
echo ==============================================
echo.
echo Opening in default browser at http://localhost:5001...
start "" http://localhost:5001
echo.
echo Server running on http://localhost:5001. Press Ctrl+C to stop.
node server.js
pause
