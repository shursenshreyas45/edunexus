"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const getEnvVar = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
    }
    return value;
};
const getEnvVarWithFallback = (key, fallbackKey) => {
    return process.env[key] || process.env[fallbackKey] || '';
};
exports.env = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    // Use DATABASE_URL if set, otherwise fall back to SUPABASE_DB_URL (pre-populated by Supabase)
    DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    SUPABASE_URL: getEnvVarWithFallback('SUPABASE_URL', 'VITE_SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
