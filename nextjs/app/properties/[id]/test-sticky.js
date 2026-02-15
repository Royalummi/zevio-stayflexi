// STICKY BOOKING CARD - Browser Console Test Script
// Paste this into browser console (F12) on the property page

console.log("🔍 STICKY BOOKING CARD - DIAGNOSTIC TEST");
console.log("==========================================\n");

// Find the booking sidebar
const sidebar = document.querySelector('[class*="bookingSidebar"]');

if (!sidebar) {
  console.error("❌ CRITICAL: Booking sidebar not found!");
  console.log("Check if the page has loaded correctly.");
} else {
  console.log("✅ Booking sidebar found:", sidebar);

  // Get computed styles
  const styles = window.getComputedStyle(sidebar);

  console.log("\n📊 COMPUTED CSS VALUES:");
  console.log("  position:", styles.position);
  console.log("  top:", styles.top);
  console.log("  z-index:", styles.zIndex);
  console.log("  height:", styles.height);

  // Check viewport width
  const width = window.innerWidth;
  console.log("\n📐 VIEWPORT:");
  console.log("  Width:", width, "px");
  console.log(
    "  Sticky should work:",
    width >= 1024 ? "✅ YES" : "❌ NO (too narrow)",
  );

  // Validation
  console.log("\n🎯 VALIDATION:");

  if (width < 1024) {
    console.warn("⚠️ Viewport too narrow! Resize to 1024px+ to test sticky.");
  } else {
    if (styles.position === "sticky" || styles.position === "-webkit-sticky") {
      console.log("✅ Position is sticky!");
    } else {
      console.error("❌ Position is NOT sticky! Got:", styles.position);
      console.log("   Check if CSS Module loaded correctly.");
    }

    if (styles.top === "32px" || styles.top === "2rem") {
      console.log("✅ Top offset correct (2rem = 32px)");
    } else {
      console.warn("⚠️ Top offset unexpected:", styles.top);
    }

    if (parseInt(styles.zIndex) >= 10) {
      console.log("✅ Z-index is set:", styles.zIndex);
    } else {
      console.warn("⚠️ Z-index might be too low:", styles.zIndex);
    }
  }

  // Check parent overflow
  console.log("\n🔍 CHECKING PARENTS FOR OVERFLOW ISSUES:");
  let parent = sidebar.parentElement;
  let level = 0;
  while (parent && level < 5) {
    const parentStyles = window.getComputedStyle(parent);
    const overflow = parentStyles.overflow;
    const overflowY = parentStyles.overflowY;
    const className = parent.className;

    if (
      overflow.includes("hidden") ||
      overflow.includes("scroll") ||
      overflow.includes("auto") ||
      overflowY.includes("hidden") ||
      overflowY.includes("scroll") ||
      overflowY.includes("auto")
    ) {
      console.error("❌ PARENT HAS OVERFLOW ISSUE:");
      console.log("   Element:", className || parent.tagName);
      console.log("   overflow:", overflow);
      console.log("   overflow-y:", overflowY);
      console.log("   ⚠️ This breaks sticky positioning!");
    }

    parent = parent.parentElement;
    level++;
  }

  // Scroll test
  console.log("\n📜 SCROLL TEST:");
  const initialScroll = window.scrollY;
  console.log("  Current scroll position:", initialScroll, "px");
  console.log("\n💡 TO TEST:");
  console.log("  1. Scroll down the page slowly");
  console.log("  2. Watch the booking card - it should stick at top");
  console.log("  3. Re-run this script to see updated positions");

  // Success criteria
  console.log("\n✅ SUCCESS CRITERIA:");
  console.log("  • position: sticky ✓");
  console.log("  • top: 32px or 2rem ✓");
  console.log("  • viewport width >= 1024px ✓");
  console.log("  • No parent overflow issues ✓");
  console.log("  • Booking card visible while scrolling ✓");
}

console.log("\n==========================================");
console.log(
  "💡 TIP: Scroll down, then run this script again to see if position values change",
);
