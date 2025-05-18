# PostgreSQL Migration Guide for Seasonally Simple

This guide walks you through the process of migrating from SQLite (development database) to PostgreSQL (production database).

## Why PostgreSQL?

While SQLite is great for development and testing, PostgreSQL offers:
- Better scalability for production workloads
- Advanced query capabilities and performance optimization
- Support for concurrent access from multiple users/servers
- Better support for complex data types
- Built-in data integrity features

## Prerequisites

Before migrating to PostgreSQL, you need:

1. A PostgreSQL database server 
   - Options include: Render, Railway, Supabase, AWS RDS, DigitalOcean, or self-hosted
   - For hobbyist projects, Render or Railway provide free/affordable options

2. PostgreSQL connection string in this format:
   ```
   postgresql://username:password@hostname:port/database
   ```

## Migration Steps

### 1. Install PostgreSQL Dependencies

Run the installation script to add PostgreSQL dependencies:

```bash
node scripts/install-postgres-deps.js
```

This will:
- Install PostgreSQL client for Node.js
- Add migration scripts to package.json
- Update the necessary dependencies

### 2. Configure PostgreSQL Connection

Create a `.env.production` file (or update your existing one) with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@hostname:port/database"
```

### 3. Run the Migration Script

Execute the migration script:

```bash
npm run migrate:postgres
```

This script will:
- Verify your PostgreSQL connection
- Update the Prisma schema to use PostgreSQL
- Generate migration files
- Guide you through the data migration process

### 4. Data Migration (Optional)

If you have existing data in SQLite that you want to preserve, follow the data export/import guide provided by the migration script.

### 5. Testing Your PostgreSQL Connection

To test the connection:

```bash
# Using your PostgreSQL connection
DATABASE_URL="postgresql://username:password@hostname:port/database" npx prisma studio
```

### 6. Deploy with PostgreSQL

When deploying to production:
1. Ensure your production environment has the correct `DATABASE_URL` environment variable
2. Run `prisma migrate deploy` as part of your deployment process
3. Make sure your production server has network access to the PostgreSQL server

## Troubleshooting

### Connection Issues
- Check that the hostname, port, username, and password are correct
- Verify network connectivity to the database server
- Ensure database firewalls or security groups allow connections from your server

### Migration Errors
- Look for syntax differences between SQLite and PostgreSQL
- Check the Prisma migration logs
- Run `npx prisma migrate reset --force` (in development only) to start fresh

## Common PostgreSQL Hosting Options

### Render
- Offers a free PostgreSQL plan for small projects
- Easy setup with web dashboard
- [Render PostgreSQL Setup Guide](https://render.com/docs/databases)

### Railway
- Simple deployment with Git integration
- Affordable pricing
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)

### Supabase
- Includes PostgreSQL with additional features
- Generous free tier
- [Supabase Setup Guide](https://supabase.com/docs/guides/database)

### AWS RDS
- Enterprise-grade scalability
- More complex setup
- [AWS RDS PostgreSQL Guide](https://aws.amazon.com/rds/postgresql/)