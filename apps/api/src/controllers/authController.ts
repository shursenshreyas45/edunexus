import { Request, Response } from 'express';
import { pool } from '../config/db';
import * as crypto from 'crypto';
import { hashPassword, verifyPassword } from '../middleware/authUtils';

import { env } from '../config/env';

export async function register(req: Request, res: Response) {
    try {
        const { email, password, tier } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Strict Input Validation
        const userTier = tier || 'Junior';
        if (!['Junior', 'Senior', 'Mentor'].includes(userTier)) {
            return res.status(400).json({ error: "Invalid tier. Must be one of: 'Junior', 'Senior', 'Mentor'" });
        }

        const hashed = await hashPassword(password);

        // Insert new user and return user object representation
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, tier) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, tier, created_at as "createdAt", updated_at as "updatedAt"`,
            [email, hashed, userTier]
        );

        const user = result.rows[0];

        // Respond with 201 Created and the user object
        res.status(201).json({ user });
    } catch (error: any) {
        // Postgres unique violation code
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await pool.query(
            `SELECT id, password_hash FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate session token signed with the strictly typed JWT_SECRET
        const token = crypto.createHmac('sha256', env.JWT_SECRET).update(crypto.randomBytes(32)).digest('hex');

        // Expiration = current time + 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await pool.query(
            `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
            [user.id, token, expiresAt]
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
