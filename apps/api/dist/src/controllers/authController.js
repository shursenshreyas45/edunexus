"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const db_1 = require("../config/db");
const crypto = __importStar(require("crypto"));
const authUtils_1 = require("../middleware/authUtils");
const env_1 = require("../config/env");
async function register(req, res) {
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
        const hashed = await (0, authUtils_1.hashPassword)(password);
        // Insert new user and return user object representation
        const result = await db_1.pool.query(`INSERT INTO users (email, password_hash, tier) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, tier, created_at as "createdAt", updated_at as "updatedAt"`, [email, hashed, userTier]);
        const user = result.rows[0];
        // Respond with 201 Created and the user object
        res.status(201).json({ user });
    }
    catch (error) {
        // Postgres unique violation code
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await db_1.pool.query(`SELECT id, password_hash FROM users WHERE email = $1`, [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const isValid = await (0, authUtils_1.verifyPassword)(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate session token signed with the strictly typed JWT_SECRET
        const token = crypto.createHmac('sha256', env_1.env.JWT_SECRET).update(crypto.randomBytes(32)).digest('hex');
        // Expiration = current time + 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db_1.pool.query(`INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`, [user.id, token, expiresAt]);
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
