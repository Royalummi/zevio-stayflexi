/**
 * COMPREHENSIVE PROPERTY EDIT TEST
 * Tests all aspects of property editing functionality
 * Run: node test-property-edit-comprehensive.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTAwMDEiLCJlbWFpbCI6ImFkbWluQHpldmlvLmNvbSIsInJvbGUiOiJhZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTczODg2MzI2NCwiZXhwIjoxNzM4ODY2ODY0fQ.wtuLygDq8a1sjJvShkLW5TdDm0xN-mLkHRKDBSN-WPQ'; // Update this

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    testResults.issues.push({ test: testName, details });
  }
  if (details) log(`   ${details}`, 'cyan');
}

function logWarning(message) {
  testResults.warnings++;
  log(`⚠️  ${message}`, 'yellow');
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${title}`, 'bold');
  log('='.repeat(60), 'blue');
}

async function testPropertyList() {
  logSection('TEST 1: PROPERTY LIST ENDPOINT');
  
  try {
    const response = await api.get('/admin/properties?limit=1000');
    
    logTest('GET /admin/properties - Status 200', response.status === 200);
    logTest('Response has success flag', response.data.success === true);
    
    const properties = response.data.data.properties || response.data.data || [];
    logTest('Properties array exists', Array.isArray(properties));
    log(`   Found ${properties.length} properties`, 'cyan');
    
    if (properties.length > 0) {
      const firstProperty = properties[0];
      log(`   First property ID: ${firstProperty.id}`, 'cyan');
      log(`   Title: ${firstProperty.title}`, 'cyan');
      log(`   Status: ${firstProperty.status}`, 'cyan');
      
      return firstProperty.id; // Return property ID for further tests
    } else {
      logWarning('No properties found in database - cannot test edit functionality');
      return null;
    }
  } catch (error) {
    logTest('GET /admin/properties', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPropertyDetail(propertyId) {
  logSection('TEST 2: PROPERTY DETAIL ENDPOINT');
  
  try {
    const response = await api.get(`/admin/properties/${propertyId}`);
    
    logTest('GET /admin/properties/:id - Status 200', response.status === 200);
    logTest('Response has success flag', response.data.success === true);
    logTest('Property data exists', response.data.data !== null);
    
    const property = response.data.data;
    
    // Check all critical fields
    logSection('TEST 2.1: BASIC PROPERTY FIELDS');
    logTest('Property has ID', !!property.id, `ID: ${property.id}`);
    logTest('Property has title', !!property.title, `Title: ${property.title}`);
    logTest('Property has vendor_id', !!property.vendor_id, `Vendor: ${property.vendor_id}`);
    logTest('Property has property_type_id', !!property.property_type_id, `Type: ${property.property_type_id}`);
    logTest('Property has status', !!property.status, `Status: ${property.status}`);
    
    // Check location fields
    logSection('TEST 2.2: LOCATION FIELDS');
    logTest('Has address', !!property.address);
    logTest('Has city', !!property.city || !!property.city_name);
    logTest('Has state', !!property.state || !!property.city_state);
    logTest('Has pincode', !!property.pincode);
    logTest('Has latitude', property.latitude !== null && property.latitude !== undefined);
    logTest('Has longitude', property.longitude !== null && property.longitude !== undefined);
    
    // Check pricing fields
    logSection('TEST 2.3: PRICING FIELDS');
    const hasPricePerNight = property.price_per_night !== null && property.price_per_night !== undefined;
    const hasPricingObject = property.pricing && property.pricing.base_price !== null;
    logTest('Has pricing (price_per_night OR pricing.base_price)', hasPricePerNight || hasPricingObject);
    logTest('Has GST percentage', property.gst_percentage !== null || property.pricing?.gst_percentage !== null);
    
    // Check basic details
    logSection('TEST 2.4: PROPERTY DETAILS');
    logTest('Has bedrooms', property.bedrooms !== null);
    logTest('Has bathrooms', property.bathrooms !== null);
    logTest('Has max_guests', property.max_guests !== null);
    logTest('Has description', !!property.description);
    
    // Check photos/images
    logSection('TEST 2.5: PHOTOS/IMAGES');
    const hasPhotos = !!property.photos;
    logTest('Has photos field', hasPhotos);
    
    if (hasPhotos) {
      let photosArray = [];
      try {
        photosArray = typeof property.photos === 'string' ? JSON.parse(property.photos) : property.photos;
        logTest('Photos is valid JSON/array', Array.isArray(photosArray), `Found ${photosArray.length} photos`);
        
        if (photosArray.length > 0) {
          log(`   Photo URLs:`, 'cyan');
          photosArray.slice(0, 3).forEach((url, idx) => {
            log(`   ${idx + 1}. ${url}`, 'cyan');
          });
          if (photosArray.length > 3) log(`   ... and ${photosArray.length - 3} more`, 'cyan');
        } else {
          logWarning('Photos array is empty - no images to display in edit form');
        }
      } catch (e) {
        logTest('Photos JSON parsing', false, 'Invalid JSON in photos field');
      }
    }
    
    // Check guidelines fields  
    logSection('TEST 2.6: GUIDELINES FIELDS');
    logTest('Has check_in_guidelines', property.check_in_guidelines !== null && property.check_in_guidelines !== undefined);
    logTest('Has house_rules_text', property.house_rules_text !== null && property.house_rules_text !== undefined);
    logTest('Has amenities_guide', property.amenities_guide !== null && property.amenities_guide !== undefined);
    logTest('Has safety_information', property.safety_information !== null && property.safety_information !== undefined);
    logTest('Has local_area_info', property.local_area_info !== null && property.local_area_info !== undefined);
    logTest('Has emergency_contacts', property.emergency_contacts !== null && property.emergency_contacts !== undefined);
    
    // Check if any guideline has content
    const hasAnyGuideline = [
      property.check_in_guidelines,
      property.house_rules_text,
      property.amenities_guide,
      property.safety_information,
      property.local_area_info,
      property.emergency_contacts
    ].some(field => field && field.trim() !== '');
    
    if (!hasAnyGuideline) {
      logWarning('All guideline fields are empty - will not display in edit form');
    } else {
      log(`   ✓ At least one guideline field has content`, 'green');
    }
    
    // Check amenities
    logSection('TEST 2.7: AMENITIES');
    const hasAmenities = !!property.amenities;
    logTest('Has amenities field', hasAmenities);
    
    if (hasAmenities) {
      try {
        const amenitiesArray = typeof property.amenities === 'string' ? JSON.parse(property.amenities) : property.amenities;
        logTest('Amenities is valid JSON/array', Array.isArray(amenitiesArray), `Found ${amenitiesArray.length} amenities`);
      } catch (e) {
        logTest('Amenities JSON parsing', false, 'Invalid JSON in amenities field');
      }
    }
    
    // Check JSON fields
    logSection('TEST 2.8: JSON FIELDS VALIDATION');
    const jsonFields = ['house_rules', 'cancellation_policy', 'amenities', 'photos'];
    jsonFields.forEach(field => {
      if (property[field]) {
        try {
          const parsed = typeof property[field] === 'string' ? JSON.parse(property[field]) : property[field];
          logTest(`${field} is valid JSON`, true, typeof parsed);
        } catch (e) {
          logTest(`${field} JSON parsing`, false, 'Invalid JSON');
        }
      } else {
        logTest(`${field} exists`, false, 'Field is null/undefined');
      }
    });
    
    return property;
  } catch (error) {
    logTest('GET /admin/properties/:id', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPropertyImages(propertyId) {
  logSection('TEST 3: PROPERTY IMAGES ENDPOINT');
  
  try {
    const response = await api.get(`/admin/properties/${propertyId}/images`);
    
    logTest('GET /admin/properties/:id/images - Status 200', response.status === 200);
    logTest('Response has success flag', response.data.success === true);
    
    const images = response.data.data || [];
    logTest('Images array exists', Array.isArray(images));
    log(`   Found ${images.length} images`, 'cyan');
    
    if (images.length > 0) {
      log(`   Image details:`, 'cyan');
      images.forEach((img, idx) => {
        logTest(`Image ${idx + 1} has image_url`, !!img.image_url, img.image_url);
        logTest(`Image ${idx + 1} has id`, !!img.id);
      });
      
      // Check for undefined/null URLs that would cause "Failed to load image: undefined"
      const invalidImages = images.filter(img => !img.image_url);
      if (invalidImages.length > 0) {
        logWarning(`Found ${invalidImages.length} images with undefined/null URLs - will cause display errors`);
      }
    } else {
      logWarning('No images found - PropertyImageUpload will show empty state');
    }
    
    return images;
  } catch (error) {
    logTest('GET /admin/properties/:id/images', false, error.response?.data?.message || error.message);
    
    if (error.response?.status === 404) {
      logWarning('Image endpoint not found - backend route may be missing');
    }
    
    return null;
  }
}

async function testDropdownData() {
  logSection('TEST 4: DROPDOWN DATA ENDPOINTS');
  
  // Test cities
  try {
    const citiesRes = await api.get('/admin/cities');
    logTest('GET /admin/cities - Status 200', citiesRes.status === 200);
    const cities = citiesRes.data.data || [];
    logTest('Cities array exists', Array.isArray(cities), `Found ${cities.length} cities`);
  } catch (error) {
    logTest('GET /admin/cities', false, error.response?.data?.message || error.message);
  }
  
  // Test vendors
  try {
    const vendorsRes = await api.get('/admin/vendors');
    logTest('GET /admin/vendors - Status 200', vendorsRes.status === 200);
    const vendors = vendorsRes.data.data || [];
    logTest('Vendors array exists', Array.isArray(vendors), `Found ${vendors.length} vendors`);
  } catch (error) {
    logTest('GET /admin/vendors', false, error.response?.data?.message || error.message);
  }
  
  // Test property types
  try {
    const typesRes = await api.get('/admin/property-types');
    logTest('GET /admin/property-types - Status 200', typesRes.status === 200);
    const types = typesRes.data.data || [];
    logTest('Property types array exists', Array.isArray(types), `Found ${types.length} types`);
  } catch (error) {
    logTest('GET /admin/property-types', false, error.response?.data?.message || error.message);
  }
}

async function runAllTests() {
  log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'bold');
  log('║   COMPREHENSIVE PROPERTY EDIT FUNCTIONALITY TEST           ║', 'bold');
  log('╚════════════════════════════════════════════════════════════╝', 'bold');
  log(`Starting at: ${new Date().toLocaleString()}`, 'cyan');
  
  // Test 1: Get property list
  const propertyId = await testPropertyList();
  
  if (!propertyId) {
    log('\n❌ Cannot continue tests - no properties found', 'red');
    return;
  }
  
  // Test 2: Get property detail
  const property = await testPropertyDetail(propertyId);
  
  // Test 3: Get property images
  await testPropertyImages(propertyId);
  
  // Test 4: Dropdown data
  await testDropdownData();
  
  // Final Summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'bold');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  
  if (testResults.issues.length > 0) {
    logSection('ISSUES FOUND');
    testResults.issues.forEach((issue, idx) => {
      log(`${idx + 1}. ${issue.test}`, 'red');
      if (issue.details) log(`   ${issue.details}`, 'yellow');
    });
  }
  
  // Recommendations
  logSection('RECOMMENDATIONS');
  
  if (testResults.failed > 0) {
    log('🔧 Fix failed tests before deploying to production', 'yellow');
  }
  
  if (testResults.warnings > 0) {
    log('⚠️  Review warnings - they may affect user experience', 'yellow');
  }
  
  if (property) {
    // Analyze specific issues
    if (!property.photos || (typeof property.photos === 'string' && JSON.parse(property.photos).length === 0)) {
      log('📸 Property has no photos - admin will see empty image upload section', 'yellow');
    }
    
    const hasGuidelines = [
      property.check_in_guidelines,
      property.house_rules_text,
      property.amenities_guide
    ].some(field => field && field.trim() !== '');
    
    if (!hasGuidelines) {
      log('📝 Property has no guidelines - admin will see empty rich text editors', 'yellow');
      log('   This may be why user reported "guidelines not displaying"', 'yellow');
    }
  }
  
  log('\n');
  logSection('FRONTEND TESTING INSTRUCTIONS');
  log('1. Open browser: http://localhost:3001/admin', 'cyan');
  log('2. Login with admin credentials', 'cyan');
  log('3. Go to Properties page', 'cyan');
  log(`4. Click "Edit" on property ID: ${propertyId}`, 'cyan');
  log('5. Check if images load in PropertyImageUpload section', 'cyan');
  log('6. Check if guidelines display in rich text editors', 'cyan');
  log('7. Verify all form fields are populated correctly', 'cyan');
  log('8. Try editing a field and saving', 'cyan');
  log('9. Check browser console for any errors', 'cyan');
  
  log('\n✅ Test complete!\n', 'green');
}

// Run all tests
runAllTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
