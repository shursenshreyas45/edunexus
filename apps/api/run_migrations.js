require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE user_tier AS ENUM ('Junior', 'Senior', 'Mentor');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        console.log('Created user_tier enum');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                tier user_tier NOT NULL DEFAULT 'Junior',
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
        console.log('Created users and sessions tables');

        const profilesSchema = fs.readFileSync(path.join(__dirname, 'schema_profiles.sql'), 'utf-8');
        const listingsSchema = fs.readFileSync(path.join(__dirname, 'schema_listings.sql'), 'utf-8');
        const postsSchema = fs.readFileSync(path.join(__dirname, 'schema_posts.sql'), 'utf-8');

        try { await client.query(profilesSchema); console.log('Ran schema_profiles.sql'); } catch (e) { console.log('profiles issue: ', e.message); }
        try { await client.query(listingsSchema); console.log('Ran schema_listings.sql'); } catch (e) { console.log('listings issue: ', e.message); }
        try { await client.query(postsSchema); console.log('Ran schema_posts.sql'); } catch (e) { console.log('posts issue: ', e.message); }

        console.log('All migrations executed.');
    } catch (e) {
        console.error('Migration failed', e);
    } finally {
        await client.end();
    }
}

run();
