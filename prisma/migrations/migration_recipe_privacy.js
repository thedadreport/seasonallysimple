/**
 * Migration script to handle existing recipes when adding privacy fields
 * Run this after applying the schema migration with Prisma
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration for existing recipes...');

  // Find the admin user, or create one if not exists
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('No admin user found, creating default admin...');
    
    // Create a default admin (in production, you'd want to set this up properly)
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@seasonallysimple.com',
        role: 'ADMIN',
        name: 'System Admin',
      }
    });
    
    console.log(`Created admin user with ID: ${adminUser.id}`);
  }

  // Update all existing recipes to be public and approved
  const recipeCount = await prisma.recipe.count();
  
  if (recipeCount > 0) {
    console.log(`Found ${recipeCount} existing recipes to update...`);
    
    // Update all recipes at once
    const result = await prisma.$executeRaw`
      UPDATE "Recipe" 
      SET "visibility" = 'PUBLIC', 
          "moderationStatus" = 'APPROVED',
          "publishedAt" = NOW(),
          "moderatedAt" = NOW(),
          "moderatedById" = ${adminUser.id},
          "createdById" = ${adminUser.id}
    `;
    
    console.log(`Updated ${result} recipes to PUBLIC visibility and APPROVED status`);
  } else {
    console.log('No existing recipes to update');
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });