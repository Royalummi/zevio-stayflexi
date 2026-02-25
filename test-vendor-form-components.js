#!/usr/bin/env node

/**
 * SESSION 68: AUTOMATED COMPONENT INTEGRATION TEST
 *
 * This script tests the VendorPropertyForm.jsx premium components
 * by checking file structure, imports, and component usage.
 *
 * Run: node test-vendor-form-components.js
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 SESSION 68: VendorPropertyForm Component Integration Test\n");
console.log("=".repeat(70));
console.log("\n");

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
};

// Test utilities
function test(name, fn) {
  testResults.total++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`✅ PASS: ${name}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Reason: ${result}`);
      testResults.failed++;
      testResults.errors.push({ test: name, error: result });
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
    return false;
  }
}

function warn(message) {
  console.log(`⚠️  WARN: ${message}`);
  testResults.warnings++;
}

function info(message) {
  console.log(`ℹ️  INFO: ${message}`);
}

// Read file helper
function readFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

// Main test file
const VENDOR_FORM_PATH =
  "frontend/src/components/vendor/VendorPropertyForm.jsx";

console.log("📂 TEST GROUP 1: FILE STRUCTURE\n");

test("VendorPropertyForm.jsx exists", () => {
  const exists = fs.existsSync(path.join(__dirname, VENDOR_FORM_PATH));
  return exists ? true : "File does not exist";
});

test("VendorPropertyForm.jsx file size > 1500 lines", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const lineCount = content.split("\n").length;
  info(`File size: ${lineCount} lines`);
  return lineCount >= 1500
    ? true
    : `Only ${lineCount} lines (expected >= 1500)`;
});

console.log("\n📦 TEST GROUP 2: IMPORTS\n");

test("Imports useMemo from React", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasUseMemo =
    content.includes("import React, { useState, useEffect, useMemo }") ||
    content.match(/import\s+.*\{[^}]*useMemo[^}]*\}/);
  return hasUseMemo ? true : "useMemo not imported";
});

test("Imports Lucide icons", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const requiredIcons = [
    "Loader2",
    "Info",
    "MapPin",
    "DollarSign",
    "Calendar",
    "Home",
    "Image",
    "Shield",
    "FileText",
    "Phone",
    "Star",
    "Building",
    "UserCircle",
    "Users",
  ];

  const missingIcons = requiredIcons.filter((icon) => !content.includes(icon));

  if (missingIcons.length === 0) {
    info(`All ${requiredIcons.length} icons imported`);
    return true;
  } else {
    return `Missing icons: ${missingIcons.join(", ")}`;
  }
});

test("Imports FormSection component", () => {
  const content = readFile(VENDOR_FORM_PATH);
  return content.includes('import FormSection from "../admin/FormSection"')
    ? true
    : "FormSection import not found";
});

test("Imports FormProgressBar component", () => {
  const content = readFile(VENDOR_FORM_PATH);
  return content.includes(
    'import FormProgressBar from "../admin/FormProgressBar"',
  )
    ? true
    : "FormProgressBar import not found";
});

test("Imports PropertyImageUpload component", () => {
  const content = readFile(VENDOR_FORM_PATH);
  return content.includes(
    'import PropertyImageUpload from "../admin/PropertyImageUpload"',
  )
    ? true
    : "PropertyImageUpload import not found";
});

test("Imports CityCombobox component", () => {
  const content = readFile(VENDOR_FORM_PATH);
  return content.includes('import CityCombobox from "../admin/CityCombobox"')
    ? true
    : "CityCombobox import not found";
});

test("Imports AmenitiesGrid component", () => {
  const content = readFile(VENDOR_FORM_PATH);
  return content.includes('import AmenitiesGrid from "../admin/AmenitiesGrid"')
    ? true
    : "AmenitiesGrid import not found";
});

test("Uses AdminPropertyFormQuill.css (not VendorPropertyForm.css)", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasAdminCSS = content.includes(
    'import "../admin/AdminPropertyFormQuill.css"',
  );
  const hasVendorCSS = content.includes('import "./VendorPropertyForm.css"');

  if (hasAdminCSS && !hasVendorCSS) {
    return true;
  } else if (hasVendorCSS) {
    return "Still importing VendorPropertyForm.css (should be removed)";
  } else {
    return "AdminPropertyFormQuill.css not imported";
  }
});

console.log("\n🔧 TEST GROUP 3: STATE MANAGEMENT\n");

test("Has formProgress useMemo", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasFormProgress = content.includes("const formProgress = useMemo");
  return hasFormProgress ? true : "formProgress useMemo not found";
});

test("formProgress calculates 7 sections", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const sectionNames = [
    "Basic Info",
    "Location",
    "Property Details",
    "Pricing",
    "Amenities",
    "Contact",
    "Policies",
  ];

  const missingSections = sectionNames.filter(
    (section) => !content.includes(`name: "${section}"`),
  );

  if (missingSections.length === 0) {
    return true;
  } else {
    return `Missing sections in formProgress: ${missingSections.join(", ")}`;
  }
});

test("Has pendingImageUpload state", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasPendingImageUpload = content.includes(
    "const [pendingImageUpload, setPendingImageUpload] = useState(null)",
  );
  return hasPendingImageUpload ? true : "pendingImageUpload state not found";
});

test("Removed obsolete newAmenity state", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasNewAmenity = content.match(
    /const\s+\[newAmenity,\s+setNewAmenity\]/,
  );
  return !hasNewAmenity
    ? true
    : "newAmenity state still exists (should be removed)";
});

test("Removed obsolete addAmenity function", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasAddAmenity = content.match(/const\s+addAmenity\s*=/);
  return !hasAddAmenity
    ? true
    : "addAmenity function still exists (should be removed)";
});

test("Removed obsolete removeAmenity function", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasRemoveAmenity = content.match(/const\s+removeAmenity\s*=/);
  return !hasRemoveAmenity
    ? true
    : "removeAmenity function still exists (should be removed)";
});

console.log("\n🧩 TEST GROUP 4: COMPONENT USAGE\n");

test("Uses FormProgressBar in JSX", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasFormProgressBar = content.includes("<FormProgressBar");
  return hasFormProgressBar ? true : "FormProgressBar not used in JSX";
});

test("FormProgressBar receives completionPercentage prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasCompletionProp = content.includes(
    "completionPercentage={formProgress.percentage}",
  );
  return hasCompletionProp
    ? true
    : "completionPercentage prop not passed to FormProgressBar";
});

test("FormProgressBar receives sections prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasSectionsProp = content.includes("sections={formProgress.sections}");
  return hasSectionsProp ? true : "sections prop not passed to FormProgressBar";
});

test("Uses FormSection components (at least 10)", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const formSectionMatches = content.match(/<FormSection/g);
  const count = formSectionMatches ? formSectionMatches.length : 0;

  info(`Found ${count} FormSection instances`);

  if (count >= 10) {
    return true;
  } else {
    return `Only ${count} FormSection components found (expected >= 10)`;
  }
});

test("FormSection has title prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasTitleProp = content.match(/<FormSection[^>]*title="/);
  return hasTitleProp ? true : "FormSection missing title prop";
});

test("FormSection has icon prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasIconProp = content.match(/<FormSection[^>]*icon=\{/);
  return hasIconProp ? true : "FormSection missing icon prop";
});

test("Uses CityCombobox in JSX", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasCityCombobox = content.includes("<CityCombobox");
  return hasCityCombobox ? true : "CityCombobox not used in JSX";
});

test("CityCombobox receives value prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasValueProp = content.match(
    /<CityCombobox[^>]*value=\{formData\.city_id\}/,
  );
  return hasValueProp ? true : "CityCombobox missing value prop";
});

test("CityCombobox receives onChange prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasOnChangeProp = content.match(/<CityCombobox[^>]*onChange=\{/);
  return hasOnChangeProp ? true : "CityCombobox missing onChange prop";
});

test("Uses AmenitiesGrid in JSX", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasAmenitiesGrid = content.includes("<AmenitiesGrid");
  return hasAmenitiesGrid ? true : "AmenitiesGrid not used in JSX";
});

test("AmenitiesGrid receives selectedAmenities prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasSelectedProp = content.match(
    /<AmenitiesGrid[^>]*selectedAmenities=\{formData\.amenities\}/,
  );
  return hasSelectedProp
    ? true
    : "AmenitiesGrid missing selectedAmenities prop";
});

test("AmenitiesGrid receives onChange prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasOnChangeProp = content.match(/<AmenitiesGrid[^>]*onChange=\{/);
  return hasOnChangeProp ? true : "AmenitiesGrid missing onChange prop";
});

test("Uses PropertyImageUpload in JSX", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasPropertyImageUpload = content.includes("<PropertyImageUpload");
  return hasPropertyImageUpload ? true : "PropertyImageUpload not used in JSX";
});

test("PropertyImageUpload receives propertyId prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasPropertyIdProp = content.match(
    /<PropertyImageUpload[^>]*propertyId=\{propertyId\}/,
  );
  return hasPropertyIdProp
    ? true
    : "PropertyImageUpload missing propertyId prop";
});

test("PropertyImageUpload receives onImagesChange prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasOnImagesChangeProp = content.match(
    /<PropertyImageUpload[^>]*onImagesChange=\{/,
  );
  return hasOnImagesChangeProp
    ? true
    : "PropertyImageUpload missing onImagesChange prop";
});

console.log("\n🎨 TEST GROUP 5: TAILWIND STYLING\n");

test("Uses Tailwind classes (max-w-6xl)", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasTailwind = content.includes("max-w-6xl");
  return hasTailwind ? true : "Tailwind class max-w-6xl not found";
});

test("Uses Tailwind grid classes", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasGrid = content.includes("grid grid-cols-1 md:grid-cols-2");
  return hasGrid ? true : "Tailwind grid classes not found";
});

test("Uses Tailwind button classes", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasButtonClasses =
    content.includes("px-6 py-3") && content.includes("rounded-lg");
  return hasButtonClasses ? true : "Tailwind button classes not found";
});

test("Removed old CSS class references", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const oldClasses = [
    "vendor-property-form",
    "form-header",
    "form-section",
    "btn-primary",
    "btn-cancel",
  ];
  const foundOldClasses = oldClasses.filter((cls) =>
    content.includes(`className="${cls}"`),
  );

  if (foundOldClasses.length === 0) {
    return true;
  } else {
    return `Old CSS classes still present: ${foundOldClasses.join(", ")}`;
  }
});

console.log("\n🔒 TEST GROUP 6: VENDOR-SPECIFIC CONSTRAINTS\n");

test("No vendor_id selector in form", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasVendorIdSelect = content.match(/<select[^>]*name="vendor_id"/);
  return !hasVendorIdSelect
    ? true
    : "vendor_id selector found (should not exist for vendors)";
});

test("Has hasPendingChangeRequest prop", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasProp = content.includes("hasPendingChangeRequest");
  return hasProp ? true : "hasPendingChangeRequest prop not found";
});

test("Displays warning when hasPendingChangeRequest=true", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasWarning = content.includes(
    "This property has a pending change request",
  );
  return hasWarning ? true : "Pending change request warning not found";
});

test("Conditional buttons based on propertyStatus", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasDraftButtons =
    content.includes("Save as Draft") &&
    content.includes("Submit for Approval");
  const hasChangeRequestButton = content.includes("Submit Change Request");
  const hasPendingButton = content.includes("Pending Admin Approval");

  if (hasDraftButtons && hasChangeRequestButton && hasPendingButton) {
    return true;
  } else {
    return "Missing status-based buttons";
  }
});

console.log("\n📊 TEST GROUP 7: LOADING & ERROR STATES\n");

test("Uses Loader2 for loading spinner", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasLoader2 =
    content.includes("<Loader2") || content.includes("Loader2 className");
  return hasLoader2 ? true : "Loader2 spinner not used";
});

test("Shows loading text during submission", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasLoadingText =
    content.includes("Saving...") || content.includes("Submitting...");
  return hasLoadingText ? true : "Loading text not found in buttons";
});

test("Buttons disabled during loading", () => {
  const content = readFile(VENDOR_FORM_PATH);
  const hasDisabledCheck = content.match(/disabled=\{.*loading/);
  return hasDisabledCheck ? true : "Buttons not disabled during loading";
});

console.log("\n");
console.log("=".repeat(70));
console.log("📈 TEST RESULTS SUMMARY");
console.log("=".repeat(70));
console.log(`\nTotal Tests: ${testResults.total}`);
console.log(
  `✅ Passed: ${testResults.passed} (${Math.round((testResults.passed / testResults.total) * 100)}%)`,
);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`⚠️  Warnings: ${testResults.warnings}`);

if (testResults.failed > 0) {
  console.log("\n❌ FAILED TESTS:\n");
  testResults.errors.forEach((err, index) => {
    console.log(`${index + 1}. ${err.test}`);
    console.log(`   ${err.error}\n`);
  });
}

console.log("\n");

if (testResults.failed === 0) {
  console.log("🎉 ALL TESTS PASSED! Component integration is complete.\n");
  process.exit(0);
} else {
  console.log("⚠️  SOME TESTS FAILED. Review the errors above.\n");
  process.exit(1);
}
