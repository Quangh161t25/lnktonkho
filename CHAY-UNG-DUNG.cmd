@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    start "VG ERP Local Server" /min py -m http.server 8080
) else (
    where python >nul 2>nul
    if not %errorlevel%==0 (
        echo Khong tim thay Python de chay web server.
        echo Vui long cai Python hoac chay ung dung tren web server.
        pause
        exit /b 1
    )
    start "VG ERP Local Server" /min python -m http.server 8080
)

timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/index.html"
endlocal
