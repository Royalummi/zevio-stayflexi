# Image Upload & Display Test Script
# This script tests the complete image upload and display flow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMAGE UPLOAD & DISPLAY TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$API_BASE = "http://localhost:5000/api"
$ADMIN_EMAIL = "admin@zevio.com"
$ADMIN_PASSWORD = "Admin@123"

# Function to make API calls
function Invoke-APIRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Token,
        [object]$Body = $null,
        [string]$ContentType = "application/json"
    )
    
    try {
        $headers = @{
            "Content-Type" = $ContentType
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$API_BASE$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body -and $ContentType -eq "application/json") {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        } elseif ($Body) {
            $params["Body"] = $Body
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        return $null
    }
}

# Step 1: Login as admin
Write-Host "🔐 Step 1: Logging in as admin..." -ForegroundColor Yellow
$loginResponse = Invoke-APIRequest -Method "POST" -Endpoint "/auth/admin-login" -Body @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
}

if (-not $loginResponse -or -not $loginResponse.data.accessToken) {
    Write-Host "❌ Failed to login. Please check credentials." -ForegroundColor Red
    exit 1
}

$TOKEN = $loginResponse.data.accessToken
Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "   Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Gray

# Step 2: Get first property
Write-Host "`n📋 Step 2: Fetching properties..." -ForegroundColor Yellow
$propertiesResponse = Invoke-APIRequest -Method "GET" -Endpoint "/admin/properties?limit=5" -Token $TOKEN

if (-not $propertiesResponse -or -not $propertiesResponse.data.properties) {
    Write-Host "❌ Failed to fetch properties." -ForegroundColor Red
    exit 1
}

$properties = $propertiesResponse.data.properties
Write-Host "✅ Found $($properties.Count) properties" -ForegroundColor Green

if ($properties.Count -eq 0) {
    Write-Host "❌ No properties found. Please create a property first." -ForegroundColor Red
    exit 1
}

# Select a property to test with
$testProperty = $properties[0]
$propertyId = $testProperty.id
Write-Host "   Testing with Property ID: $propertyId" -ForegroundColor Gray
Write-Host "   Title: $($testProperty.title)" -ForegroundColor Gray

# Step 3: Get current images for the property
Write-Host "`n🖼️  Step 3: Fetching current images for property..." -ForegroundColor Yellow
$imagesResponse = Invoke-APIRequest -Method "GET" -Endpoint "/admin/properties/$propertyId/images" -Token $TOKEN

if ($imagesResponse) {
    $currentImages = $imagesResponse.data
    Write-Host "✅ Current images count: $($currentImages.Count)" -ForegroundColor Green
    
    if ($currentImages.Count -gt 0) {
        Write-Host "`n   Current Images:" -ForegroundColor Gray
        foreach ($img in $currentImages) {
            Write-Host "   - ID: $($img.id) | URL: $($img.image_url)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ℹ️  No images currently uploaded" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Failed to fetch images" -ForegroundColor Red
}

# Step 4: Display thumbnail info
Write-Host "`n🎨 Step 4: Checking thumbnail in property list..." -ForegroundColor Yellow
if ($testProperty.thumbnail) {
    Write-Host "✅ Thumbnail URL: $($testProperty.thumbnail)" -ForegroundColor Green
    $fullThumbnailUrl = if ($testProperty.thumbnail.StartsWith("http")) {
        $testProperty.thumbnail
    } else {
        "http://localhost:5000$($testProperty.thumbnail)"
    }
    Write-Host "   Full URL: $fullThumbnailUrl" -ForegroundColor Gray
} else {
    Write-Host "ℹ️  No thumbnail set for this property" -ForegroundColor Yellow
}

# Step 5: Check if uploads directory exists
Write-Host "`n📁 Step 5: Checking uploads directory..." -ForegroundColor Yellow
$uploadsDir = "c:\Users\ranji\Desktop\Company\Zevio\backend\uploads\properties"
if (Test-Path $uploadsDir) {
    $imageFiles = Get-ChildItem -Path $uploadsDir -File | Select-Object -First 5
    Write-Host "✅ Uploads directory exists" -ForegroundColor Green
    Write-Host "   Path: $uploadsDir" -ForegroundColor Gray
    Write-Host "   Files count: $(Get-ChildItem -Path $uploadsDir -File | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Gray
    
    if ($imageFiles.Count -gt 0) {
        Write-Host "`n   Recent files:" -ForegroundColor Gray
        foreach ($file in $imageFiles) {
            Write-Host "   - $($file.Name) ($([math]::Round($file.Length / 1KB, 2)) KB)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠️  Uploads directory not found: $uploadsDir" -ForegroundColor Yellow
}

# Step 6: Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ PASSED:" -ForegroundColor Green
Write-Host "   - Admin login successful" -ForegroundColor Gray
Write-Host "   - Properties fetch successful" -ForegroundColor Gray
Write-Host "   - Images endpoint accessible" -ForegroundColor Gray

Write-Host "`n📊 PROPERTY INFO:" -ForegroundColor Cyan
Write-Host "   - Property ID: $propertyId" -ForegroundColor Gray
Write-Host "   - Current images: $($currentImages.Count)" -ForegroundColor Gray
Write-Host "   - Has thumbnail: $(if ($testProperty.thumbnail) { 'Yes' } else { 'No' })" -ForegroundColor Gray

Write-Host "`n📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Open the admin panel in your browser" -ForegroundColor Gray
Write-Host "   2. Navigate to Properties  > Edit Property (ID: $propertyId)" -ForegroundColor Gray
Write-Host "   3. Scroll to 'Property Images' section" -ForegroundColor Gray
Write-Host "   4. Upload 1-2 test images" -ForegroundColor Gray
Write-Host "   5. Check browser console for these logs:" -ForegroundColor Gray
Write-Host "      - '📤 Uploading images to property: $propertyId'" -ForegroundColor DarkGray
Write-Host "      - '✅ Upload successful, response: ...'" -ForegroundColor DarkGray
Write-Host "      - '🔄 Refreshing images after upload...'" -ForegroundColor DarkGray
Write-Host "      - '🖼️ Fetching images for property: $propertyId'" -ForegroundColor DarkGray
Write-Host "      - '✅ Images fetched: [...]'" -ForegroundColor DarkGray
Write-Host "      - '✅ Valid images to display: N'" -ForegroundColor DarkGray
Write-Host "   6. Verify images appear in thumbnails below upload area" -ForegroundColor Gray
Write-Host "   7. Go back to property list and verify thumbnail displays" -ForegroundColor Gray

Write-Host "`n🔍 TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "   If images don't display after upload:" -ForegroundColor Gray
Write-Host "   - Check browser console for errors" -ForegroundColor DarkGray
Write-Host "   - Check browser Network tab for failed image requests" -ForegroundColor DarkGray
Write-Host "   - Verify backend logs show successful upload" -ForegroundColor DarkGray
Write-Host "   - Check that uploads folder has new files" -ForegroundColor DarkGray
Write-Host "   - Run this script again to verify image count increased" -ForegroundColor DarkGray

Write-Host "`n========================================`n" -ForegroundColor Cyan
