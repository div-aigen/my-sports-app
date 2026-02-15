const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PNjsxgJjWOaxKycyaXrDjDltFldUFnYc@mainline.proxy.rlwy.net:22453/railway',
  ssl: { rejectUnauthorized: false }
});

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding invite_code column...');
    await client.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_invite_code ON sessions(invite_code)`);
    console.log('✅ Column added\n');

    // Generate unique invite codes for all existing sessions
    const sessions = await client.query('SELECT id FROM sessions WHERE invite_code IS NULL');
    console.log(`Generating invite codes for ${sessions.rows.length} sessions...`);

    for (const session of sessions.rows) {
      let code;
      let unique = false;
      // Keep retrying until we get a unique code
      while (!unique) {
        code = generateInviteCode();
        const existing = await client.query('SELECT id FROM sessions WHERE invite_code = $1', [code]);
        if (existing.rows.length === 0) unique = true;
      }
      await client.query('UPDATE sessions SET invite_code = $1 WHERE id = $2', [code, session.id]);
      console.log(`   Session ${session.id}: ${code}`);
    }

    await client.query(`ALTER TABLE sessions ALTER COLUMN invite_code SET NOT NULL`);
    console.log('\n✅ All invite codes generated');

    // Verify
    const result = await client.query('SELECT id, invite_code, title FROM sessions LIMIT 5');
    console.log('\nSample sessions:');
    console.table(result.rows);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
