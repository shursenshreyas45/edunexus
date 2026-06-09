"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = createPost;
exports.getPostsFeed = getPostsFeed;
exports.createComment = createComment;
exports.getPostById = getPostById;
const db_1 = require("../config/db");
async function createPost(req, res) {
    try {
        const authorId = req.user.id;
        const { title, content, tags } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        const regex = /#(\w+)/g;
        const extractedTags = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            extractedTags.push(match[1].toLowerCase());
        }
        const rawTagArray = Array.isArray(tags) ? tags : [];
        const bodyTags = rawTagArray.map((t) => t.replace(/^#/, '').toLowerCase());
        const metadata = {
            tags: Array.from(new Set([...extractedTags, ...bodyTags])),
            upvotes: 0
        };
        const result = await db_1.pool.query(`INSERT INTO posts (author_id, title, content, metadata)
             VALUES ($1, $2, $3, $4)
             RETURNING id, author_id as "authorId", title, content, metadata, created_at as "createdAt", updated_at as "updatedAt"`, [authorId, title, content, metadata]);
        res.status(201).json({ post: result.rows[0] });
    }
    catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getPostsFeed(req, res) {
    try {
        // Pagination logic validation
        let limit = parseInt(req.query.limit) || 20;
        let offset = parseInt(req.query.offset) || 0;
        const tag = req.query.tag;
        if (limit > 50)
            limit = 50;
        if (limit < 1)
            limit = 20;
        if (offset < 0)
            offset = 0;
        let query = `
            SELECT p.id, p.author_id as "authorId", p.title, p.content, p.metadata, p.created_at as "createdAt", p.updated_at as "updatedAt",
                   pr.full_name as "authorFullName", pr.school_name as "authorSchoolName",
                   u.email as "authorEmail"
            FROM posts p
            LEFT JOIN profiles pr ON p.author_id = pr.user_id
            LEFT JOIN users u ON p.author_id = u.id
        `;
        const params = [];
        let paramIndex = 1;
        if (tag) {
            const cleanTag = tag.replace(/^#/, '');
            // Case-insensitive filtering using ILIKE
            query += ` WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.metadata->'tags') tag_elem WHERE tag_elem ILIKE $${paramIndex})`;
            params.push(cleanTag);
            paramIndex++;
        }
        query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        const result = await db_1.pool.query(query, params);
        res.status(200).json({ posts: result.rows });
    }
    catch (error) {
        console.error('Get Posts Feed Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createComment(req, res) {
    try {
        const authorId = req.user.id;
        const { id: postId } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const result = await db_1.pool.query(`INSERT INTO comments (post_id, author_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, post_id as "postId", author_id as "authorId", content, created_at as "createdAt", updated_at as "updatedAt"`, [postId, authorId, content]);
        res.status(201).json({ comment: result.rows[0] });
    }
    catch (error) {
        // Postgres foreign key violation explicitly checks if the post exists
        if (error.code === '23503') {
            return res.status(404).json({ error: 'Post not found' });
        }
        console.error('Create Comment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getPostById(req, res) {
    try {
        const { id } = req.params;
        const postResult = await db_1.pool.query(`
            SELECT p.id, p.author_id, p.title, p.content, p.metadata, p.created_at, p.updated_at,
                   pr.full_name, pr.school_name,
                   u.email as author_email
            FROM posts p
            LEFT JOIN profiles pr ON p.author_id = pr.user_id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.id = $1
        `, [id]);
        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const commentsResult = await db_1.pool.query(`
            SELECT c.id, c.content, c.author_id, c.created_at,
                   pr.full_name, pr.school_name
            FROM comments c
            LEFT JOIN profiles pr ON c.author_id = pr.user_id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, [id]);
        res.status(200).json({
            post: postResult.rows[0],
            comments: commentsResult.rows
        });
    }
    catch (error) {
        console.error('Get Post By Id Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
