import db from "./src/config/database.js";

const propertyIds = [
  "495ba81d-f31f-11f0-8f27-00410e2b5e6e",
  "495d4419-f31f-11f0-8f27-00410e2b5e6e",
  "495ca2b2-f31f-11f0-8f27-00410e2b5e6e",
];

async function debugPropertyAPI() {
  console.log("🔍 Debugging Property API Errors...\n");

  for (const id of propertyIds) {
    console.log(`\n=== Testing Property ID: ${id} ===`);

    try {
      // Test 1: Check if property exists
      const [properties] = await db.query(
        `SELECT p.id, p.title, p.photos, p.city_id, p.vendor_id, p.property_type_id
         FROM properties p
         WHERE p.id = ? AND p.deleted_at IS NULL`,
        [id],
      );

      if (properties.length === 0) {
        console.log(`❌ Property not found in database`);
        continue;
      }

      console.log(`✅ Property found: ${properties[0].title}`);
      console.log(`   City ID: ${properties[0].city_id}`);
      console.log(`   Vendor ID: ${properties[0].vendor_id}`);
      console.log(`   Property Type ID: ${properties[0].property_type_id}`);
      console.log(
        `   Photos: ${properties[0].photos ? properties[0].photos.substring(0, 50) + "..." : "null"}`,
      );

      // Test 2: Check joins
      const [fullQuery] = await db.query(
        `SELECT 
          p.*,
          c.id as city_id,
          c.name as city_name,
          c.state as city_state,
          v.id as vendor_id,
          v.name as vendor_name,
          v.email as vendor_email,
          v.phone as vendor_phone,
          v.gst_number as vendor_gst,
          pt.id as property_type_id,
          pt.name as property_type_name,
          pt.slug as property_type_slug,
          pt.stay_type as property_stay_type,
          pt.icon as property_type_icon,
          pt.description as property_type_description
        FROM properties p
        LEFT JOIN cities c ON p.city_id = c.id
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN property_types pt ON p.property_type_id = pt.id
        WHERE p.id = ? AND p.deleted_at IS NULL`,
        [id],
      );

      if (fullQuery.length === 0) {
        console.log(`❌ Full query returned no results (join issue?)`);
        continue;
      }

      console.log(`✅ Full query successful`);
      console.log(`   City: ${fullQuery[0].city_name || "NULL"}`);
      console.log(`   Vendor: ${fullQuery[0].vendor_name || "NULL"}`);
      console.log(
        `   Property Type: ${fullQuery[0].property_type_name || "NULL"}`,
      );

      // Test 3: Check pricing
      const [pricingData] = await db.query(
        `SELECT * FROM property_pricing WHERE property_id = ?`,
        [id],
      );
      console.log(`✅ Pricing records: ${pricingData.length}`);

      // Test 4: Check amenities
      const [amenitiesData] = await db.query(
        `SELECT 
          a.id,
          a.name,
          a.icon,
          a.category,
          a.description
        FROM property_amenities pa
        JOIN amenities a ON pa.amenity_id = a.id
        WHERE pa.property_id = ?
        ORDER BY a.category, a.name`,
        [id],
      );
      console.log(`✅ Amenities: ${amenitiesData.length}`);

      // Test 5: Check contacts
      const [contactsData] = await db.query(
        `SELECT 
          pc.id,
          pc.contact_type_id,
          pc.name,
          pc.phone,
          pc.email,
          pc.whatsapp,
          pc.alt_contact,
          pc.is_active,
          ct.name as contact_type_name
        FROM property_contacts pc
        LEFT JOIN contact_types ct ON pc.contact_type_id = ct.id
        WHERE pc.property_id = ? AND pc.is_active = 1
        ORDER BY ct.display_order, pc.id`,
        [id],
      );
      console.log(`✅ Contacts: ${contactsData.length}`);

      // Test 6: Check blackout dates
      const [blackoutDates] = await db.query(
        `SELECT id, start_date, end_date, reason, created_by, created_at 
         FROM property_blackout_dates 
         WHERE property_id = ? 
         ORDER BY start_date DESC`,
        [id],
      );
      console.log(`✅ Blackout dates: ${blackoutDates.length}`);

      // Test 7: Check booking stats
      const [bookingStats] = await db.query(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue
        FROM bookings 
        WHERE property_id = ?`,
        [id],
      );
      console.log(`✅ Booking stats query successful`);

      console.log(`\n✅ ALL QUERIES PASSED FOR ${id}`);
    } catch (error) {
      console.error(`\n❌ ERROR for ${id}:`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Code: ${error.code}`);
      console.error(`   SQL: ${error.sql}`);
      console.error(`   Stack: ${error.stack}`);
    }
  }

  console.log("\n\n🏁 Debug complete");
  process.exit(0);
}

debugPropertyAPI();
