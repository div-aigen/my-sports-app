const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PNjsxgJjWOaxKycyaXrDjDltFldUFnYc@mainline.proxy.rlwy.net:22453/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '009_add_session_id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration on Railway database...');
    console.log('Migration SQL:');
    console.log(migrationSQL);
    console.log('\n---\n');

    // Run the migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify the column was created
    const result = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'sessions' AND column_name = 'session_id'`
    );

    if (result.rows.length > 0) {
      console.log('✅ session_id column verified:', result.rows[0]);
    }

    // Show sample data
    const sessions = await client.query('SELECT id, session_id, title FROM sessions LIMIT 3');
    console.log('\nSample sessions:');
    console.table(sessions.rows);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
