require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { USER_ROLES } = require('../config/constants');

/**
 * Seed script to create the first admin user
 * Run with: node scripts/seed.js
 */
const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ Role: USER_ROLES.ADMIN });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin.Email}`);
      console.log(`   Role: ${existingAdmin.Role}`);
      console.log('\n💡 To create another admin, use the admin panel or API endpoint.');
      process.exit(0);
    }

    // Default admin credentials (should be changed after first login)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    // Create admin user (first admin is main admin)
    const admin = await User.create({
      Email: adminEmail,
      Password: adminPassword,
      Name: adminName,
      Role: USER_ROLES.ADMIN,
      IsMainAdmin: true, // First admin is main admin
      IsSubAdmin: false,
      IsActive: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.Email);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', admin.Name);
    console.log('🎭 Role:', admin.Role);
    console.log('👑 Is Main Admin:', admin.IsMainAdmin);
    console.log('🆔 User ID:', admin._id);
    console.log('🔐 Referral Code:', admin.ReferralCode);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');
    console.log('💡 You can create more admins using the admin panel or API endpoint.');
    console.log('   Endpoint: POST /api/admin/users/create-admin');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Run seed script
seedAdmin();


