const User = require('../models/User');

const DEFAULT_ADMIN_PASSWORD = 'Admin@123456';

const initializeAdmin = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.exists({ role: 'admin' });

    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@vacciprofile.com',
      password,
      role: 'admin',
      isActive: true,
    });

    // Never print the password itself — process logs are often shipped elsewhere.
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${admin.email}`);
    if (password === DEFAULT_ADMIN_PASSWORD) {
      console.log('   ⚠️  Using the default password from the README — change it after first login!');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error.message);
  }
};

module.exports = initializeAdmin;
