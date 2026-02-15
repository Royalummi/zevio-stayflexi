// Test ACTUAL usage vs EXPECTED usage

console.log("\n🐛 Bug Found!\n");

// WRONG: Current code in vendorRoutes.js
console.log('❌ WRONG Usage: authorize(["vendor"])');
const wrongRoles = [["vendor"]]; // This is what ...roles receives when called with array
console.log("   ...roles receives:", wrongRoles);
console.log('   roles.includes("vendor"):', wrongRoles.includes("vendor"));
console.log("   Result: 403 Forbidden! ❌\n");

// RIGHT: How it should be called
console.log('✅ CORRECT Usage: authorize("vendor")');
const rightRoles = ["vendor"]; // This is what ...roles receives when called without array
console.log("   ...roles receives:", rightRoles);
console.log('   roles.includes("vendor"):', rightRoles.includes("vendor"));
console.log("   Result: Authorization Success! ✅\n");

console.log('🔧 Fix: Change authorize(["vendor"]) to authorize("vendor")\n');
