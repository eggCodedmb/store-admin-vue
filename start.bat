@echo off
echo ==============================
echo   store-admin-vue dev server
echo ==============================
echo.

if not exist node_modules (
    echo [INFO] node_modules not found, installing...
    npm install
    echo.
)

echo [INFO] Starting dev server...
echo [INFO] Press Ctrl+C to stop
echo.
npm run dev

pause
