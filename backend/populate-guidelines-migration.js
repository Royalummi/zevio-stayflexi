/**
 * MIGRATION: Populate property guidelines with default content
 * This fixes the "guidelines not displaying" issue
 */

import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zevio_villas",
});

const serviceApartmentGuidelines = {
  check_in_guidelines: `<h3>Check-In Instructions</h3>
<ul>
<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>
<li><strong>Check-out Time:</strong> 11:00 AM</li>
<li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li>
<li><strong>Key Collection:</strong> Keys available at reception with valid ID</li>
<li><strong>Security Deposit:</strong> Refundable deposit required at check-in</li>
<li><strong>Parking:</strong> Designated parking slots available</li>
</ul>`,

  house_rules_text: `<h3>House Rules</h3>
<ul>
<li>No smoking inside the apartment</li>
<li>Quiet hours: 10:00 PM - 8:00 AM</li>
<li>No loud music or parties</li>
<li>Maximum guests as per booking confirmation</li>
<li>Pets not allowed unless specified</li>
<li>Visitors allowed between 9:00 AM - 9:00 PM only</li>
</ul>`,

  amenities_guide: `<h3>Amenities Guide</h3>
<ul>
<li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li>
<li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li>
<li><strong>Laundry:</strong> Washing machine available in unit or common area</li>
<li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li>
<li><strong>TV & Entertainment:</strong> Smart TV with streaming services</li>
<li><strong>Housekeeping:</strong> Regular cleaning service included</li>
</ul>`,

  safety_information: `<h3>Safety Information</h3>
<ul>
<li><strong>Fire Extinguisher:</strong> Located near main entrance</li>
<li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li>
<li><strong>Emergency Exits:</strong> Clearly marked on each floor</li>
<li><strong>Security:</strong> 24/7 security personnel on premises</li>
<li><strong>CCTV:</strong> Common areas under surveillance</li>
</ul>`,

  local_area_info: `<h3>Local Area Information</h3>
<ul>
<li><strong>Public Transport:</strong> Metro/bus station within walking distance</li>
<li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li>
<li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li>
<li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li>
<li><strong>ATM:</strong> Banking services available nearby</li>
</ul>`,

  emergency_contacts: `<h3>Emergency Contacts</h3>
<ul>
<li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li>
<li><strong>Reception Desk:</strong> For immediate assistance</li>
<li><strong>Police Emergency:</strong> 100</li>
<li><strong>Fire Service:</strong> 101</li>
<li><strong>Ambulance:</strong> 102</li>
</ul>`,
};

const villaGuidelines = {
  check_in_guidelines: `<h3>Check-In Instructions</h3>
<ul>
<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>
<li><strong>Check-out Time:</strong> 11:00 AM</li>
<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>
<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>
<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>
<li><strong>Parking:</strong> Private parking available on premises</li>
<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>
</ul>`,

  house_rules_text: `<h3>House Rules</h3>
<ul>
<li>No smoking inside the villa (outdoor areas designated)</li>
<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>
<li>Maximum guest capacity strictly enforced</li>
<li>Events or parties require prior written approval</li>
<li>Pets allowed only with prior approval and additional deposit</li>
<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>
<li>BBQ area usage requires permission</li>
</ul>`,

  amenities_guide: `<h3>Amenities Guide</h3>
<ul>
<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>
<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>
<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>
<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>
<li><strong>WiFi:</strong> High-speed internet throughout the property</li>
<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>
<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>
<li><strong>Laundry:</strong> Washer and dryer available</li>
</ul>`,

  safety_information: `<h3>Safety & Security</h3>
<ul>
<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>
<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>
<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>
<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>
<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>
<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>
</ul>`,

  local_area_info: `<h3>Local Area & Attractions</h3>
<ul>
<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>
<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>
<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>
<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>
<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>
<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>
</ul>`,

  emergency_contacts: `<h3>Emergency Contacts</h3>
<ul>
<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>
<li><strong>On-site Caretaker:</strong> For immediate assistance</li>
<li><strong>Security:</strong> 24/7 monitoring service</li>
<li><strong>Police Emergency:</strong> 100</li>
<li><strong>Fire Service:</strong> 101</li>
<li><strong>Ambulance:</strong> 102</li>
<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>
</ul>`,
};

async function populateGuidelines() {
  try {
    console.log("🔄 Starting guidelines population...\n");

    // Get all properties
    const [properties] = await db.query(`
      SELECT id, title, property_type_id, 
             check_in_guidelines, house_rules_text, amenities_guide
      FROM properties 
      WHERE deleted_at IS NULL
    `);

    console.log(`Found ${properties.length} properties\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const property of properties) {
      // Check if guidelines are empty
      const hasGuidelines = [
        property.check_in_guidelines,
        property.house_rules_text,
        property.amenities_guide,
      ].some((field) => field && field.trim().length > 0);

      if (hasGuidelines) {
        console.log(
          `⏭️  Skipping "${property.title}" - already has guidelines`,
        );
        skippedCount++;
        continue;
      }

      // Determine property type
      const isVilla = property.property_type_id === "pt-001";
      const guidelines = isVilla ? villaGuidelines : serviceApartmentGuidelines;

      // Update property
      await db.query(
        `
        UPDATE properties 
        SET 
          check_in_guidelines = ?,
          house_rules_text = ?,
          amenities_guide = ?,
          safety_information = ?,
          local_area_info = ?,
          emergency_contacts = ?
        WHERE id = ?
      `,
        [
          guidelines.check_in_guidelines,
          guidelines.house_rules_text,
          guidelines.amenities_guide,
          guidelines.safety_information,
          guidelines.local_area_info,
          guidelines.emergency_contacts,
          property.id,
        ],
      );

      console.log(
        `✅ Updated "${property.title}" (${isVilla ? "Villa" : "Service Apartment"})`,
      );
      updatedCount++;
    }

    console.log("\n═══════════════════════════════════════");
    console.log(`✅ Migration Complete!`);
    console.log(`   Updated: ${updatedCount} properties`);
    console.log(
      `   Skipped: ${skippedCount} properties (already had guidelines)`,
    );
    console.log(`   Total: ${properties.length} properties`);
    console.log("═══════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Error populating guidelines:", error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run migration
populateGuidelines();
