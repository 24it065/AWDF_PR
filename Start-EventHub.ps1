# Start-EventHub.ps1
# Run this script from E:\24IT065_AWDF to start both servers
# Usage: .\Start-EventHub.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EventHub Startup - ITUE301 Set F      " -ForegroundColor Cyan
Write-Host "  Roll: 24IT065                         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start Backend
Write-Host "`n[1/2] Starting Backend (Express)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\24IT065_AWDF\backend'; Write-Host 'BACKEND STARTING...' -ForegroundColor Green; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend (Vite React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\24IT065_AWDF\frontend'; Write-Host 'FRONTEND STARTING...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Both servers launching!               " -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:5000     " -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nDemo Logins:" -ForegroundColor Cyan
Write-Host "  alice@demo.com / Alice@123 (attendee)" -ForegroundColor White
Write-Host "  bob@demo.com   / Bob@1234  (organizer)" -ForegroundColor White
Write-Host "  admin@demo.com / Admin@123 (admin)`n" -ForegroundColor White
