const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PNjsxgJjWOaxKycyaXrDjDltFldUFnYc@mainline.proxy.rlwy.net:22453/railway',
  ssl: { rejectUnauthorized: false }
});

function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let sessionId = '';
  for (let i = 0; i < 16; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    // Add hyphen after every 4 characters (except at the end)
    if ((i + 1) % 4 === 0 && i !== 15) {
      sessionId += '-';
    }
  }
  return sessionId;
}

async function updateSessionIdFormat() {
  const client = await pool.connect();

  try {
    console.log('Updating session_id column format...\n');

    // Step 1: Change column type to VARCHAR(19) to accommodate hyphens
    console.log('1. Updating column type to VARCHAR(19)...');
    await client.query('ALTER TABLE sessions ALTER COLUMN session_id TYPE VARCHAR(19)');
    console.log('✅ Column type updated\n');

    // Step 2: Get all existing sessions
    console.log('2. Fetching existing sessions...');
    const result = await client.query('SELECT id, session_id FROM sessions');
    console.log(`Found ${result.rows.length} sessions\n`);

    // Step 3: Generate new session_ids for each session
    console.log('3. Regenerating session_ids with new format...');
    for (const session of result.rows) {
      const newSessionId = generateSessionId();
      await client.query(
        'UPDATE sessions SET session_id = $1 WHERE id = $2',
        [newSessionId, session.id]
      );
      console.log(`   Session ${session.id}: ${session.session_id} → ${newSessionId}`);
    }
    console.log('✅ All session_ids regenerated\n');

    // Step 4: Verify the changes
    console.log('4. Verifying changes...');
    const verification = await client.query(
      'SELECT id, session_id, title FROM sessions LIMIT 5'
    );
    console.log('\nSample sessions with new format:');
    console.table(verification.rows);

    console.log('\n✅ Session ID format update completed successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updateSessionIdFormat();
