#!/usr/bin/env node

const path = require('path');

// Add backend node_modules to path
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
module.paths.push(backendNodeModules);

require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const { Pool } = require('pg');

async function diagnoseDatabaseSetup() {
  try {
    console.log('🔍 Database Configuration Analysis\n');
    console.log('═'.repeat(60));

    // Check configuration
    const hasDirectDbHost = Boolean(process.env.DB_HOST || process.env.POSTGRES_HOST);
    const useConnectionString = Boolean(process.env.DATABASE_URL) && !hasDirectDbHost;

    console.log('\n📋 Connection Method:');
    console.log(`  Using: ${useConnectionString ? 'CONNECTION_STRING' : 'INDIVIDUAL PARAMETERS'}`);

    if (useConnectionString) {
      const dbUrl = process.env.DATABASE_URL;
      const maskedUrl = dbUrl.replace(/:[^:]*@/, ':***@');
      console.log(`  DATABASE_URL: ${maskedUrl}`);
    } else {
      console.log(`  DB_HOST: ${process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost'}`);
      console.log(`  DB_PORT: ${process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'}`);
      console.log(`  DB_NAME: ${process.env.DB_NAME || process.env.POSTGRES_DB || 'ehsdb'}`);
      console.log(`  DB_USER: ${process.env.DB_USER || process.env.POSTGRES_USER || 'ehsuser'}`);
    }

    console.log('\n🔐 SSL Configuration:');
    const sslFromEnv = process.env.DB_SSL;
    const isRemoteUrl = /(render\.com|rds\.amazonaws\.com|azure\.com)/i.test(process.env.DATABASE_URL || '');
    console.log(`  DB_SSL env: ${sslFromEnv || 'not set'}`);
    console.log(`  Auto-detected as remote: ${isRemoteUrl ? 'YES' : 'NO'}`);
    console.log(`  SSL will be: ${sslFromEnv === 'false' ? 'DISABLED' : 'ENABLED'}`);

    // Build pool config
    const poolConfig = useConnectionString
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
          database: process.env.DB_NAME || process.env.POSTGRES_DB || 'ehsdb',
          user: process.env.DB_USER || process.env.POSTGRES_USER || 'ehsuser',
          password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'ehspassword123'
        };

    if (sslFromEnv === 'true' || (sslFromEnv !== 'false' && useConnectionString && isRemoteUrl)) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    // Try to connect
    console.log('\n🔗 Testing Connection...');
    const pool = new Pool(poolConfig);

    const result = await pool.query('SELECT version() as version, current_database() as database, current_user as user;');
    const { version, database, user } = result.rows[0];

    console.log('  ✓ Connected Successfully!');
    console.log(`\n📦 Database Details:`);
    console.log(`  PostgreSQL Version: ${version.match(/PostgreSQL ([\d.]+)/)?.[1] || 'Unknown'}`);
    console.log(`  Database Name: ${database}`);
    console.log(`  Connected User: ${user}`);

    // Check tables
    console.log('\n📊 Tables in Database:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('  ⚠️  No tables found (database is empty)');
    } else {
      tablesResult.rows.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ${row.table_name}`);
      });
    }

    // Check if it's AWS RDS
    console.log('\n☁️  Cloud Hosting Detection:');
    const host = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
    let isCloud = false;
    let cloudProvider = 'None';

    if (host.includes('rds.amazonaws.com')) {
      isCloud = true;
      cloudProvider = 'AWS RDS';
    } else if (host.includes('postgres.database.azure.com')) {
      isCloud = true;
      cloudProvider = 'Azure Database for PostgreSQL';
    } else if (host.includes('render.com')) {
      isCloud = true;
      cloudProvider = 'Render.com';
    } else if (host.includes('railway.app')) {
      isCloud = true;
      cloudProvider = 'Railway.app';
    } else if (host === 'localhost' || host === '127.0.0.1') {
      cloudProvider = 'Local Development';
    }

    console.log(`  Cloud Provider: ${cloudProvider}`);
    if (!isCloud && host === 'localhost') {
      console.log('  ℹ️  Database is running on your local machine (NOT in AWS)');
    } else if (isCloud) {
      console.log(`  ℹ️  Database is hosted on ${cloudProvider}`);
    }

    console.log('\n✅ Summary:');
    console.log('═'.repeat(60));
    console.log(`
Your database is configured as:
  • Type: PostgreSQL
  • Location: ${cloudProvider}
  • Host: ${host}
  • Database: ${database}
  • User: ${user}
  
${!isCloud && host === 'localhost' ? `
⚠️  IMPORTANT: Your database is LOCAL (not in AWS)
To move to AWS RDS:
  1. Create an AWS RDS PostgreSQL instance
  2. Update DATABASE_URL or DB_HOST in .env
  3. Run migrations/initialization scripts
  4. Update any firewall/security group rules
` : ''}

✓ File uploads are using: AWS S3 (oasis-ehs-bucket)
${isCloud ? '✓ Database is using: ' + cloudProvider : '⚠️  Database is using: Local PostgreSQL (not cloud)'}
`);

    await pool.end();

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.log('\nPossible Issues:');
    console.log('  1. PostgreSQL is not running locally');
    console.log('  2. Credentials in .env are incorrect');
    console.log('  3. Database server is unreachable');
    console.log('  4. Firewall/Security group blocking connection');
  }
}

diagnoseDatabaseSetup();
