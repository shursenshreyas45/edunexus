"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListing = createListing;
exports.getListingsFeed = getListingsFeed;
exports.getListingById = getListingById;
const db_1 = require("../config/db");
const supabase_1 = require("../config/supabase");
async function uploadImageToSupabase(imageBase64, ownerId) {
    if (!supabase_1.supabase) {
        console.warn('Supabase client not configured — skipping image upload');
        return null;
    }
    // Strip the data URI prefix (e.g. "data:image/jpeg;base64,")
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${ownerId}/${Date.now()}.jpg`;
    const { error } = await supabase_1.supabase.storage
        .from('listings')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false });
    if (error) {
        console.error('Supabase Storage upload error:', error.message);
        return null;
    }
    const { data } = supabase_1.supabase.storage.from('listings').getPublicUrl(fileName);
    return data.publicUrl;
}
async function createListing(req, res) {
    try {
        const ownerId = req.user.id;
        const { title, description, category, condition, price, imageBase64 } = req.body;
        if (!title || !category || condition === undefined || price === undefined) {
            return res.status(400).json({ error: 'Title, category, condition, and price are required' });
        }
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
        // Upload image to Supabase Storage if provided
        let imageUrl = null;
        if (imageBase64 && typeof imageBase64 === 'string') {
            imageUrl = await uploadImageToSupabase(imageBase64, ownerId);
        }
        const result = await db_1.pool.query(`INSERT INTO listings (owner_id, title, description, category, condition, price, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, owner_id as "ownerId", title, description, category, condition, price, status, image_url as "imageUrl", created_at as "createdAt", updated_at as "updatedAt"`, [ownerId, title, description || null, category, Math.floor(condition), parsedPrice.toFixed(2), imageUrl]);
        res.status(201).json({ listing: result.rows[0] });
    }
    catch (error) {
        console.error('Create Listing Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getListingsFeed(req, res) {
    try {
        let limit = parseInt(req.query.limit) || 20;
        let offset = parseInt(req.query.offset) || 0;
        if (limit > 50)
            limit = 50;
        if (limit < 1)
            limit = 20;
        if (offset < 0)
            offset = 0;
        const search = req.query.search;
        let query = `SELECT l.id, l.owner_id as "ownerId", l.title, l.description, l.category,
                    l.condition, l.price, l.status, l.image_url as "imageUrl", l.created_at as "createdAt", l.updated_at as "updatedAt",
                    p.full_name as "ownerFullName", p.school_name as "ownerSchoolName",
                    u.email as "ownerEmail"
             FROM listings l
             LEFT JOIN profiles p ON l.owner_id = p.user_id
             LEFT JOIN users u ON l.owner_id = u.id
             WHERE l.status = 'Available'`;
        const params = [];
        let paramIndex = 1;
        if (search) {
            query += ` AND l.title ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        const result = await db_1.pool.query(query, params);
        res.status(200).json({ listings: result.rows });
    }
    catch (error) {
        console.error('Get Listings Feed Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getListingById(req, res) {
    try {
        const { id } = req.params;
        const result = await db_1.pool.query(`SELECT l.id, l.owner_id as "ownerId", l.title, l.description, l.category,
                    l.condition, l.price, l.status, l.image_url as "imageUrl", l.created_at as "createdAt", l.updated_at as "updatedAt",
                    p.full_name as "ownerFullName", p.school_name as "ownerSchoolName",
                    u.email as "ownerEmail"
             FROM listings l
             LEFT JOIN profiles p ON l.owner_id = p.user_id
             LEFT JOIN users u ON l.owner_id = u.id
             WHERE l.id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.status(200).json({ listing: result.rows[0] });
    }
    catch (error) {
        console.error('Get Listing by ID Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
