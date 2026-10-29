#!/usr/bin/env pwsh
# ====================================
# EHS Suite - Playwright Test Runner
# PowerShell Script (Cross-platform)
# ====================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     EHS Suite - Playwright E2E Testing                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeCheck = node --version 2>&1 | Select-Object -First 1
if (-not $nodeCheck) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Node.js found: $nodeCheck" -ForegroundColor Green
Write-Host ""

# Step 1: Install Dependencies
Write-Host "====== STEP 1: Install Dependencies ======" -ForegroundColor Yellow
Write-Host ""

$playwrightPath = "node_modules/@playwright"
if (-not (Test-Path $playwrightPath)) {
    Write-Host "📦 Installing Playwright..." -ForegroundColor Cyan
    npm install -D @playwright/test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Playwright" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Playwright installed" -ForegroundColor Green
} else {
    Write-Host "✓ Playwright already installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Seed Demo User
Write-Host "====== STEP 2: Seed Demo User ======" -ForegroundColor Yellow
Write-Host ""

$seedPath = "backend/seed.js"
if (Test-Path $seedPath) {
    Write-Host "🌱 Creating demo user in database..." -ForegroundColor Cyan
    Write-Host "   Email: demo@ehssuite.com" -ForegroundColor Gray
    Write-Host "   Password: Demo@123456" -ForegroundColor Gray
    Write-Host ""
    
    Push-Location backend
    node seed.js
    $seedResult = $LASTEXITCODE
    Pop-Location
    
    if ($seedResult -ne 0) {
        Write-Host "⚠️  Could not seed demo user - Database may not be accessible" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Demo user seeded successfully" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  seed.js not found in backend directory" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Test Options Menu
Write-Host "====== STEP 3: Running Playwright Tests ======" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose test mode:" -ForegroundColor Cyan
Write-Host "  1. Run all tests (headless)" -ForegroundColor White
Write-Host "  2. Run all tests (headed - visible browser)" -ForegroundColor White
Write-Host "  3. Run specific test file (auth.spec.js)" -ForegroundColor White
Write-Host "  4. Run with debug mode" -ForegroundColor White
Write-Host "  5. Generate code (codegen)" -ForegroundColor White
Write-Host "  6. Show last report" -ForegroundColor White
Write-Host "  7. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running tests in headless mode..." -ForegroundColor Cyan
        npx playwright test
    }
    "2" {
        Write-Host ""
        Write-Host "Running tests with visible browser..." -ForegroundColor Cyan
        npx playwright test --headed
    }
    "3" {
        Write-Host ""
        Write-Host "Running auth.spec.js tests..." -ForegroundColor Cyan
        npx playwright test frontend/auth.spec.js
    }
    "4" {
        Write-Host ""
        Write-Host "Running tests in debug mode..." -ForegroundColor Cyan
        Write-Host "This will open Playwright Inspector for step-by-step execution." -ForegroundColor Yellow
        npx playwright test --debug
    }
    "5" {
        Write-Host ""
        Write-Host "Opening Playwright Codegen..." -ForegroundColor Cyan
        Write-Host "This allows you to record UI interactions as tests." -ForegroundColor Yellow
        npx playwright codegen http://localhost:5000
    }
    "6" {
        Write-Host ""
        Write-Host "Opening last test report..." -ForegroundColor Cyan
        npx playwright show-report
    }
    "7" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "====== Test Results ======" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 View detailed report:" -ForegroundColor Cyan
Write-Host "   npx playwright show-report" -ForegroundColor Gray
Write-Host ""
Write-Host "📹 View recorded traces:" -ForegroundColor Cyan
Write-Host "   npx playwright show-trace" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Test file location:" -ForegroundColor Cyan
Write-Host "   c:\CODEBASE\EHS\frontend\auth.spec.js" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
