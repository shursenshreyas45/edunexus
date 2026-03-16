import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

// Extend Express Request object
declare global {
    namespace Express {
        interface Request {
            user?: any; // Ideally typed to imported 'User' from packages/shared/types/user.ts
        }
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Find session and join with user to attach properties. 
        // Ensure the session has not expired.
        const result = await pool.query(
            `SELECT u.id, u.email, u.tier, u.created_at as "createdAt", u.updated_at as "updatedAt"
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = $1 AND s.expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }

        // Attach parsed user to the request object
        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
