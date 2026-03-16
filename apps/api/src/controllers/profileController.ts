import { Request, Response } from 'express';
import { pool } from '../config/db';

export async function getProfile(req: Request, res: Response) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT p.user_id as "id", p.full_name as "full_name", p.school_name as "school_name", p.batch_year as "batch_year", p.bio as "bio", u.tier
             FROM profiles p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function upsertProfile(req: Request, res: Response) {
    try {
        const userId = req.user.id;
        const { full_name, school_name, batch_year, bio } = req.body;

        if (!full_name) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        const result = await pool.query(
            `INSERT INTO profiles (user_id, full_name, school_name, batch_year, bio)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                full_name = EXCLUDED.full_name,
                school_name = EXCLUDED.school_name,
                batch_year = EXCLUDED.batch_year,
                bio = EXCLUDED.bio,
                updated_at = CURRENT_TIMESTAMP
             RETURNING full_name, school_name, batch_year, bio`,
            [userId, full_name, school_name, batch_year, bio]
        );

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Upsert Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function searchProfiles(req: Request, res: Response) {
    try {
        const { school, tier, name } = req.query;

        let query = `
            SELECT p.user_id as "id", p.full_name, p.school_name, p.batch_year, p.bio, u.tier, u.email
            FROM profiles p
            JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramCount = 1;

        if (school) {
            query += ` AND p.school_name ILIKE $${paramCount}`;
            params.push(`%${school}%`);
            paramCount++;
        }

        if (name) {
            query += ` AND p.full_name ILIKE $${paramCount}`;
            params.push(`%${name}%`);
            paramCount++;
        }

        if (tier && tier !== 'All') {
            query += ` AND u.tier = $${paramCount}`;
            params.push(tier);
            paramCount++;
        }

        // Limit results to prevent massive payloads
        query += ` ORDER BY p.full_name ASC LIMIT 50`;

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Search Profiles Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
