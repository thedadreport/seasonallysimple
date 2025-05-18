/**
 * Script to install PostgreSQL dependencies
 * 
 * This script installs the necessary dependencies for PostgreSQL
 * and updates the package.json scripts for migration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    log(`Running: ${command}`, colors.blue);
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

// Install PostgreSQL client for Prisma
function installPgDependencies() {
  log('Installing PostgreSQL dependencies...', colors.cyan);
  
  const pgDependencies = [
    '@prisma/client',
    'pg'
  ];
  
  const devDependencies = [
    'prisma'
  ];
  
  // Install dependencies
  const installResult = runCommand(`npm install ${pgDependencies.join(' ')}`);
  if (!installResult.success) {
    log('Failed to install PostgreSQL dependencies!', colors.red);
    return false;
  }
  
  // Install dev dependencies (if not already installed)
  const installDevResult = runCommand(`npm install -D ${devDependencies.join(' ')}`);
  if (!installDevResult.success) {
    log('Failed to install PostgreSQL dev dependencies!', colors.red);
    return false;
  }
  
  log('PostgreSQL dependencies installed successfully!', colors.green);
  return true;
}

// Update package.json with migration scripts
function updatePackageJson() {
  log('Updating package.json with migration scripts...', colors.cyan);
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('package.json not found!', colors.red);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add migration scripts if they don't exist
    packageJson.scripts = packageJson.scripts || {};
    
    // Add new migration scripts
    const newScripts = {
      'migrate:postgres': 'node scripts/migrate-to-postgres.js',
      'db:migrate': 'prisma migrate deploy',
      'db:reset': 'prisma migrate reset --force',
      'db:studio': 'prisma studio'
    };
    
    // Add scripts that don't already exist
    let scriptsAdded = false;
    for (const [key, value] of Object.entries(newScripts)) {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = value;
        scriptsAdded = true;
      }
    }
    
    if (!scriptsAdded) {
      log('Migration scripts already exist in package.json!', colors.yellow);
      return true;
    }
    
    // Save updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    log('package.json updated with migration scripts!', colors.green);
    return true;
  } catch (error) {
    log(`Failed to update package.json: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
async function main() {
  log('\n=== Installing PostgreSQL Dependencies ===', colors.magenta);
  
  if (!installPgDependencies()) {
    process.exit(1);
  }
  
  if (!updatePackageJson()) {
    process.exit(1);
  }
  
  log('\nPostgreSQL dependencies and scripts added successfully!', colors.green);
  log('\nNext steps:', colors.yellow);
  log('1. Set up a PostgreSQL database (using Render, Railway, Supabase, etc.)', colors.yellow);
  log('2. Update .env.production with your PostgreSQL connection string', colors.yellow);
  log('3. Run the migration script: npm run migrate:postgres', colors.yellow);
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});