@echo off
cd /d %~dp0\..
git add -A
git commit -m "chore(config): add central config module, .env.example and .gitignore"
exit /b %ERRORLEVEL%