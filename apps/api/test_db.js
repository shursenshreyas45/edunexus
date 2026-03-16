require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    await client.connect();
    try {
        const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', ['public']);
        console.log('Tables:', res.rows.map(r => r.tablename).join(', '));

        const users = await client.query('SELECT count(id) FROM users');
        console.log('Users count:', users.rows[0].count);

        const enumRes = await client.query("SELECT unnest(enum_range(NULL::user_tier))");
        console.log('user_tier enum values:', enumRes.rows.map(r => r.unnest).join(', '));

    } catch (e) {
        console.error('Error verifying tables:', e);
    } finally {
        await client.end();
    }
}

test();
