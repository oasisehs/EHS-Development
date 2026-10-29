@echo off
REM ====================================
REM EHS Suite - Playwright Test Runner
REM Windows Batch Script
REM ====================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     EHS Suite - Playwright E2E Testing                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo    Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version

echo.
echo ====== STEP 1: Install Dependencies ======
echo.

REM Check if Playwright is installed
if not exist "node_modules\@playwright" (
    echo 📦 Installing Playwright...
    npm install -D @playwright/test
    if errorlevel 1 (
        echo ❌ Failed to install Playwright
        pause
        exit /b 1
    )
    echo ✓ Playwright installed
) else (
    echo ✓ Playwright already installed
)

echo.
echo ====== STEP 2: Seed Demo User ======
echo.

if exist "backend\seed.js" (
    echo 🌱 Creating demo user in database...
    echo    Email: demo@ehssuite.com
    echo    Password: Demo@123456
    echo.
    
    cd backend
    node seed.js
    cd ..
    
    if errorlevel 1 (
        echo ⚠️  Could not seed demo user
        echo    Make sure PostgreSQL database is accessible
    ) else (
        echo ✓ Demo user seeded successfully
    )
) else (
    echo ⚠️  seed.js not found in backend directory
)

echo.
echo ====== STEP 3: Running Playwright Tests ======
echo.

echo.
echo Choose test mode:
echo   1. Run all tests (headless)
echo   2. Run all tests (headed - visible browser)
echo   3. Run specific test file (auth.spec.js)
echo   4. Run with debug mode
echo   5. Generate code (codegen)
echo   6. Show last report
echo   7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" (
    echo.
    echo Running tests in headless mode...
    npx playwright test
) else if "%choice%"=="2" (
    echo.
    echo Running tests with visible browser...
    npx playwright test --headed
) else if "%choice%"=="3" (
    echo.
    echo Running auth.spec.js tests...
    npx playwright test frontend\auth.spec.js
) else if "%choice%"=="4" (
    echo.
    echo Running tests in debug mode...
    echo This will open Playwright Inspector for step-by-step execution.
    npx playwright test --debug
) else if "%choice%"=="5" (
    echo.
    echo Opening Playwright Codegen...
    echo This allows you to record UI interactions as tests.
    npx playwright codegen http://localhost:5000
) else if "%choice%"=="6" (
    echo.
    echo Opening last test report...
    npx playwright show-report
) else if "%choice%"=="7" (
    echo Exiting...
    exit /b 0
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo ====== Test Results ======
echo.
echo 📊 View detailed report:
echo    npx playwright show-report
echo.
echo 📹 View recorded traces:
echo    npx playwright show-trace
echo.

pause
