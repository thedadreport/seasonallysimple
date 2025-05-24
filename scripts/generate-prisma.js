// Script to generate Prisma client without requiring database access
const { exec } = require('child_process');

console.log('Generating Prisma client in deployment-safe mode...');

// Set environment variable to skip migrations during build
process.env.PRISMA_SKIP_MIGRATION_LOCK = 'true';

// Run Prisma generate
exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error generating Prisma client: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Prisma generate stderr: ${stderr}`);
  }
  
  console.log(`Prisma client generated successfully: ${stdout}`);
});