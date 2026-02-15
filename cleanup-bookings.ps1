# SESSION 47: Cleanup Bookings Script
# PowerShell script to clean up old bookings

Write-Host "`n🧹 SESSION 47: Cleaning up old bookings..." -ForegroundColor Cyan

# Run the cleanup SQL
$sqlFile = "backend\migrations\session47_cleanup_bookings.sql"
$result = mysql -u root zevio -e "source $sqlFile" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Error during cleanup: $result" -ForegroundColor Red
}

Write-Host "`n📊 Remaining bookings after cleanup:" -ForegroundColor Yellow
mysql -u root zevio -e "SELECT COUNT(*) as 'Confirmed Bookings' FROM bookings WHERE deleted_at IS NULL AND status = 'confirmed';"

Write-Host "`n✨ Database is now ready for testing new payment flow!" -ForegroundColor Green
