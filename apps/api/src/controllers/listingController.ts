import { Request, Response } from 'express';
import { pool } from '../config/db';

export async function createListing(req: Request, res: Response) {
    try {
        const ownerId = req.user.id;
        const { title, description, category, condition, price } = req.body;

        if (!title || !category || condition === undefined || price === undefined) {
            return res.status(400).json({ error: 'Title, category, condition, and price are required' });
        }

        // Strict Input Validation per Guideline 13
        if (typeof condition !== 'number' || condition < 1 || condition > 5) {
            return res.status(400).json({ error: 'Condition must be an integer between 1 and 5' });
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Price must be a valid number >= 0' });
        }

        const validCategories = ['Book', 'Notes', 'Bundle', 'Tech'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const result = await pool.query(
            `INSERT INTO listings (owner_id, title, description, category, condition, price)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, owner_id as "ownerId", title, description, category, condition, price, status, created_at as "createdAt", updated_at as "updatedAt"`,
            [ownerId, title, description || null, category, Math.floor(condition), parsedPrice.toFixed(2)]
        );

        res.status(201).json({ listing: result.rows[0] });
    } catch (error) {
        console.error('Create Listing Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getListingsFeed(req: Request, res: Response) {
    try {
        // Pagination logic (Guideline 10)
        let limit = parseInt(req.query.limit as string) || 20;
        let offset = parseInt(req.query.offset as string) || 0;

        // Defensive limits to prevent memory exhaustion
        if (limit > 50) limit = 50;
        if (limit < 1) limit = 20;
        if (offset < 0) offset = 0;

        const search = req.query.search as string;

        let query = `SELECT l.id, l.owner_id as "ownerId", l.title, l.description, l.category, 
                    l.condition, l.price, l.status, l.created_at as "createdAt", l.updated_at as "updatedAt",
                    p.full_name as "ownerFullName", p.school_name as "ownerSchoolName",
                    u.email as "ownerEmail"
             FROM listings l
             LEFT JOIN profiles p ON l.owner_id = p.user_id
             LEFT JOIN users u ON l.owner_id = u.id
             WHERE l.status = 'Available'`;

        const params: any[] = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND l.title ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.status(200).json({ listings: result.rows });
    } catch (error) {
        console.error('Get Listings Feed Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getListingById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT l.id, l.owner_id as "ownerId", l.title, l.description, l.category, 
                    l.condition, l.price, l.status, l.created_at as "createdAt", l.updated_at as "updatedAt",
                    p.full_name as "ownerFullName", p.school_name as "ownerSchoolName",
                    u.email as "ownerEmail"
             FROM listings l
             LEFT JOIN profiles p ON l.owner_id = p.user_id
             LEFT JOIN users u ON l.owner_id = u.id
             WHERE l.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.status(200).json({ listing: result.rows[0] });
    } catch (error) {
        console.error('Get Listing by ID Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
