const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testStaffSignup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-management');
    console.log('Connected to MongoDB\n');

    // Create a test staff user
    const staffUser = await User.create({
      name: 'John Staff',
      email: `staff${Date.now()}@example.com`,
      password: 'hashedPassword123', // In real flow, this gets hashed by pre-save hook
      role: 'staff',
      employeeId: 'EMP001',
    });

    console.log('✓ Staff user created successfully!');
    console.log(`  Name: ${staffUser.name}`);
    console.log(`  Email: ${staffUser.email}`);
    console.log(`  Role: ${staffUser.role}`);
    console.log(`  EmployeeId: ${staffUser.employeeId}`);
    console.log('\n');

    // Create a test owner user
    const ownerUser = await User.create({
      name: 'Jane Owner',
      email: `owner${Date.now()}@example.com`,
      password: 'hashedPassword456',
      role: 'owner',
    });

    console.log('✓ Owner user created successfully!');
    console.log(`  Name: ${ownerUser.name}`);
    console.log(`  Email: ${ownerUser.email}`);
    console.log(`  Role: ${ownerUser.role}`);
    console.log('\n');

    // Verify all users in database
    const allUsers = await User.find({});
    console.log(`Total users in database: ${allUsers.length}`);
    console.log('\nAll users:');
    allUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.name} (${user.email}) - Role: ${user.role}${user.employeeId ? `, EmpID: ${user.employeeId}` : ''}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testStaffSignup();
