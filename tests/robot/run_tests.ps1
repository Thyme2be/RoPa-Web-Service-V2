# run_tests.ps1 - Robot Framework Test Runner for Local Environment

# 1. Check if backend is running on port 8000
$portCheck = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($null -eq $portCheck) {
    Write-Host "⚠️ Backend is NOT running on port 8000." -ForegroundColor Yellow
    Write-Host "🚀 Starting backend container via Docker Compose..." -ForegroundColor Gray
    
    docker-compose up -d backend
    Write-Host "⏳ Waiting for backend container to initialize (10s)..."
    Start-Sleep -Seconds 10
} else {
    Write-Host "✅ Backend (or something else) is already running on port 8000." -ForegroundColor Green
}

# 2. Reset Admin password to ensure authentication works (troubleshooting helper)
Write-Host "🔐 Resetting Admin password to 'Admin@1234'..."
python tests/robot/reset_admin.py

# 3. Run Robot Framework tests
Write-Host "🤖 Running Robot Framework tests..." -ForegroundColor Cyan
& robot tests/robot/api_user_crud.robot

# 4. Success summary
if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Tests Passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Tests Failed!" -ForegroundColor Red
}

Write-Host "📄 Opening report..."
Invoke-Item tests/robot/report.html
