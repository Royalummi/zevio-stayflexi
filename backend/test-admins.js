import db from './src/config/database.js';

async function testAdmins() {
  try {
    const [rows] = await db.query('SELECT id, name, email, status, role FROM admins LIMIT 5');
    console.log('\n=== Admin Users in Database ===');
    console.table(rows);
    
    if (rows.length > 0) {
      console.log('\n✓ Use these credentials to test:');
      console.log(`Email: ${rows[0].email}`);
      console.log('Password: (check if you know the password or reset it)');
    } else {
      console.log('\n✗ No admin users found in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testAdmins();
