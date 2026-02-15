const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PNjsxgJjWOaxKycyaXrDjDltFldUFnYc@mainline.proxy.rlwy.net:22453/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkSessionId() {
  try {
    // Check if column exists
    const columnInfo = await pool.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'sessions' AND column_name = 'session_id'`
    );

    console.log('=== Session_id Column Info ===');
    if (columnInfo.rows.length === 0) {
      console.log('❌ session_id column NOT FOUND');
    } else {
      console.log('✅ session_id column EXISTS:');
      console.log(columnInfo.rows[0]);
    }

    // Get sample sessions
    const sessions = await pool.query('SELECT id, session_id, title FROM sessions LIMIT 5');
    console.log('\n=== Sample Sessions ===');
    console.table(sessions.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSessionId();
