const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-management');
    console.log('Connected to MongoDB');

    // Update all users without a role field to have role='owner'
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'owner' } }
    );

    console.log(`✓ Migration completed!`);
    console.log(`  - Updated ${result.modifiedCount} user(s) to role='owner'`);
    console.log(`  - ${result.matchedCount} user(s) matched the query`);

    // Show current user stats
    const ownerCount = await User.countDocuments({ role: 'owner' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    console.log(`\nCurrent user distribution:`);
    console.log(`  - Owners: ${ownerCount}`);
    console.log(`  - Staff: ${staffCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUsers();
