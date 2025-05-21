/**
 * Post-deployment script for Vercel
 * 
 * This script runs after the application is deployed to production.
 * It performs necessary database migrations and other setup tasks.
 * 
 * Usage: Add this as a Vercel post-build step in project settings
 */

const { execSync } = require('child_process');
const { exit } = require('process');

console.log('Running post-deployment tasks...');

try {
  // Run database migrations
  console.log('Applying database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Database migrations applied successfully');

  // Additional post-deployment tasks can be added here
  // For example, seeding the database with initial data

  console.log('All post-deployment tasks completed successfully');
} catch (error) {
  console.error('Error during post-deployment tasks:');
  console.error(error.message);
  exit(1);
}