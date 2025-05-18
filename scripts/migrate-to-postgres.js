/**
 * Migration script to help transition from SQLite to PostgreSQL
 * 
 * This script:
 * 1. Checks for environment variables
 * 2. Creates necessary Prisma migrations
 * 3. Guides through the data migration process
 * 
 * Usage:
 * 1. Set up PostgreSQL database
 * 2. Update .env.production with PostgreSQL connection
 * 3. Run: node scripts/migrate-to-postgres.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function runCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (!silent) {
      console.log(output);
    }
    return { success: true, output };
  } catch (error) {
    console.error(colors.red + 'Command failed: ' + command + colors.reset);
    console.error(colors.red + error.message + colors.reset);
    return { success: false, error };
  }
}

// Check if PostgreSQL connection string is available
function checkEnvironment() {
  log('Checking environment...', colors.cyan);
  
  // Check if .env or .env.production exists
  const envPath = path.join(process.cwd(), '.env.production');
  const defaultEnvPath = path.join(process.cwd(), '.env');
  
  let postgresUrl = '';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL="postgresql:\/\/[^"]+"/);
    postgresUrl = match ? match[0].split('=')[1].replace(/"/g, '') : '';
  } else if (fs.existsSync(defaultEnvPath)) {
    const envContent = fs.readFileSync(defaultEnvPath, 'utf8');
    const match = envContent.match(/DATABASE_URL="postgresql:\/\/[^"]+"/);
    postgresUrl = match ? match[0].split('=')[1].replace(/"/g, '') : '';
  }
  
  if (!postgresUrl) {
    log('PostgreSQL connection string not found in environment variables!', colors.red);
    log('Please add a valid PostgreSQL connection string to .env.production or .env file:', colors.yellow);
    log('DATABASE_URL="postgresql://username:password@hostname:port/database"', colors.yellow);
    return false;
  }
  
  log('PostgreSQL connection string found!', colors.green);
  return true;
}

// Update Prisma schema to use PostgreSQL
function updatePrismaSchema() {
  log('Updating Prisma schema to use PostgreSQL...', colors.cyan);
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    log('Prisma schema file not found!', colors.red);
    return false;
  }
  
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check if schema is already using PostgreSQL
  if (schemaContent.includes('provider = "postgresql"')) {
    log('Prisma schema is already configured for PostgreSQL!', colors.green);
    return true;
  }
  
  // Update schema to use PostgreSQL
  schemaContent = schemaContent.replace(
    /datasource db {[^}]*provider\s*=\s*"sqlite"[^}]*}/s,
    'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}'
  );
  
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  log('Prisma schema updated to use PostgreSQL!', colors.green);
  return true;
}

// Create a Prisma migration for PostgreSQL
function createPrismaMigration() {
  log('Creating Prisma migration for PostgreSQL...', colors.cyan);
  
  // Use a PostgreSQL-specific environment for the migration
  const result = runCommand('npx prisma migrate dev --name postgresql-migration --create-only');
  
  if (!result.success) {
    log('Failed to create migration!', colors.red);
    return false;
  }
  
  log('Migration created successfully!', colors.green);
  return true;
}

// Guide through data migration process
function migrateData() {
  log('\nData Migration Guide:', colors.magenta);
  log('------------------------', colors.magenta);
  log('To migrate your data from SQLite to PostgreSQL, follow these steps:\n', colors.cyan);
  
  log('1. Export data from SQLite (optional if you want to preserve existing data):', colors.yellow);
  log('   - You can use a tool like sqlite3 to export your data to CSV files');
  log('   - Example: sqlite3 -header -csv prisma/dev.db "SELECT * FROM User;" > users.csv\n');
  
  log('2. Apply the new PostgreSQL migration:', colors.yellow);
  log('   - Run: DATABASE_URL="your_postgres_url" npx prisma migrate deploy\n');
  
  log('3. Import data to PostgreSQL (if needed):', colors.yellow);
  log('   - Use tools like psql or pg_admin to import your data');
  log('   - Example: \\copy "User" FROM \'users.csv\' WITH CSV HEADER\n');
  
  log('4. Verify data in PostgreSQL:', colors.yellow);
  log('   - Run: DATABASE_URL="your_postgres_url" npx prisma studio\n');
  
  log('5. Update your production environment with the PostgreSQL URL', colors.yellow);
  log('   - Update DATABASE_URL in your production environment variables\n');
  
  log('Important Notes:', colors.red);
  log('- Backup your SQLite database before migration');
  log('- Test thoroughly with the new PostgreSQL database before deploying to production');
  log('- Some SQLite-specific features may not work the same in PostgreSQL\n');
}

// Main function to orchestrate the migration
async function main() {
  log('\n=== SQLite to PostgreSQL Migration Tool ===', colors.magenta);
  
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  if (!updatePrismaSchema()) {
    process.exit(1);
  }
  
  if (!createPrismaMigration()) {
    process.exit(1);
  }
  
  log('\nPrisma schema and migration files have been updated for PostgreSQL!', colors.green);
  
  // Generate Prisma client
  log('\nGenerating Prisma client with PostgreSQL support...', colors.cyan);
  const generateResult = runCommand('npx prisma generate');
  
  if (!generateResult.success) {
    log('Failed to generate Prisma client!', colors.red);
    process.exit(1);
  }
  
  // Guide through data migration
  migrateData();
  
  log('\nMigration setup completed successfully!', colors.green);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});