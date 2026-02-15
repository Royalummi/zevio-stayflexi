// Test the authorize function logic
const roles = ["vendor"];
const req = {
  user: {
    id: "bb60817d-e418-11f0-9f30-00410e2b5e6e",
    email: "vendor1@example.com",
    role: "vendor",
    name: "Luxury Villas Pvt Ltd",
  },
};

console.log("\n🧪 Testing authorize() logic\n");
console.log("Input:");
console.log("  allowedRoles:", roles);
console.log("  req.user:", req.user);
console.log("\nChecks:");
console.log("  req.user exists?", !!req.user);
console.log("  req.user.role:", req.user.role);
console.log("  roles.includes(req.user.role)?", roles.includes(req.user.role));

if (!req.user) {
  console.log("\n❌ Would return: Unauthorized (401)");
} else if (!roles.includes(req.user.role)) {
  console.log("\n❌ Would return: Forbidden (403)");
  console.log("   Reason: Role mismatch");
  console.log(`   Expected: ${roles.join(" or ")}`);
  console.log(`   Got: ${req.user.role}`);
} else {
  console.log("\n✅ Would call: next() - Authorization SUCCESS");
}
