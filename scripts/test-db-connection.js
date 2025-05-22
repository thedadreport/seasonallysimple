// This script tests the database connection directly
const { PrismaClient } = require('@prisma/client');

// Function to test database connection
async function testConnection() {
  console.log('Testing database connection...');
  
  // Check for DATABASE_URL in environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    return false;
  }
  
  // Log the database URL (masking credentials)
  const maskedUrl = dbUrl.replace(/(postgresql|postgres):\/\/([^:]+):([^@]+)@/, '$1://$2:****@');
  console.log(`Database URL: ${maskedUrl}`);
  
  // Validate URL format
  const isValidFormat = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
  console.log(`URL has valid protocol: ${isValidFormat}`);
  
  // Create Prisma client with explicit URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    }
  });
  
  try {
    // Try to connect by running a simple query
    console.log('Connecting to database...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection successful:', result);
    
    // Check if User table exists
    try {
      const userCount = await prisma.user.count();
      console.log(`User table exists with ${userCount} records`);
    } catch (tableError) {
      console.error('Error accessing User table:', tableError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log(`Test completed. Success: ${success}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });