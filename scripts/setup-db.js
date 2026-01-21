#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function setupDatabase() {
  console.log('🚀 Setting up Garment IMS Database...\n');

  try {
    // Check if sequelize-cli is available
    console.log('1. Checking dependencies...');
    await execAsync('npx sequelize-cli --version');
    console.log('✅ Sequelize CLI is available\n');

    // Run migrations
    console.log('2. Running database migrations...');
    const { stdout: migrateOutput } = await execAsync('npx sequelize-cli db:migrate');
    console.log(migrateOutput);
    console.log('✅ Migrations completed successfully\n');

    // Run seeders
    console.log('3. Seeding initial data...');
    const { stdout: seedOutput } = await execAsync('npx sequelize-cli db:seed:all');
    console.log(seedOutput);
    console.log('✅ Seeding completed successfully\n');

    console.log('🎉 Database setup completed successfully!');
    console.log('\nYou can now start the server with:');
    console.log('npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your .env file configuration');
    console.log('3. Ensure the database exists: CREATE DATABASE garment_ims;');
    console.log('4. Verify database credentials');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;