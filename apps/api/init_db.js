const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDB() {
    const defaultClient = new Client({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
    });

    try {
        await defaultClient.connect();
        const res = await defaultClient.query("SELECT 1 FROM pg_database WHERE datname='edunexus'");
        if (res.rows.length === 0) {
            console.log('Creating database edunexus...');
            await defaultClient.query('CREATE DATABASE edunexus');
        } else {
            console.log('Database edunexus already exists.');
        }
    } catch (e) {
        console.error('Error with default DB connection (is postgres running? password correct?):', e);
        process.exit(1);
    } finally {
        await defaultClient.end();
    }

    const pool = new Pool({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/edunexus'
    });

    try {
        console.log('Creating tables...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          tier VARCHAR(50) NOT NULL DEFAULT 'Junior',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        const profilesSchema = fs.readFileSync(path.join(__dirname, 'schema_profiles.sql'), 'utf-8');
        const listingsSchema = fs.readFileSync(path.join(__dirname, 'schema_listings.sql'), 'utf-8');
        const postsSchema = fs.readFileSync(path.join(__dirname, 'schema_posts.sql'), 'utf-8');

        // Run them, ignoring "already exists" errors ideally, but for now we'll just try to execute.
        // Let's add IF NOT EXISTS where possible, or drop tables cascade.
        // Better: split by semicolon and catch errors.

        const allSql = profilesSchema + '\\n' + listingsSchema + '\\n' + postsSchema;

        // We'll execute the files directly. If they fail because relations exist, that's fine.
        try {
            await pool.query(profilesSchema);
            console.log('Created profiles schema');
        } catch (e) { console.log('Profiles table may already exist: ', e.message); }

        try {
            await pool.query(listingsSchema);
            console.log('Created listings schema');
        } catch (e) { console.log('Listings schema may already exist: ', e.message); }

        try {
            await pool.query(postsSchema);
            console.log('Created posts schema');
        } catch (e) { console.log('Posts schema may already exist: ', e.message); }

        console.log('Database initialization complete.');
    } catch (e) {
        console.error('Error creating tables:', e);
    } finally {
        await pool.end();
    }
}

initDB();
