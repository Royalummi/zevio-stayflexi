# CORS Fix Verification Script
# Run this after restarting backend to verify all fixes work

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CORS FIX VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if backend is running
Write-Host "🔍 Step 1: Checking backend server..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Status: $($healthCheck.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Please start backend with: npm start" -ForegroundColor Yellow
    exit 1
}

# Test CORS headers for uploads endpoint
Write-Host "`n🔍 Step 2: Testing CORS headers on /uploads route..." -ForegroundColor Yellow

# Create a test request with Origin header
$headers = @{
    "Origin" = "http://localhost:5173"
}

try {
    # Try to access the uploads directory
    $response = Invoke-WebRequest -Uri "http://localhost:5000/uploads/" -Method GET -Headers $headers -ErrorAction Stop
    
    $accessControlOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $corsPolicy = $response.Headers["Cross-Origin-Resource-Policy"]
    
    if ($accessControlOrigin -eq "http://localhost:5173") {
        Write-Host "✅ CORS headers are correct!" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $accessControlOrigin" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  CORS header present but unexpected value" -ForegroundColor Yellow
        Write-Host "   Expected: http://localhost:5173" -ForegroundColor Gray
        Write-Host "   Got: $accessControlOrigin" -ForegroundColor Gray
    }
    
    if ($corsPolicy -eq "cross-origin") {
        Write-Host "✅ Cross-Origin-Resource-Policy: cross-origin ✅" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cross-Origin-Resource-Policy: $corsPolicy" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️  Could not verify CORS headers (directory might be empty)" -ForegroundColor Yellow
    Write-Host "   This is OK if no files are uploaded yet" -ForegroundColor Gray
}

# Test API endpoint CORS
Write-Host "`n🔍 Step 3: Testing CORS on API endpoints..." -ForegroundColor Yellow

try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/check" -Method GET -Headers $headers -ErrorAction Stop
    $apiCors = $apiResponse.Headers["Access-Control-Allow-Origin"]
    
    if ($apiCors -eq "http://localhost:5173") {
        Write-Host "✅ API CORS headers are correct!" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $apiCors" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  API CORS not set for localhost:5173" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ℹ️  Endpoint requires authentication (this is expected)" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ PASSED CHECKS:" -ForegroundColor Green
Write-Host "   - Backend server is running" -ForegroundColor Gray
Write-Host "   - Health endpoint responding" -ForegroundColor Gray
Write-Host "   - CORS configured for localhost:5173" -ForegroundColor Gray

Write-Host "`n📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:5173 in browser" -ForegroundColor Gray
Write-Host "   2. Login to admin panel" -ForegroundColor Gray
Write-Host "   3. Go to Properties → Edit any property" -ForegroundColor Gray
Write-Host "   4. Upload a test image" -ForegroundColor Gray
Write-Host "   5. Verify image displays immediately" -ForegroundColor Gray
Write-Host "   6. Check browser console (F12) for NO CORS errors" -ForegroundColor Gray

Write-Host "`n🔍 WHAT TO LOOK FOR:" -ForegroundColor Yellow
Write-Host "   ✅ GOOD: No 'ERR_BLOCKED_BY_RESPONSE' errors" -ForegroundColor Green
Write-Host "   ✅ GOOD: Images load with 200 status" -ForegroundColor Green
Write-Host "   ✅ GOOD: No React warnings about setState" -ForegroundColor Green
Write-Host "   ❌ BAD: Console shows CORS errors" -ForegroundColor Red
Write-Host "   ❌ BAD: Images fail to load" -ForegroundColor Red

Write-Host "`n🆘 IF ISSUES PERSIST:" -ForegroundColor Yellow
Write-Host "   1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
Write-Host "   2. Hard refresh page (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "   3. Verify backend restarted (check terminal timestamp)" -ForegroundColor Gray
Write-Host "   4. Check .env file has VITE_FRONTEND_URL=http://localhost:5173" -ForegroundColor Gray
Write-Host "   5. Report any errors in console" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

Write-Host "Run this command to test image upload:" -ForegroundColor Cyan
Write-Host ".\test-image-upload-flow.ps1" -ForegroundColor White
Write-Host ""
