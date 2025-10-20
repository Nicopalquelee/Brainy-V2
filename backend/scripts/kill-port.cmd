@echo off
setlocal

if "%~1"=="" (
  echo Usage: kill-port ^<port^>
  echo Example: kill-port 3000
  exit /b 1
)

set PORT=%~1
set FOUND=

rem Parse netstat -ano -p tcp and extract PID (column 5). Avoid relying on localized state words.
for /f "tokens=1-5" %%A in ('netstat -ano -p tcp ^| findstr /R /C:":%PORT% "') do (
  set FOUND=1
  set PID=%%E
  call :KILLPID
)

if not defined FOUND (
  echo No TCP entry found on port %PORT%.
)

goto :EOF

:KILLPID
if "%PID%"=="" goto :EOF
echo Killing PID %PID% on port %PORT% ...
taskkill /F /PID %PID% >nul 2>&1
if errorlevel 1 (
  echo Failed to kill PID %PID%. Try running cmd as Administrator.
) else (
  echo Killed PID %PID%.
)
set PID=
goto :EOF

endlocal
