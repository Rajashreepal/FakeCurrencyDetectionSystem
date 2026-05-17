@echo off
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
echo Starting NoteShield AI frontend on http://localhost:5173
call npm run dev
